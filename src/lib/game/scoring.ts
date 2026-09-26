/**
 * Scoring pipeline: turns a played hand into an ordered event timeline (the UI animates it
 * card by card) plus final chips × mult. Mutates the given (already cloned) run for scaling
 * jokers, hand levels and play counters.
 */
import { isAnswerCorrect } from "~/lib/game/answer";
import { CATEGORIES } from "~/lib/game/categories";
import { VALUE_CAP } from "~/lib/game/constants";
import { BOSS_BY_ID, type BossEffect } from "~/lib/game/content/bosses";
import { TWIERDZENIE_BY_ID } from "~/lib/game/content/consumables";
import { type CardCtx, type Effect, type HandCtx, JOKER_BY_ID, type JokerDef } from "~/lib/game/content/jokers";
import { VOUCHER_BY_ID } from "~/lib/game/content/vouchers";
import type { TaskPool } from "~/lib/game/deck";
import { detectHand, handBase } from "~/lib/game/hands";
import type { Rng } from "~/lib/game/rng";
import type {
  CardInstance,
  HandTypeId,
  JokerInstance,
  RoundState,
  RunState,
  ScoreEvent,
  ScoringResult,
  TaskRecord,
} from "~/lib/game/types";

/** Helpers */

export function activeBoss(run: RunState, round: RoundState | null): BossEffect | null {
  if (!round?.bossId) return null;
  if (hasPassive(run, "disablesBoss")) return null;
  return BOSS_BY_ID[round.bossId]?.effect ?? null;
}

export function hasPassive(run: RunState, key: keyof NonNullable<JokerDef["passive"]>): boolean {
  return run.jokers.some((j) => !j.isDisabled && JOKER_BY_ID[j.id]?.passive?.[key]);
}

export function passiveSum(run: RunState, key: "handSize" | "discards" | "hands" | "freeRerolls"): number {
  return run.jokers.reduce((s, j) => s + (j.isDisabled ? 0 : (JOKER_BY_ID[j.id]?.passive?.[key] ?? 0)), 0);
}

export function isCardDebuffed(run: RunState, round: RoundState | null, card: CardInstance, task: TaskRecord): boolean {
  if (card.isDebuffed) return true;
  const boss = activeBoss(run, round);
  if (!boss) return false;
  if (boss.kind === "debuff-suit") return CATEGORIES[task.cat].suit === boss.suit;
  if (boss.kind === "director") return !(round?.flags.directorLifted ?? 0);
  return false;
}

/** Card value after ściąga mods, boss rules and joker transforms (before the chip cap). */
export function effectiveValue(run: RunState, round: RoundState | null, card: CardInstance, task: TaskRecord): number {
  let v = task.value;
  for (const m of card.mods ?? []) {
    if (m === "neg") v = -v;
    else if (m === "dbl") v = 2 * v;
    else if (m === "abs") v = Math.abs(v);
  }
  const boss = activeBoss(run, round);
  if (boss?.kind === "mirror") v = -v;
  if (boss?.kind === "round-down") v = Math.floor(v + 1e-9);
  for (const j of run.jokers) {
    if (j.isDisabled) continue;
    const t = JOKER_BY_ID[j.id]?.transform;
    if (t) v = t(v);
  }
  return v;
}

export function cardChips(run: RunState, v: number): number {
  if (hasPassive(run, "noClamp")) return v;
  return Math.max(-VALUE_CAP, Math.min(VALUE_CAP, v));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Ksero copies the right neighbour, Burza mózgów the leftmost joker. */
function resolveCopy(run: RunState, index: number, depth = 0): { def: JokerDef; inst: JokerInstance } | null {
  const inst = run.jokers[index];
  if (!inst || depth > run.jokers.length) return null;
  const def = JOKER_BY_ID[inst.id];
  if (!def) return null;
  if (def.id === "ksero") return resolveCopy(run, index + 1, depth + 1);
  if (def.id === "burza") return index === 0 ? null : resolveCopy(run, 0, depth + 1);
  return { def, inst };
}

/** Pipeline */

export type ScoreInput = {
  run: RunState;
  round: RoundState;
  played: CardInstance[];
  pool: TaskPool;
  rng: Rng;
  /** cards that were face down when played: nobody could answer them, so they score as-is */
  faceDownUids?: string[];
};

export function previewHand(run: RunState, round: RoundState, played: CardInstance[], pool: TaskPool) {
  const cats = played.map((c) => pool.byId.get(c.taskId)!.cat);
  const handType = detectHand(cats, { isFourFingers: hasPassive(run, "isFourFingers") });
  const level = run.handLevels[handType] ?? 1;
  let { chips, mult } = handBase(handType, level);
  const boss = activeBoss(run, round);
  if (boss?.kind === "flint") {
    chips = Math.floor(chips / 2 + 0.5);
    mult = Math.max(1, Math.floor(mult / 2 + 0.5));
  }
  return { handType, level, chips, mult };
}

/**
 * Every face-up played card needs the player's answer (validatePlay enforces it). A wrong answer
 * makes the card score nothing and drop out of the hand type, so guessing can't fish for flushes.
 */
export function scoreHand({ run, round, played, pool, rng, faceDownUids = [] }: ScoreInput): ScoringResult {
  const events: ScoreEvent[] = [];
  const tasks = played.map((c) => pool.byId.get(c.taskId)!);
  const heldCards = round.hand.filter((c) => !played.some((p) => p.uid === c.uid));
  const heldTasks = heldCards.map((c) => pool.byId.get(c.taskId)!);
  const boss = activeBoss(run, round);

  const isFaceDown = played.map((c) => faceDownUids.includes(c.uid));
  const noteCorrect = played.map((c, i) => {
    if (isFaceDown[i]) return true;
    const note = run.notes[c.taskId];
    return note ? isAnswerCorrect(note, tasks[i].value, `${tasks[i].tex} ${tasks[i].ans ?? ""}`) : false;
  });
  const correctNotes = noteCorrect.filter((ok, i) => ok && !isFaceDown[i]).length;

  const handType: HandTypeId = detectHand(
    tasks.filter((_, i) => noteCorrect[i]).map((t) => t.cat),
    { isFourFingers: hasPassive(run, "isFourFingers") },
  );

  if (boss?.kind === "amnesia" && (run.handLevels[handType] ?? 1) > 1) {
    run.handLevels[handType] -= 1;
    events.push({ kind: "boss", text: { pl: "Poziom układu w dół!", en: "Hand level down!" } });
  }

  run.handPlays[handType] = (run.handPlays[handType] ?? 0) + 1;
  round.handTypesPlayed.push(handType);

  const values = played.map((c, i) => effectiveValue(run, round, c, tasks[i]));
  const debuffed = played.map((c, i) => isCardDebuffed(run, round, c, tasks[i]));
  const isLastHand = round.handsLeft <= 1;

  const baseCtx = (joker: JokerInstance): HandCtx => ({
    run,
    round,
    played,
    tasks,
    handType,
    joker,
    rng,
    held: heldCards,
    heldTasks,
    isLastHand,
    correctNotes,
    values: values.filter((_, i) => !debuffed[i] && noteCorrect[i]),
  });

  // 1. before-scoring hooks (scaling jokers) — originals only, copies never double-scale
  for (const j of run.jokers) {
    if (j.isDisabled) continue;
    const def = JOKER_BY_ID[j.id];
    const eff = def?.onBefore?.(baseCtx(j));
    if (eff?.text) events.push({ kind: "joker-text", jokerUid: j.uid, text: eff.text });
  }

  // 2. hand base
  const level = run.handLevels[handType] ?? 1;
  let { chips, mult } = handBase(handType, level);
  if (boss?.kind === "flint") {
    chips = Math.floor(chips / 2 + 0.5);
    mult = Math.max(1, Math.floor(mult / 2 + 0.5));
  }
  events.push({ kind: "hand", chips, mult });
  let money = 0;

  const apply = (eff: Effect | void, source: { cardUid?: string; jokerUid?: string }) => {
    if (!eff) return;
    if (eff.chips) {
      chips += eff.chips;
      if (source.jokerUid) events.push({ kind: "joker-chips", jokerUid: source.jokerUid, chips: eff.chips });
      else events.push({ kind: "card-chips", cardUid: source.cardUid!, chips: eff.chips });
    }
    if (eff.mult) {
      mult += eff.mult;
      if (source.jokerUid) events.push({ kind: "joker-mult", jokerUid: source.jokerUid, mult: eff.mult });
      else events.push({ kind: "card-mult", cardUid: source.cardUid!, mult: eff.mult });
    }
    if (eff.xmult && eff.xmult !== 1) {
      mult *= eff.xmult;
      if (source.jokerUid) events.push({ kind: "joker-xmult", jokerUid: source.jokerUid, xmult: eff.xmult });
      else events.push({ kind: "card-xmult", cardUid: source.cardUid!, xmult: eff.xmult });
    }
    if (eff.money) {
      money += eff.money;
      if (source.jokerUid) events.push({ kind: "joker-money", jokerUid: source.jokerUid, money: eff.money });
      else events.push({ kind: "card-money", cardUid: source.cardUid!, money: eff.money });
    }
    if (eff.text && source.jokerUid) events.push({ kind: "joker-text", jokerUid: source.jokerUid, text: eff.text });
  };

  const noteVoucher = run.vouchers
    .map((id) => VOUCHER_BY_ID[id]?.effect)
    .filter((e) => e?.kind === "note-bonus")
    .reduce(
      (acc, e) => (e && e.kind === "note-bonus" ? { chips: acc.chips + e.chips, mult: acc.mult + e.mult } : acc),
      { chips: 0, mult: 0 },
    );

  // 3. cards left to right
  const scoredUids: string[] = [];
  played.forEach((card, index) => {
    const task = tasks[index];
    const value = values[index];
    if (!noteCorrect[index]) {
      events.push({ kind: "card-note", cardUid: card.uid, isCorrect: false });
      events.push({ kind: "card", cardUid: card.uid, chips: 0, value, isWrong: true });
      return;
    }
    if (debuffed[index]) {
      events.push({ kind: "card", cardUid: card.uid, chips: 0, value, isDebuffed: true });
      return;
    }
    scoredUids.push(card.uid);
    const cctx = (joker: JokerInstance): CardCtx => ({
      ...baseCtx(joker),
      card,
      task,
      index,
      value,
      isNoteCorrect: noteCorrect[index],
    });
    let reps = 1;
    run.jokers.forEach((j, ji) => {
      if (j.isDisabled) return;
      const r = resolveCopy(run, ji);
      if (r?.def.retrigger) reps += r.def.retrigger(cctx(r.inst));
    });
    for (let r = 0; r < reps; r++) {
      const cv = round2(cardChips(run, value));
      chips += cv;
      events.push({ kind: "card", cardUid: card.uid, chips: cv, value, isRetrigger: r > 0 });
      if (r === 0 && !isFaceDown[index]) {
        events.push({ kind: "card-note", cardUid: card.uid, isCorrect: true });
        if (noteVoucher.chips) apply({ chips: noteVoucher.chips }, { cardUid: card.uid });
        if (noteVoucher.mult) apply({ mult: noteVoucher.mult }, { cardUid: card.uid });
      }
      if (card.enh === "bonus") apply({ chips: 30 }, { cardUid: card.uid });
      if (card.enh === "mult") apply({ mult: 4 }, { cardUid: card.uid });
      if (card.enh === "glass") apply({ xmult: 2 }, { cardUid: card.uid });
      if (card.enh === "lucky") {
        if (rng.chance(1 / 5)) apply({ mult: 20 }, { cardUid: card.uid });
        if (rng.chance(1 / 15)) apply({ money: 20 }, { cardUid: card.uid });
      }
      if (card.edition === "foil") apply({ chips: 50 }, { cardUid: card.uid });
      if (card.edition === "holo") apply({ mult: 10 }, { cardUid: card.uid });
      if (card.edition === "poly") apply({ xmult: 1.5 }, { cardUid: card.uid });
      run.jokers.forEach((j, ji) => {
        if (j.isDisabled) return;
        const res = resolveCopy(run, ji);
        if (res?.def.onCard) apply(res.def.onCard(cctx(res.inst)), { jokerUid: j.uid });
      });
    }
  });

  // 4. jokers left to right (independent effects + editions)
  run.jokers.forEach((j, ji) => {
    if (j.isDisabled) return;
    if (j.edition === "foil") apply({ chips: 50 }, { jokerUid: j.uid });
    if (j.edition === "holo") apply({ mult: 10 }, { jokerUid: j.uid });
    const res = resolveCopy(run, ji);
    if (res?.def.onHand) apply(res.def.onHand(baseCtx(res.inst)), { jokerUid: j.uid });
    if (j.edition === "poly") apply({ xmult: 1.5 }, { jokerUid: j.uid });
  });

  // 5. Obserwatorium: held Twierdzenia multiply their own hand
  if (run.vouchers.includes("teleskop")) {
    for (const c of run.consumables) {
      if (c.kind === "twierdzenie" && TWIERDZENIE_BY_ID[c.id]?.hand === handType) {
        mult *= 1.5;
        events.push({ kind: "boss", text: { pl: "Obserwatorium ×1.5", en: "Observatory ×1.5" } });
      }
    }
  }

  chips = round2(chips);
  mult = round2(mult);
  let total = Math.round(chips * mult);
  const minus = run.jokers.find((j) => !j.isDisabled && j.id === "minusminus");
  if (total < 0 && minus) {
    total = -total;
    events.push({
      kind: "joker-text",
      jokerUid: minus.uid,
      text: { pl: "Minus razy minus!", en: "Minus times minus!" },
    });
  }

  return {
    handType,
    handLevel: level,
    events,
    chips,
    mult,
    total,
    moneyGained: money,
    correctNotes,
    scoredUids,
  };
}
