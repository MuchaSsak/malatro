/**
 * Run rules as pure-ish functions over a cloned draft `RunState`. `engine.ts` wraps them with
 * cloning, persistence and subscriptions. Every function here may mutate `run` freely.
 */
import { evaluateAnswer } from "~/lib/game/answer";
import { CATEGORIES } from "~/lib/game/categories";
import {
  ANTE_BASE,
  BASE_CONSUMABLE_SLOTS,
  BASE_DISCARDS,
  BASE_HAND_SIZE,
  BASE_HANDS,
  BASE_INTEREST_CAP,
  BASE_JOKER_SLOTS,
  BASE_REROLL,
  BIG_BLIND_MULT,
  BLIND_REWARD,
  EDITION_ODDS,
  EDITION_SURCHARGE,
  endlessBase,
  FINAL_ANTE,
  INTEREST_PER,
  MAX_SELECT,
  MONEY_PER_HAND,
  PACK_PRICE,
  PACK_SHAPE,
  RARITY_WEIGHTS,
  SCIAGA_PRICE,
  SHOP_CARD_SLOTS,
  SHOP_WEIGHTS,
  START_MONEY,
  TWIERDZENIE_PRICE,
  VOUCHER_PRICE,
} from "~/lib/game/constants";
import { BOSS_BY_ID, BOSSES } from "~/lib/game/content/bosses";
import { SCIAGA_BY_ID, SCIAGI, TWIERDZENIA, TWIERDZENIE_BY_ID } from "~/lib/game/content/consumables";
import { JOKER_BY_ID, JOKERS } from "~/lib/game/content/jokers";
import { TAG_BY_ID, TAGS } from "~/lib/game/content/tags";
import { VOUCHER_BY_ID, VOUCHERS } from "~/lib/game/content/vouchers";
import { buildDeck, makeCard, sampleTasks, type TaskPool } from "~/lib/game/deck";
import { HAND_BY_ID, HAND_TYPES } from "~/lib/game/hands";
import { Rng } from "~/lib/game/rng";
import { activeBoss, effectiveValue, hasPassive, passiveSum, previewHand, scoreHand } from "~/lib/game/scoring";
import type {
  BlindKind,
  BlindPlan,
  CardInstance,
  CashoutLine,
  ConsumableInstance,
  DifficultyMode,
  Edition,
  Enhancement,
  HandTypeId,
  JokerInstance,
  JokerRarity,
  L10n,
  PackChoice,
  PackKind,
  PackSize,
  RoundState,
  RunState,
  ShopItem,
  ShopState,
} from "~/lib/game/types";

export type Ctx = { pool: TaskPool; rng: Rng; now: number; fx: (fx: Fx) => void };

export type Fx =
  | { kind: "toast"; text: L10n; tone?: "info" | "good" | "bad" }
  | { kind: "joker"; jokerUid: string; text: L10n }
  | { kind: "money"; amount: number }
  | { kind: "levelup"; hand: HandTypeId; level: number }
  | { kind: "sound"; name: string };

export class RuleError extends Error {
  constructor(public readonly text: L10n) {
    super(text.en);
  }
}

const fail = (pl: string, en: string): never => {
  throw new RuleError({ pl, en });
};

/** Derived numbers */

export function blindTarget(run: RunState, kind: BlindKind, bossId: string | null): number {
  const base =
    run.ante <= FINAL_ANTE
      ? ANTE_BASE[run.difficulty][Math.max(0, run.ante - 1)]
      : endlessBase(run.difficulty, run.ante);
  if (kind === "small") return base;
  if (kind === "big") return Math.round(base * BIG_BLIND_MULT);
  const boss = bossId ? BOSS_BY_ID[bossId] : null;
  return Math.round(base * (boss?.targetMult ?? 2));
}

export function voucherSum(run: RunState, kind: string): number {
  let s = 0;
  for (const id of run.vouchers) {
    const e = VOUCHER_BY_ID[id]?.effect as { kind: string; delta?: number } | undefined;
    if (e?.kind === kind) s += e.delta ?? 0;
  }
  return s;
}

export function interestCap(run: RunState): number {
  let cap = BASE_INTEREST_CAP;
  for (const id of run.vouchers) {
    const e = VOUCHER_BY_ID[id]?.effect;
    if (e?.kind === "interest-cap") cap = Math.max(cap, e.cap);
  }
  return cap;
}

export function discountPct(run: RunState): number {
  let pct = 0;
  for (const id of run.vouchers) {
    const e = VOUCHER_BY_ID[id]?.effect;
    if (e?.kind === "discount") pct = Math.max(pct, e.pct);
  }
  return pct;
}

export function jokerSlots(run: RunState): number {
  return run.jokerSlots + run.jokers.filter((j) => j.edition === "negative").length;
}

export function consumableSlots(run: RunState): number {
  return run.consumableSlots + run.consumables.filter((c) => c.isNegative).length;
}

export function debtLimit(run: RunState): number {
  return run.jokers.some((j) => JOKER_BY_ID[j.id]?.passive?.debtLimit) ? 20 : 0;
}

export function canAfford(run: RunState, price: number): boolean {
  return run.money - price >= -debtLimit(run);
}

export function jokerSellValue(j: JokerInstance): number {
  const def = JOKER_BY_ID[j.id];
  const base = Math.max(1, Math.floor((def?.cost ?? 2) / 2));
  const ed = j.edition ? Math.floor(EDITION_SURCHARGE[j.edition] / 2) : 0;
  return base + ed + (j.vars.bonus ?? 0);
}

export function consumableSellValue(): number {
  return 1;
}

/** Run creation */

export function createRun(difficulty: DifficultyMode, seed: string, now: number): RunState {
  const rng = Rng.fromSeed(seed);
  const run: RunState = {
    version: 1,
    id: rng.uid("run"),
    seed,
    rng: rng.state,
    difficulty,
    ante: 1,
    blindIndex: 0,
    phase: "blind-select",
    money: START_MONEY,
    jokerSlots: BASE_JOKER_SLOTS,
    consumableSlots: BASE_CONSUMABLE_SLOTS,
    jokers: [],
    consumables: [],
    vouchers: [],
    tags: [],
    handLevels: Object.fromEntries(HAND_TYPES.map((h) => [h.id, 1])) as Record<HandTypeId, number>,
    handPlays: Object.fromEntries(HAND_TYPES.map((h) => [h.id, 0])) as Record<HandTypeId, number>,
    seen: {},
    blindCounter: 0,
    reserved: [],
    plan: { small: { tag: "t_kasa" }, big: { tag: "t_kasa" }, boss: { bossId: "hak" } },
    round: null,
    shop: null,
    pack: null,
    cashout: null,
    stats: {
      handsPlayed: 0,
      cardsPlayed: 0,
      correctNotes: 0,
      bestHand: 0,
      totalScore: 0,
      rerolls: 0,
      bossesBeaten: 0,
      moneyEarned: 0,
    },
    notes: {},
    known: {},
    lastPlanet: null,
    lastConsumable: null,
    bossHistory: [],
    anteVoucher: null,
    shopsVisited: 0,
    createdAt: now,
    updatedAt: now,
    lostTo: null,
  };
  const r = new Rng(run.rng);
  planAnte(run, r);
  run.rng = r.state;
  return run;
}

function planAnte(run: RunState, rng: Rng) {
  const isFinisherAnte = run.ante % FINAL_ANTE === 0;
  let pool = BOSSES.filter((b) => (isFinisherAnte ? b.isFinisher : !b.isFinisher && b.minAnte <= run.ante));
  const fresh = pool.filter((b) => !run.bossHistory.includes(b.id));
  if (fresh.length) pool = fresh;
  const boss = rng.pick(pool);
  run.bossHistory.push(boss.id);
  const tagPool = TAGS.filter((t) => t.minAnte <= run.ante);
  run.plan = {
    small: { tag: rng.pick(tagPool).id },
    big: { tag: rng.pick(tagPool).id },
    boss: { bossId: boss.id },
  } satisfies BlindPlan;
  run.anteVoucher = rollVoucher(run, rng);
}

function rollVoucher(run: RunState, rng: Rng, exclude: string[] = []): string | null {
  const avail = VOUCHERS.filter(
    (v) =>
      !run.vouchers.includes(v.id) && !exclude.includes(v.id) && (!v.requires || run.vouchers.includes(v.requires)),
  );
  return avail.length ? rng.pick(avail).id : null;
}

/** Blind select */

export function currentBlindKind(run: RunState): BlindKind {
  return (["small", "big", "boss"] as const)[run.blindIndex];
}

export function selectBlind(run: RunState, ctx: Ctx) {
  if (run.phase !== "blind-select") fail("Nie teraz", "Not now");
  startRound(run, ctx);
}

export function skipBlind(run: RunState, ctx: Ctx) {
  if (run.phase !== "blind-select") fail("Nie teraz", "Not now");
  const kind = currentBlindKind(run);
  if (kind === "boss") fail("Bossa nie można pominąć", "The Boss Blind cannot be skipped");
  const tagId = kind === "small" ? run.plan.small.tag : run.plan.big.tag;
  run.blindIndex = (run.blindIndex + 1) as 0 | 1 | 2;
  gainTag(run, ctx, tagId);
  ctx.fx({ kind: "sound", name: "skip" });
}

function gainTag(run: RunState, ctx: Ctx, tagId: string) {
  const doubleIdx = run.tags.indexOf("t_podwojny");
  const copies = tagId !== "t_podwojny" && doubleIdx >= 0 ? 2 : 1;
  if (copies === 2) run.tags.splice(doubleIdx, 1);
  for (let i = 0; i < copies; i++) applyTag(run, ctx, tagId);
}

function applyTag(run: RunState, ctx: Ctx, tagId: string) {
  const tag = TAG_BY_ID[tagId];
  if (!tag) return;
  ctx.fx({ kind: "toast", text: tag.name, tone: "good" });
  switch (tag.effect.kind) {
    case "pack":
      openPack(run, ctx, tag.effect.pack, "mega", "blind-select");
      return;
    case "money-double":
      run.money += Math.max(0, Math.min(run.money, tag.effect.max));
      return;
    case "money":
      run.money += tag.effect.amount;
      return;
    default:
      run.tags.push(tag.id);
  }
}

function consumeTag(run: RunState, tagId: string): boolean {
  const i = run.tags.indexOf(tagId);
  if (i < 0) return false;
  run.tags.splice(i, 1);
  return true;
}

/** Round */

function startRound(run: RunState, ctx: Ctx) {
  const kind = currentBlindKind(run);
  const bossId = kind === "boss" ? run.plan.boss.bossId : null;
  const round: RoundState = {
    blind: kind,
    bossId,
    target: blindTarget(run, kind, bossId),
    score: 0,
    handsLeft: BASE_HANDS + voucherSum(run, "hands") + passiveSum(run, "hands"),
    discardsLeft: BASE_DISCARDS + voucherSum(run, "discards") + passiveSum(run, "discards"),
    handSize: BASE_HAND_SIZE + voucherSum(run, "hand-size") + passiveSum(run, "handSize"),
    deck: [],
    hand: [],
    selected: [],
    discardPile: [],
    handTypesPlayed: [],
    pending: null,
    handsPlayed: 0,
    flags: {},
    forcedUid: null,
    startedAt: ctx.now,
    deadline: null,
  };
  let juggle = 0;
  while (consumeTag(run, "t_zonglerka")) juggle += 3;
  round.handSize += juggle;
  run.round = round;
  const boss = activeBoss(run, round);
  if (boss?.kind === "needle") round.handsLeft = 1;
  if (boss?.kind === "water") round.discardsLeft = 0;
  if (boss?.kind === "hand-size") round.handSize = Math.max(1, round.handSize + boss.delta);
  if (boss?.kind === "clock") round.deadline = ctx.now + boss.seconds * 1000;
  if (boss?.kind === "curator") {
    ctx.rng.shuffle(run.jokers);
    round.flags.curator = 1;
  }
  run.blindCounter += 1;
  round.deck = buildDeck(ctx.pool, run, ctx.rng, { isHard: boss?.kind === "hard" });
  run.reserved = [];
  run.phase = "round";
  drawToHand(run, ctx);
  if (boss?.kind === "examiner" && round.hand.length) {
    round.forcedUid = ctx.rng.pick(round.hand).uid;
    round.selected = [round.forcedUid];
  }
  ctx.fx({ kind: "sound", name: "deal" });
}

function drawToHand(run: RunState, ctx: Ctx) {
  const round = run.round!;
  const boss = activeBoss(run, round);
  const drawn: CardInstance[] = [];
  while (round.hand.length < round.handSize && round.deck.length) {
    const c = round.deck.pop()!;
    if (boss?.kind === "fog" && ctx.rng.chance(1 / 3)) c.isFaceDown = true;
    run.seen[c.taskId] = run.blindCounter;
    round.hand.push(c);
    drawn.push(c);
  }
  const signReveals = run.vouchers.reduce((s, id) => {
    const e = VOUCHER_BY_ID[id]?.effect;
    return s + (e?.kind === "reveal-sign-on-draw" ? e.count : 0);
  }, 0);
  if (signReveals && drawn.length) {
    const hidden = round.hand.filter((c) => !c.reveal);
    ctx.rng.shuffle(hidden);
    for (const c of hidden.slice(0, signReveals)) c.reveal = "sign";
  }
}

export function toggleSelect(run: RunState, uid: string) {
  const round = run.round;
  if (!round || round.pending) return;
  if (uid === round.forcedUid) return;
  if (round.selected.includes(uid)) round.selected = round.selected.filter((u) => u !== uid);
  else if (round.selected.length < MAX_SELECT) round.selected.push(uid);
}

export function clearSelection(run: RunState) {
  if (!run.round) return;
  run.round.selected = run.round.forcedUid ? [run.round.forcedUid] : [];
}

export function reorderHand(run: RunState, uids: string[]) {
  const round = run.round;
  if (!round) return;
  const byUid = new Map(round.hand.map((c) => [c.uid, c]));
  const next = uids.map((u) => byUid.get(u)).filter((c): c is CardInstance => !!c);
  if (next.length === round.hand.length) round.hand = next;
}

export function sortHand(run: RunState, pool: TaskPool, by: "suit" | "note") {
  const round = run.round;
  if (!round) return;
  const suitOrder = ["alg", "fun", "geo", "rac"];
  const catOrder = Object.keys(CATEGORIES);
  if (by === "suit") {
    round.hand.sort((a, b) => {
      const ta = pool.byId.get(a.taskId)!;
      const tb = pool.byId.get(b.taskId)!;
      return (
        suitOrder.indexOf(CATEGORIES[ta.cat].suit) - suitOrder.indexOf(CATEGORIES[tb.cat].suit) ||
        catOrder.indexOf(ta.cat) - catOrder.indexOf(tb.cat)
      );
    });
  } else {
    const noteVal = (c: CardInstance) => {
      const n = run.notes[c.taskId];
      const v = n ? Number(n.replace(",", ".")) : NaN;
      return Number.isFinite(v) ? v : -Infinity;
    };
    round.hand.sort((a, b) => noteVal(b) - noteVal(a));
  }
}

export function validatePlay(run: RunState, pool: TaskPool): L10n | null {
  const round = run.round;
  if (!round || run.phase !== "round" || round.pending) return { pl: "Nie teraz", en: "Not now" };
  if (round.selected.length === 0) return { pl: "Wybierz karty", en: "Select cards" };
  if (round.handsLeft <= 0) return { pl: "Brak rąk", en: "No hands left" };
  const boss = activeBoss(run, round);
  if (boss?.kind === "must-five" && round.selected.length !== 5)
    return { pl: "Musisz zagrać 5 kart", en: "Must play 5 cards" };
  const played = round.selected.map((u) => round.hand.find((c) => c.uid === u)!).filter(Boolean);
  if (played.some((c) => !c.isFaceDown && evaluateAnswer(run.notes[c.taskId] ?? "") === null))
    return { pl: "Wpisz odpowiedź na każdej zaznaczonej karcie", en: "Write an answer on every selected card" };
  const type = previewHand(run, round, played, pool).handType;
  if (boss?.kind === "eye" && round.handTypesPlayed.includes(type))
    return { pl: "Ten układ już był", en: "Hand type already played" };
  if (boss?.kind === "mouth" && round.handTypesPlayed.length && round.handTypesPlayed[0] !== type)
    return {
      pl: `Tylko: ${HAND_BY_ID[round.handTypesPlayed[0]].name.pl}`,
      en: `Only: ${HAND_BY_ID[round.handTypesPlayed[0]].name.en}`,
    };
  return null;
}

export function playHand(run: RunState, ctx: Ctx) {
  const err = validatePlay(run, ctx.pool);
  if (err) throw new RuleError(err);
  const round = run.round!;
  const played = round.selected.map((u) => round.hand.find((c) => c.uid === u)!);
  // face-down cards are revealed when played (and exempt from the answer requirement)
  const faceDownUids = played.filter((c) => c.isFaceDown).map((c) => c.uid);
  for (const c of played) c.isFaceDown = false;
  const boss = activeBoss(run, round);
  if (boss?.kind === "resit" && run.jokers.length) {
    for (const j of run.jokers) j.isDisabled = false;
    ctx.rng.pick(run.jokers).isDisabled = true;
  }
  const result = scoreHand({ run, round, played, pool: ctx.pool, rng: ctx.rng, faceDownUids });
  round.pending = { played, result };
  round.hand = round.hand.filter((c) => !played.some((p) => p.uid === c.uid));
  round.selected = [];
  round.handsLeft -= 1;
  round.handsPlayed += 1;
  if (boss?.kind === "tooth") run.money -= played.length;
}

/** Called by the UI after the scoring animation. */
export function resolvePlay(run: RunState, ctx: Ctx) {
  const round = run.round;
  if (!round?.pending) return;
  const { played, result } = round.pending;
  round.pending = null;
  round.score += result.total;
  run.money += result.moneyGained;
  run.stats.moneyEarned += Math.max(0, result.moneyGained);
  run.stats.handsPlayed += 1;
  run.stats.cardsPlayed += played.length;
  run.stats.correctNotes += result.correctNotes;
  run.stats.bestHand = Math.max(run.stats.bestHand, result.total);
  run.stats.totalScore += result.total;
  for (const c of played) {
    run.known[c.taskId] = "value";
    round.discardPile.push(c);
  }
  for (const j of run.jokers) j.isDisabled = false;

  if (round.score >= round.target) {
    winRound(run, ctx);
    return;
  }
  if (round.handsLeft <= 0) {
    loseRun(run);
    return;
  }
  const boss = activeBoss(run, round);
  if (boss?.kind === "hook") {
    const victims = ctx.rng
      .shuffle([...round.hand])
      .filter((c) => c.uid !== round.forcedUid)
      .slice(0, 2);
    round.hand = round.hand.filter((c) => !victims.includes(c));
    round.discardPile.push(...victims);
  }
  drawToHand(run, ctx);
  if (run.jokers.some((j) => j.id === "wrozbita")) {
    const hidden = round.hand.filter((c) => c.reveal !== "value");
    if (hidden.length) {
      const c = ctx.rng.pick(hidden);
      c.reveal = "value";
      const w = run.jokers.find((j) => j.id === "wrozbita")!;
      ctx.fx({ kind: "joker", jokerUid: w.uid, text: { pl: "Przepowiednia!", en: "Foreseen!" } });
    }
  }
  if (round.hand.length === 0) loseRun(run);
}

export function discardSelected(run: RunState, ctx: Ctx) {
  const round = run.round;
  if (!round || run.phase !== "round" || round.pending) return;
  if (round.discardsLeft <= 0) fail("Brak zrzutek", "No discards left");
  const sel = round.selected.filter((u) => u !== round.forcedUid);
  if (sel.length === 0) fail("Wybierz karty", "Select cards");
  const cards = round.hand.filter((c) => sel.includes(c.uid));
  round.hand = round.hand.filter((c) => !sel.includes(c.uid));
  round.discardPile.push(...cards);
  round.selected = round.forcedUid ? [round.forcedUid] : [];
  round.discardsLeft -= 1;
  for (const j of run.jokers) {
    JOKER_BY_ID[j.id]?.onDiscard?.({ run, round, joker: j, count: cards.length });
  }
  drawToHand(run, ctx);
  ctx.fx({ kind: "sound", name: "discard" });
}

export function timeUp(run: RunState) {
  const round = run.round;
  if (!round || !round.deadline) return;
  round.deadline = null;
  round.handsLeft = Math.min(round.handsLeft, 1);
}

function winRound(run: RunState, ctx: Ctx) {
  const round = run.round!;
  const lines: CashoutLine[] = [];
  const boss = round.bossId ? BOSS_BY_ID[round.bossId] : null;
  const reward = round.blind === "boss" ? (boss?.reward ?? BLIND_REWARD.boss) : BLIND_REWARD[round.blind];
  lines.push({ label: { pl: "Nagroda za próg", en: "Blind reward" }, money: reward, tone: "blind" });
  if (round.handsLeft > 0)
    lines.push({
      label: { pl: `Pozostałe ręce (${round.handsLeft})`, en: `Remaining hands (${round.handsLeft})` },
      money: round.handsLeft * MONEY_PER_HAND,
      tone: "hands",
    });
  // end-of-round jokers (payouts, decay, confiscation)
  const survivors: JokerInstance[] = [];
  for (const j of run.jokers) {
    const def = JOKER_BY_ID[j.id];
    const res = def?.onRoundEnd?.({ run, round, joker: j, rng: ctx.rng });
    if (res?.money) lines.push({ label: def!.name, money: res.money, tone: "joker" });
    if (res?.destroy) {
      ctx.fx({
        kind: "toast",
        text: { pl: `${def!.name.pl}: ${res.text?.pl ?? ""}`, en: `${def!.name.en}: ${res.text?.en ?? ""}` },
        tone: "bad",
      });
      continue;
    }
    survivors.push(j);
  }
  run.jokers = survivors;
  if (round.blind === "boss" && consumeTag(run, "t_inwestycja"))
    lines.push({ label: { pl: "Znacznik inwestycji", en: "Investment Tag" }, money: 25, tone: "other" });
  const interest = Math.min(interestCap(run), Math.floor(Math.max(0, run.money) / INTEREST_PER));
  if (interest > 0)
    lines.push({
      label: { pl: `Odsetki ($1 za każde $${INTEREST_PER})`, en: `Interest ($1 per $${INTEREST_PER})` },
      money: interest,
      tone: "interest",
    });
  const total = lines.reduce((s, l) => s + l.money, 0);
  run.cashout = { lines, total };
  run.phase = "cashout";
  if (round.blind === "boss") {
    run.stats.bossesBeaten += 1;
    if (run.ante === FINAL_ANTE && !run.endless) {
      run.phase = "won";
      run.money += total;
      return;
    }
    run.ante += 1;
    run.blindIndex = 0;
    planAnte(run, ctx.rng);
  } else {
    run.blindIndex = (run.blindIndex + 1) as 0 | 1 | 2;
  }
  ctx.fx({ kind: "sound", name: "win" });
}

function loseRun(run: RunState) {
  const round = run.round!;
  run.lostTo = { ante: run.ante, blind: round.blind, bossId: round.bossId, score: round.score, target: round.target };
  run.phase = "gameover";
}

export function continueEndless(run: RunState, ctx: Ctx) {
  if (run.phase !== "won") return;
  run.endless = true;
  run.ante += 1;
  run.blindIndex = 0;
  planAnte(run, ctx.rng);
  run.cashout = null;
  enterShop(run, ctx);
}

export function cashOut(run: RunState, ctx: Ctx) {
  if (run.phase !== "cashout" || !run.cashout) return;
  run.money += run.cashout.total;
  run.stats.moneyEarned += run.cashout.total;
  ctx.fx({ kind: "money", amount: run.cashout.total });
  run.cashout = null;
  run.round = null;
  enterShop(run, ctx);
}

/** Shop */

function rollEdition(rng: Rng, allowNegative: boolean): Edition | undefined {
  const r = rng.next();
  let acc = 0;
  for (const [ed, p] of Object.entries(EDITION_ODDS) as [Edition, number][]) {
    if (ed === "negative" && !allowNegative) continue;
    acc += p;
    if (r < acc) return ed;
  }
  return undefined;
}

export function rollJoker(run: RunState, rng: Rng, rarity?: JokerRarity): JokerInstance {
  const owned = new Set(run.jokers.map((j) => j.id));
  const pickRarity =
    rarity ?? rng.weighted(Object.keys(RARITY_WEIGHTS) as (keyof typeof RARITY_WEIGHTS)[], (k) => RARITY_WEIGHTS[k]);
  let pool = JOKERS.filter((j) => j.rarity === pickRarity && !owned.has(j.id));
  if (!pool.length) pool = JOKERS.filter((j) => j.rarity === "common");
  const def = rng.pick(pool);
  return {
    uid: rng.uid("j"),
    id: def.id,
    edition: rollEdition(rng, true),
    vars: def.initVars?.() ?? {},
  };
}

function rollSciaga(rng: Rng, allowSoul: boolean): string {
  if (allowSoul && rng.chance(0.004)) return "natchnienie";
  return rng.weighted(
    SCIAGI.filter((s) => s.weight > 0),
    (s) => s.weight,
  ).id;
}

function rollTwierdzenie(run: RunState, rng: Rng, exclude: string[] = []): string {
  const pool = TWIERDZENIA.filter(
    (t) => !exclude.includes(t.id) && (!HAND_BY_ID[t.hand].isSecret || (run.handPlays[t.hand] ?? 0) > 0),
  );
  return rng.pick(pool.length ? pool : TWIERDZENIA.filter((t) => !HAND_BY_ID[t.hand].isSecret)).id;
}

function rollTaskCard(run: RunState, ctx: Ctx, isPack: boolean): CardInstance | null {
  const [task] = sampleTasks(ctx.pool, run, ctx.rng, 1, {
    exclude: new Set(run.reserved.map((c) => c.taskId)),
  });
  if (!task) return null;
  const card = makeCard(ctx.rng, task.id);
  const enhChance = isPack ? 0.4 : 0.25;
  if (ctx.rng.chance(enhChance)) {
    card.enh = ctx.rng.pick<Enhancement>(["bonus", "mult", "glass", "lucky"]);
  }
  const ed = rollEdition(ctx.rng, false);
  if (ed && ed !== "negative") card.edition = ed;
  else if (ctx.rng.chance(0.06)) card.edition = ctx.rng.pick(["foil", "holo", "poly"] as const);
  return card;
}

function discounted(run: RunState, price: number): number {
  const pct = discountPct(run);
  return Math.max(0, Math.floor(price * (1 - pct / 100)));
}

function taskPrice(run: RunState, ctx: Ctx, card: CardInstance): number {
  const t = ctx.pool.byId.get(card.taskId)!;
  let p = 1 + Math.ceil(t.diff / 2);
  if (card.enh) p += 1;
  if (card.edition) p += EDITION_SURCHARGE[card.edition];
  return p;
}

function rollShopItem(run: RunState, ctx: Ctx): ShopItem {
  const type = ctx.rng.weighted(Object.keys(SHOP_WEIGHTS) as (keyof typeof SHOP_WEIGHTS)[], (k) => SHOP_WEIGHTS[k]);
  if (type === "task") {
    const card = rollTaskCard(run, ctx, false);
    if (card) return { uid: ctx.rng.uid("s"), type: "task", card, price: discounted(run, taskPrice(run, ctx, card)) };
  }
  if (type === "sciaga") {
    const item: ConsumableInstance = { uid: ctx.rng.uid("k"), kind: "sciaga", id: rollSciaga(ctx.rng, false) };
    return { uid: ctx.rng.uid("s"), type: "consumable", item, price: discounted(run, SCIAGA_PRICE) };
  }
  if (type === "twierdzenie") {
    const item: ConsumableInstance = { uid: ctx.rng.uid("k"), kind: "twierdzenie", id: rollTwierdzenie(run, ctx.rng) };
    return { uid: ctx.rng.uid("s"), type: "consumable", item, price: discounted(run, TWIERDZENIE_PRICE) };
  }
  const joker = rollJoker(run, ctx.rng);
  const def = JOKER_BY_ID[joker.id];
  const price = def.cost + (joker.edition ? EDITION_SURCHARGE[joker.edition] : 0);
  return { uid: ctx.rng.uid("s"), type: "joker", joker, price: discounted(run, price) };
}

function rollPack(run: RunState, ctx: Ctx): { kind: PackKind; size: PackSize } {
  const kind = ctx.rng.weighted<PackKind>(["zadania", "sciagi", "twierdzenia", "jokery"], (k) =>
    k === "jokery" ? 1.5 : 4,
  );
  const r = ctx.rng.next();
  const size: PackSize = r < 0.68 ? "normal" : r < 0.92 ? "jumbo" : "mega";
  return { kind, size };
}

function enterShop(run: RunState, ctx: Ctx) {
  run.phase = "shop";
  run.shopsVisited += 1;
  const slots = SHOP_CARD_SLOTS + voucherSum(run, "shop-slots");
  const items: ShopState["items"] = [];
  for (let i = 0; i < slots; i++) items.push(rollShopItem(run, ctx));
  if (consumeTag(run, "t_rzadki")) {
    const joker = rollJoker(run, ctx.rng, "rare");
    items[0] = { uid: ctx.rng.uid("s"), type: "joker", joker, price: 0 };
  }
  const packs = [0, 1].map(() => {
    const p = run.shopsVisited === 1 ? { kind: "jokery" as const, size: "normal" as const } : rollPack(run, ctx);
    return { uid: ctx.rng.uid("p"), ...p, price: discounted(run, PACK_PRICE[p.size]) };
  });
  if (run.shopsVisited === 1) {
    const p = rollPack(run, ctx);
    packs[1] = { uid: ctx.rng.uid("p"), ...p, price: discounted(run, PACK_PRICE[p.size]) };
  }
  if (consumeTag(run, "t_kupon")) {
    for (const it of items) it.price = 0;
    for (const p of packs) p.price = 0;
  }
  const vouchers: ShopState["vouchers"] = [];
  if (run.anteVoucher) vouchers.push({ id: run.anteVoucher, price: discounted(run, VOUCHER_PRICE) });
  if (consumeTag(run, "t_bon")) {
    const extra = rollVoucher(
      run,
      ctx.rng,
      vouchers.map((v) => v.id),
    );
    if (extra) vouchers.push({ id: extra, price: discounted(run, VOUCHER_PRICE) });
  }
  run.shop = {
    items,
    packs,
    vouchers,
    rerollCost: Math.max(0, BASE_REROLL - voucherSum(run, "reroll-discount")),
    freeRerolls: passiveSum(run, "freeRerolls"),
  };
  ctx.fx({ kind: "sound", name: "shop" });
}

export function reroll(run: RunState, ctx: Ctx) {
  const shop = run.shop;
  if (!shop || run.phase !== "shop") return;
  if (shop.freeRerolls > 0) shop.freeRerolls -= 1;
  else {
    if (!canAfford(run, shop.rerollCost)) fail("Za mało pieniędzy", "Not enough money");
    run.money -= shop.rerollCost;
    shop.rerollCost += 1;
  }
  run.stats.rerolls += 1;
  const slots = SHOP_CARD_SLOTS + voucherSum(run, "shop-slots");
  shop.items = [];
  for (let i = 0; i < slots; i++) shop.items.push(rollShopItem(run, ctx));
}

function addJoker(run: RunState, joker: JokerInstance) {
  if (run.jokers.length >= jokerSlots(run) && joker.edition !== "negative")
    fail("Brak miejsca na Jokera", "No room for another Joker");
  run.jokers.push(joker);
}

function addConsumable(run: RunState, item: ConsumableInstance) {
  if (run.consumables.length >= consumableSlots(run) && !item.isNegative)
    fail("Brak miejsca na karty", "No room for consumables");
  run.consumables.push(item);
}

export function buyItem(run: RunState, ctx: Ctx, uid: string, useNow = false) {
  const shop = run.shop;
  const item = shop?.items.find((i) => i.uid === uid);
  if (!shop || !item || item.isSold) return;
  if (!canAfford(run, item.price)) fail("Za mało pieniędzy", "Not enough money");
  if (item.type === "joker") addJoker(run, item.joker);
  else if (item.type === "task") run.reserved.push(item.card);
  else if (useNow) {
    run.money -= item.price;
    item.isSold = true;
    applyConsumable(run, ctx, item.item);
    return;
  } else addConsumable(run, item.item);
  run.money -= item.price;
  item.isSold = true;
  ctx.fx({ kind: "sound", name: "buy" });
}

export function buyVoucher(run: RunState, ctx: Ctx, id: string) {
  const shop = run.shop;
  const v = shop?.vouchers.find((x) => x.id === id);
  if (!shop || !v || v.isSold) return;
  if (!canAfford(run, v.price)) fail("Za mało pieniędzy", "Not enough money");
  run.money -= v.price;
  v.isSold = true;
  run.vouchers.push(id);
  if (run.anteVoucher === id) run.anteVoucher = null;
  const e = VOUCHER_BY_ID[id].effect;
  if (e.kind === "consumable-slots") run.consumableSlots += e.delta;
  if (e.kind === "joker-slots") run.jokerSlots += e.delta;
  if (e.kind === "shop-slots") {
    for (let i = 0; i < e.delta; i++) shop.items.push(rollShopItem(run, ctx));
  }
  if (e.kind === "discount") {
    for (const it of shop.items) it.price = Math.floor(it.price * (1 - e.pct / 100));
    for (const p of shop.packs) p.price = Math.floor(p.price * (1 - e.pct / 100));
  }
  if (e.kind === "reroll-discount") shop.rerollCost = Math.max(0, shop.rerollCost - e.delta);
  ctx.fx({ kind: "sound", name: "buy" });
}

export function buyPack(run: RunState, ctx: Ctx, uid: string) {
  const shop = run.shop;
  const p = shop?.packs.find((x) => x.uid === uid);
  if (!shop || !p || p.isSold) return;
  if (!canAfford(run, p.price)) fail("Za mało pieniędzy", "Not enough money");
  run.money -= p.price;
  p.isSold = true;
  openPack(run, ctx, p.kind, p.size, "shop");
}

function openPack(run: RunState, ctx: Ctx, kind: PackKind, size: PackSize, returnTo: "shop" | "blind-select") {
  const [n, picks] = PACK_SHAPE[kind][size];
  const choices: PackChoice[] = [];
  const used: string[] = [];
  for (let i = 0; i < n; i++) {
    if (kind === "zadania") {
      const card = rollTaskCard(run, ctx, true);
      if (card) choices.push({ uid: ctx.rng.uid("pc"), type: "task", card });
    } else if (kind === "jokery") {
      const tmp = { ...run, jokers: [...run.jokers, ...choices.flatMap((c) => (c.type === "joker" ? [c.joker] : []))] };
      choices.push({ uid: ctx.rng.uid("pc"), type: "joker", joker: rollJoker(tmp, ctx.rng) });
    } else if (kind === "sciagi") {
      let id = rollSciaga(ctx.rng, true);
      for (let t = 0; t < 5 && used.includes(id); t++) id = rollSciaga(ctx.rng, true);
      used.push(id);
      choices.push({ uid: ctx.rng.uid("pc"), type: "consumable", item: { uid: ctx.rng.uid("k"), kind: "sciaga", id } });
    } else {
      const id = rollTwierdzenie(run, ctx.rng, used);
      used.push(id);
      choices.push({
        uid: ctx.rng.uid("pc"),
        type: "consumable",
        item: { uid: ctx.rng.uid("k"), kind: "twierdzenie", id },
      });
    }
  }
  run.pack = { kind, size, choices, picksLeft: picks, returnTo };
  run.phase = "pack";
  ctx.fx({ kind: "sound", name: "pack" });
}

export function pickFromPack(run: RunState, ctx: Ctx, uid: string) {
  const pack = run.pack;
  const choice = pack?.choices.find((c) => c.uid === uid);
  if (!pack || !choice) return;
  if (choice.type === "joker") addJoker(run, choice.joker);
  else if (choice.type === "task") run.reserved.push(choice.card);
  else if (choice.item.kind === "twierdzenie") applyConsumable(run, ctx, choice.item);
  else {
    const def = SCIAGA_BY_ID[choice.item.id];
    if (def.target === null && run.consumables.length >= consumableSlots(run)) applyConsumable(run, ctx, choice.item);
    else addConsumable(run, choice.item);
  }
  pack.choices = pack.choices.filter((c) => c.uid !== uid);
  pack.picksLeft -= 1;
  ctx.fx({ kind: "sound", name: "pick" });
  if (pack.picksLeft <= 0 || pack.choices.length === 0) closePack(run);
}

export function skipPack(run: RunState) {
  if (!run.pack) return;
  closePack(run);
}

function closePack(run: RunState) {
  const back = run.pack?.returnTo ?? "shop";
  run.pack = null;
  run.phase = back;
}

export function leaveShop(run: RunState, ctx: Ctx) {
  if (run.phase !== "shop") return;
  run.shop = null;
  run.phase = "blind-select";
  ctx.fx({ kind: "sound", name: "click" });
}

/** Selling / reordering */

export function sellJoker(run: RunState, ctx: Ctx, uid: string) {
  const j = run.jokers.find((x) => x.uid === uid);
  if (!j) return;
  run.money += jokerSellValue(j);
  run.jokers = run.jokers.filter((x) => x.uid !== uid);
  if (run.round && activeBoss(run, run.round)?.kind === "director") run.round.flags.directorLifted = 1;
  ctx.fx({ kind: "sound", name: "sell" });
}

export function sellConsumable(run: RunState, ctx: Ctx, uid: string) {
  if (!run.consumables.some((c) => c.uid === uid)) return;
  run.money += consumableSellValue();
  run.consumables = run.consumables.filter((c) => c.uid !== uid);
  ctx.fx({ kind: "sound", name: "sell" });
}

export function reorderJokers(run: RunState, uids: string[]) {
  const byUid = new Map(run.jokers.map((j) => [j.uid, j]));
  const next = uids.map((u) => byUid.get(u)).filter((j): j is JokerInstance => !!j);
  if (next.length === run.jokers.length) run.jokers = next;
}

/** Consumables */

export function canUseConsumable(run: RunState, item: ConsumableInstance): L10n | null {
  if (item.kind === "twierdzenie") return null;
  const def = SCIAGA_BY_ID[item.id];
  if (!def) return { pl: "?", en: "?" };
  if (def.target) {
    const round = run.round;
    if (!round || run.phase !== "round" || round.pending)
      return { pl: "Tylko w trakcie rundy", en: "Only during a round" };
    const n = round.selected.length;
    if (n < def.target.min || n > def.target.max)
      return def.target.min === def.target.max
        ? { pl: `Wybierz ${def.target.min} kart(y)`, en: `Select ${def.target.min} card(s)` }
        : {
            pl: `Wybierz ${def.target.min}-${def.target.max} kart`,
            en: `Select ${def.target.min}-${def.target.max} cards`,
          };
  }
  if (def.effect.kind === "create" && def.effect.what !== "sciaga" && def.effect.what !== "twierdzenie") {
    if (run.jokers.length >= jokerSlots(run)) return { pl: "Brak miejsca na Jokera", en: "No room for a Joker" };
  }
  if (def.effect.kind === "repeat-last" && (!run.lastConsumable || run.lastConsumable.id === "deja_vu"))
    return { pl: "Nic jeszcze nie użyto", en: "Nothing used yet" };
  return null;
}

export function activateConsumable(run: RunState, ctx: Ctx, uid: string) {
  const item = run.consumables.find((c) => c.uid === uid);
  if (!item) return;
  const err = canUseConsumable(run, item);
  if (err) throw new RuleError(err);
  run.consumables = run.consumables.filter((c) => c.uid !== uid);
  applyConsumable(run, ctx, item);
}

function applyConsumable(run: RunState, ctx: Ctx, item: ConsumableInstance) {
  if (item.kind === "twierdzenie") {
    const def = TWIERDZENIE_BY_ID[item.id];
    run.handLevels[def.hand] = (run.handLevels[def.hand] ?? 1) + 1;
    run.lastPlanet = item.id;
    run.lastConsumable = { kind: "twierdzenie", id: item.id };
    ctx.fx({ kind: "levelup", hand: def.hand, level: run.handLevels[def.hand] });
    return;
  }
  const def = SCIAGA_BY_ID[item.id];
  const round = run.round;
  const selected = round ? round.hand.filter((c) => round.selected.includes(c.uid)) : [];
  if (def.id !== "deja_vu") run.lastConsumable = { kind: "sciaga", id: def.id };
  const e = def.effect;
  ctx.fx({ kind: "sound", name: "tarot" });
  switch (e.kind) {
    case "reveal": {
      const rank = { sign: 1, range: 2, value: 3 } as const;
      for (const c of selected) if (!c.reveal || rank[c.reveal] < rank[e.reveal]) c.reveal = e.reveal;
      break;
    }
    case "replace": {
      const exclude = new Set(round!.hand.map((c) => c.taskId));
      const tasks = sampleTasks(ctx.pool, run, ctx.rng, selected.length, { suit: e.suit, exclude });
      selected.forEach((c, i) => {
        const t = tasks[i];
        if (!t) return;
        c.taskId = t.id;
        c.reveal = undefined;
        c.mods = undefined;
        c.isFaceDown = false;
        run.seen[t.id] = run.blindCounter;
      });
      break;
    }
    case "copy": {
      const [left, right] = round!.hand.filter((c) => round!.selected.includes(c.uid));
      if (left && right) {
        left.taskId = right.taskId;
        left.enh = right.enh;
        left.edition = right.edition;
        left.mods = right.mods ? [...right.mods] : undefined;
        left.reveal = right.reveal;
        left.isFaceDown = right.isFaceDown;
      }
      break;
    }
    case "destroy":
      round!.hand = round!.hand.filter((c) => !round!.selected.includes(c.uid) || c.uid === round!.forcedUid);
      break;
    case "enhance":
      for (const c of selected) c.enh = e.enh;
      break;
    case "mod":
      for (const c of selected) c.mods = [...(c.mods ?? []), e.mod];
      break;
    case "money-double":
      run.money += Math.max(0, Math.min(run.money, 20));
      break;
    case "wheel": {
      const plain = run.jokers.filter((j) => !j.edition);
      if (plain.length && ctx.rng.chance(1 / 4)) {
        const j = ctx.rng.pick(plain);
        j.edition = ctx.rng.weighted<Edition>(["foil", "holo", "poly"], (x) =>
          x === "foil" ? 50 : x === "holo" ? 35 : 15,
        );
        ctx.fx({ kind: "joker", jokerUid: j.uid, text: { pl: "Udało się!", en: "Success!" } });
      } else ctx.fx({ kind: "toast", text: { pl: "Pudło!", en: "Nope!" }, tone: "bad" });
      break;
    }
    case "create": {
      for (let i = 0; i < e.count; i++) {
        if (e.what === "joker" || e.what === "legendary") {
          if (run.jokers.length >= jokerSlots(run)) break;
          run.jokers.push(rollJoker(run, ctx.rng, e.what === "legendary" ? "legendary" : undefined));
        } else {
          if (run.consumables.length >= consumableSlots(run)) break;
          const id = e.what === "twierdzenie" ? rollTwierdzenie(run, ctx.rng) : rollSciaga(ctx.rng, false);
          run.consumables.push({ uid: ctx.rng.uid("k"), kind: e.what, id });
        }
      }
      break;
    }
    case "sell-sum":
      run.money += Math.min(
        50,
        run.jokers.reduce((s, j) => s + jokerSellValue(j), 0),
      );
      break;
    case "repeat-last": {
      const last = run.lastConsumable;
      if (last && run.consumables.length < consumableSlots(run))
        run.consumables.push({ uid: ctx.rng.uid("k"), kind: last.kind, id: last.id });
      break;
    }
  }
  if (round) round.selected = round.forcedUid ? [round.forcedUid] : [];
}

/** Notes */

export function setNote(run: RunState, taskId: string, note: string) {
  const trimmed = note.trim().slice(0, 40);
  if (trimmed) run.notes[taskId] = trimmed;
  else delete run.notes[taskId];
}

/** Insight shown on a hand card (from ściągi, jokers, vouchers). */
export function cardInsight(run: RunState, card: CardInstance): "value" | "range" | "sign" | null {
  const order = { sign: 1, range: 2, value: 3 } as const;
  let best: "value" | "range" | "sign" | null = card.reveal ?? null;
  const bump = (k: "value" | "range" | "sign") => {
    if (!best || order[k] > order[best]) best = k;
  };
  if (hasPassive(run, "revealRange")) bump("range");
  if (hasPassive(run, "revealSign")) bump("sign");
  return best;
}

export function cardShownValue(run: RunState, card: CardInstance, pool: TaskPool): number | null {
  const t = pool.byId.get(card.taskId);
  if (!t) return null;
  return effectiveValue(run, run.round, card, t);
}

export function valueRangeLabel(v: number): string {
  if (v < 0) return "< 0";
  if (v < 1) return "[0, 1)";
  if (v < 5) return "[1, 5)";
  if (v < 15) return "[5, 15)";
  if (v < 50) return "[15, 50)";
  return "≥ 50";
}
