/**
 * Joker catalog. Descriptions use inline markup rendered by `RichText`:
 * [c:+30] chips (blue) · [m:+4] mult (red) · [x:×2] xmult · [$:$3] money · [g:1 in 4] chance ·
 * [a:text] attention · {name} runtime var from `vars()`.
 */
import { handBase } from "~/lib/game/hands";
import type { Rng } from "~/lib/game/rng";
import type {
  CardInstance,
  CategoryId,
  HandTypeId,
  JokerInstance,
  JokerRarity,
  L10n,
  RoundState,
  RunState,
  SuitId,
  TaskRecord,
} from "~/lib/game/types";

/** Types */

export type Effect = { chips?: number; mult?: number; xmult?: number; money?: number; text?: L10n };

export type HandCtx = {
  run: RunState;
  round: RoundState;
  played: CardInstance[];
  tasks: TaskRecord[];
  handType: HandTypeId;
  joker: JokerInstance;
  rng: Rng;
  held: CardInstance[];
  heldTasks: TaskRecord[];
  isLastHand: boolean;
  /** number of played face-up cards answered correctly (answers are required, so wrong = 0 chips) */
  correctNotes: number;
  /** answers of the correctly answered, scoring cards (their numbers, not their chips) */
  values: number[];
};

export type CardCtx = HandCtx & {
  card: CardInstance;
  task: TaskRecord;
  index: number;
  value: number;
  isNoteCorrect: boolean;
};

export type JokerDef = {
  id: string;
  name: L10n;
  desc: L10n;
  rarity: JokerRarity;
  cost: number;
  art: string; // emoji/glyph used on the card art
  vars?: (j: JokerInstance, run: RunState | null) => Record<string, string | number>;
  initVars?: () => Record<string, number>;
  /** before any scoring (scaling jokers update here) */
  onBefore?: (ctx: HandCtx) => Effect | void;
  onCard?: (ctx: CardCtx) => Effect | void;
  retrigger?: (ctx: CardCtx) => number;
  onHand?: (ctx: HandCtx) => Effect | void;
  onDiscard?: (ctx: { run: RunState; round: RoundState; joker: JokerInstance; count: number }) => void;
  onRoundEnd?: (ctx: { run: RunState; round: RoundState; joker: JokerInstance; rng: Rng }) => {
    money?: number;
    destroy?: boolean;
    text?: L10n;
  } | void;
  passive?: {
    handSize?: number;
    discards?: number;
    hands?: number;
    freeRerolls?: number;
    isFourFingers?: boolean;
    debtLimit?: number;
    disablesBoss?: boolean;
    revealSign?: boolean;
    revealRange?: boolean;
  };
  /** true for jokers whose ability can be copied by Ksero / Burza mózgów */
  isCopyable?: boolean;
};

/** Helpers */

const isInt = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
const FIB = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987]);
function isPrime(v: number): boolean {
  if (!isInt(v) || v < 2) return false;
  const n = Math.round(v);
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function suitJoker(id: string, suit: SuitId, name: L10n, art: string): JokerDef {
  const suitName: Record<SuitId, L10n> = {
    alg: { pl: "Algebra", en: "Algebra" },
    fun: { pl: "Funkcje", en: "Functions" },
    geo: { pl: "Geometria", en: "Geometry" },
    rac: { pl: "Rachunek", en: "Chance" },
  };
  return {
    id,
    name,
    art,
    rarity: "common",
    cost: 5,
    desc: {
      pl: `Każda zagrana karta z działu [${suit}:${suitName[suit].pl}] daje [m:+3] Mnożnika`,
      en: `Each played [${suit}:${suitName[suit].en}] card gives [m:+3] Mult`,
    },
    onCard: (c) => (CAT_SUIT[c.task.cat] === suit ? { mult: 3 } : undefined),
    isCopyable: true,
  };
}

function handMultJoker(id: string, hand: HandTypeId, mult: number, name: L10n, handName: L10n, art: string): JokerDef {
  return {
    id,
    name,
    art,
    rarity: "common",
    cost: 4,
    desc: {
      pl: `[m:+${mult}] Mnożnika, jeśli zagrany układ zawiera [a:${handName.pl}]`,
      en: `[m:+${mult}] Mult if played hand contains a [a:${handName.en}]`,
    },
    onHand: (c) => (contains(c.handType, hand) ? { mult } : undefined),
    isCopyable: true,
  };
}

function handXJoker(id: string, hand: HandTypeId, x: number, name: L10n, handName: L10n, art: string): JokerDef {
  return {
    id,
    name,
    art,
    rarity: "rare",
    cost: 8,
    desc: {
      pl: `[x:×${x}] Mnożnika, jeśli zagrany układ zawiera [a:${handName.pl}]`,
      en: `[x:×${x}] Mult if played hand contains a [a:${handName.en}]`,
    },
    onHand: (c) => (contains(c.handType, hand) ? { xmult: x } : undefined),
    isCopyable: true,
  };
}

// local copy to avoid a circular import with hands.ts consumers
const CONTAINS: Record<HandTypeId, HandTypeId[]> = {
  high: ["high"],
  pair: ["high", "pair"],
  twopair: ["high", "pair", "twopair"],
  three: ["high", "pair", "three"],
  cross: ["high", "cross"],
  flush: ["high", "flush"],
  full: ["high", "pair", "twopair", "three", "full"],
  four: ["high", "pair", "twopair", "three", "four"],
  flushfull: ["high", "pair", "twopair", "three", "full", "flush", "flushfull"],
  five: ["high", "pair", "twopair", "three", "four", "five", "flush"],
};
const contains = (played: HandTypeId, wanted: HandTypeId) => CONTAINS[played].includes(wanted);

const CAT_SUIT: Record<CategoryId, SuitId> = {
  liczby: "alg",
  wyrazenia: "alg",
  rownania: "alg",
  funkcje: "fun",
  ciagi: "fun",
  analiza: "fun",
  trygonometria: "geo",
  planimetria: "geo",
  analityczna: "geo",
  stereometria: "geo",
  kombinatoryka: "rac",
  prawdopodobienstwo: "rac",
  statystyka: "rac",
};

const HN = {
  pair: { pl: "Parę", en: "Pair" },
  twopair: { pl: "Dwie pary", en: "Two Pair" },
  three: { pl: "Trójkę", en: "Three of a Kind" },
  cross: { pl: "Przekrój", en: "Cross-section" },
  flush: { pl: "Kolor", en: "Flush" },
  four: { pl: "Karetę", en: "Four of a Kind" },
} satisfies Record<string, L10n>;

/** Catalog */

export const JOKERS: JokerDef[] = [
  // ─── common ───────────────────────────────────────────────────────────
  {
    id: "kalkulator",
    name: { pl: "Kalkulator", en: "Calculator" },
    desc: { pl: "[m:+4] Mnożnika", en: "[m:+4] Mult" },
    rarity: "common",
    cost: 2,
    art: "🧮",
    onHand: () => ({ mult: 4 }),
    isCopyable: true,
  },
  suitJoker("algebraik", "alg", { pl: "Algebraik", en: "Algebraist" }, "♠"),
  suitJoker("analityk", "fun", { pl: "Analityk", en: "Analyst" }, "♥"),
  suitJoker("geometra", "geo", { pl: "Geometra", en: "Geometer" }, "♦"),
  suitJoker("probabilista", "rac", { pl: "Probabilista", en: "Probabilist" }, "♣"),
  handMultJoker("blizniaki", "pair", 8, { pl: "Bliźniaki", en: "Twins" }, HN.pair, "👯"),
  handMultJoker("dwumian", "twopair", 10, { pl: "Dwumian", en: "Binomial" }, HN.twopair, "⚖️"),
  handMultJoker("trojkat", "three", 12, { pl: "Trójkąt", en: "Triangle" }, HN.three, "🔺"),
  handMultJoker("przekatna", "cross", 12, { pl: "Przekątna", en: "Diagonal" }, HN.cross, "📐"),
  handMultJoker("monotematyczny", "flush", 10, { pl: "Monotematyczny", en: "One-Track Mind" }, HN.flush, "🎯"),
  {
    id: "pilny",
    name: { pl: "Pilny uczeń", en: "Diligent Student" },
    desc: {
      pl: "[c:+50] Żetonów, jeśli układ zawiera [a:Parę]",
      en: "[c:+50] Chips if played hand contains a [a:Pair]",
    },
    rarity: "common",
    cost: 4,
    art: "✏️",
    onHand: (c) => (contains(c.handType, "pair") ? { chips: 50 } : undefined),
    isCopyable: true,
  },
  {
    id: "sprytny",
    name: { pl: "Sprytny", en: "Clever" },
    desc: {
      pl: "[c:+80] Żetonów, jeśli układ zawiera [a:Dwie pary]",
      en: "[c:+80] Chips if played hand contains [a:Two Pair]",
    },
    rarity: "common",
    cost: 4,
    art: "🦊",
    onHand: (c) => (contains(c.handType, "twopair") ? { chips: 80 } : undefined),
    isCopyable: true,
  },
  {
    id: "polowka",
    name: { pl: "Połówka", en: "One Half" },
    desc: {
      pl: "[m:+20] Mnożnika, jeśli zagrasz [a:3] lub mniej kart",
      en: "[m:+20] Mult if played hand contains [a:3] or fewer cards",
    },
    rarity: "common",
    cost: 5,
    art: "½",
    onHand: (c) => (c.played.length <= 3 ? { mult: 20 } : undefined),
    isCopyable: true,
  },
  {
    id: "zapas",
    name: { pl: "Zapas czasu", en: "Spare Time" },
    desc: {
      pl: "[c:+30] Żetonów za każdą pozostałą [a:zrzutkę]",
      en: "[c:+30] Chips for each remaining [a:discard]",
    },
    rarity: "common",
    cost: 5,
    art: "⏳",
    onHand: (c) => (c.round.discardsLeft > 0 ? { chips: 30 * c.round.discardsLeft } : undefined),
    isCopyable: true,
  },
  {
    id: "ostatnia",
    name: { pl: "Ostatnia prosta", en: "Final Stretch" },
    desc: { pl: "[m:+15] Mnożnika, gdy zostało [a:0] zrzutek", en: "[m:+15] Mult when [a:0] discards remaining" },
    rarity: "common",
    cost: 5,
    art: "🏁",
    onHand: (c) => (c.round.discardsLeft === 0 ? { mult: 15 } : undefined),
    isCopyable: true,
  },
  {
    id: "parzysty",
    name: { pl: "Parzysty", en: "Even Steven" },
    desc: {
      pl: "Karty z [a:parzystą] całkowitą odpowiedzią dają [m:+4] Mnożnika",
      en: "Played cards with an [a:even] integer answer give [m:+4] Mult",
    },
    rarity: "common",
    cost: 4,
    art: "2️⃣",
    onCard: (c) => (isInt(c.value) && Math.round(c.value) % 2 === 0 ? { mult: 4 } : undefined),
    isCopyable: true,
  },
  {
    id: "nieparzysty",
    name: { pl: "Nieparzysty", en: "Odd Todd" },
    desc: {
      pl: "Karty z [a:nieparzystą] całkowitą odpowiedzią dają [c:+31] Żetonów",
      en: "Played cards with an [a:odd] integer answer give [c:+31] Chips",
    },
    rarity: "common",
    cost: 4,
    art: "3️⃣",
    onCard: (c) => (isInt(c.value) && Math.abs(Math.round(c.value)) % 2 === 1 ? { chips: 31 } : undefined),
    isCopyable: true,
  },
  {
    id: "ulamek",
    name: { pl: "Ułamek", en: "Fraction" },
    desc: {
      pl: "Karty z [a:niecałkowitą] odpowiedzią dają [m:+6] Mnożnika",
      en: "Played cards with a [a:non-integer] answer give [m:+6] Mult",
    },
    rarity: "common",
    cost: 5,
    art: "⅔",
    onCard: (c) => (!isInt(c.value) ? { mult: 6 } : undefined),
    isCopyable: true,
  },
  {
    id: "zero",
    name: { pl: "Zero absolutne", en: "Absolute Zero" },
    desc: {
      pl: "Karty z odpowiedzią [a:0] dają [x:×3] Mnożnika",
      en: "Played cards with answer [a:0] give [x:×3] Mult",
    },
    rarity: "common",
    cost: 4,
    art: "0️⃣",
    onCard: (c) => (Math.abs(c.value) < 1e-9 ? { xmult: 3 } : undefined),
    isCopyable: true,
  },
  {
    id: "stypendium",
    name: { pl: "Stypendium", en: "Scholarship" },
    desc: { pl: "Zarabiasz [$:$4] na koniec rundy", en: "Earn [$:$4] at end of round" },
    rarity: "common",
    cost: 6,
    art: "🎓",
    onRoundEnd: () => ({ money: 4 }),
  },
  {
    id: "skarbonka",
    name: { pl: "Skarbonka", en: "Piggy Bank" },
    desc: {
      pl: "Zyskuje [$:$3] wartości sprzedaży na koniec rundy [a:(teraz {sell})]",
      en: "Gains [$:$3] of sell value at end of round [a:(currently {sell})]",
    },
    rarity: "common",
    cost: 4,
    art: "🐷",
    initVars: () => ({ bonus: 0 }),
    vars: (j) => ({ sell: `$${2 + (j.vars.bonus ?? 0)}` }),
    onRoundEnd: (c) => {
      c.joker.vars.bonus = (c.joker.vars.bonus ?? 0) + 3;
    },
  },
  {
    id: "kawa",
    name: { pl: "Kawa", en: "Coffee" },
    desc: {
      pl: "[c:+{chips}] Żetonów, [c:-5] Żetonów za każdą zagraną rękę",
      en: "[c:+{chips}] Chips, [c:-5] Chips for every hand played",
    },
    rarity: "common",
    cost: 5,
    art: "☕",
    initVars: () => ({ chips: 100 }),
    vars: (j) => ({ chips: j.vars.chips ?? 100 }),
    onHand: (c) => {
      const chips = c.joker.vars.chips ?? 100;
      c.joker.vars.chips = chips - 5;
      return { chips };
    },
    onRoundEnd: (c) =>
      (c.joker.vars.chips ?? 0) <= 0 ? { destroy: true, text: { pl: "Wypita!", en: "Drunk!" } } : undefined,
    isCopyable: true,
  },
  {
    id: "energetyk",
    name: { pl: "Energetyk", en: "Energy Drink" },
    desc: {
      pl: "[m:+{mult}] Mnożnika, [m:-4] Mnożnika na koniec każdej rundy",
      en: "[m:+{mult}] Mult, [m:-4] Mult at end of each round",
    },
    rarity: "common",
    cost: 5,
    art: "🥤",
    initVars: () => ({ mult: 20 }),
    vars: (j) => ({ mult: j.vars.mult ?? 20 }),
    onHand: (c) => ({ mult: c.joker.vars.mult ?? 20 }),
    onRoundEnd: (c) => {
      c.joker.vars.mult = (c.joker.vars.mult ?? 20) - 4;
      if (c.joker.vars.mult <= 0) return { destroy: true, text: { pl: "Pusta puszka!", en: "Empty can!" } };
    },
    isCopyable: true,
  },
  {
    id: "sciagawka",
    name: { pl: "Ściągawka", en: "Crib Sheet" },
    desc: {
      pl: "[m:+15] Mnożnika. [g:1 na 6] szansy, że na koniec rundy zostanie [a:skonfiskowana]",
      en: "[m:+15] Mult. [g:1 in 6] chance it gets [a:confiscated] at end of round",
    },
    rarity: "common",
    cost: 5,
    art: "📜",
    onHand: () => ({ mult: 15 }),
    onRoundEnd: (c) =>
      c.rng.chance(1 / 6) ? { destroy: true, text: { pl: "Skonfiskowana!", en: "Confiscated!" } } : undefined,
    isCopyable: true,
  },
  {
    id: "abstrakcja",
    name: { pl: "Abstrakcja", en: "Abstraction" },
    desc: {
      pl: "[m:+3] Mnożnika za każdego posiadanego Jokera [a:(teraz +{mult})]",
      en: "[m:+3] Mult for each Joker card [a:(currently +{mult})]",
    },
    rarity: "common",
    cost: 4,
    art: "🌀",
    vars: (_j, run) => ({ mult: 3 * (run?.jokers.length ?? 1) }),
    onHand: (c) => ({ mult: 3 * c.run.jokers.length }),
    isCopyable: true,
  },
  {
    id: "zeszyt",
    name: { pl: "Zielony zeszyt", en: "Green Notebook" },
    desc: {
      pl: "[m:+1] Mnożnika za każdą zagraną rękę, [m:-1] za każdą zrzutkę [a:(teraz +{mult})]",
      en: "[m:+1] Mult per hand played, [m:-1] Mult per discard [a:(currently +{mult})]",
    },
    rarity: "common",
    cost: 4,
    art: "📗",
    initVars: () => ({ mult: 0 }),
    vars: (j) => ({ mult: j.vars.mult ?? 0 }),
    onBefore: (c) => {
      c.joker.vars.mult = (c.joker.vars.mult ?? 0) + 1;
    },
    onHand: (c) => ((c.joker.vars.mult ?? 0) > 0 ? { mult: c.joker.vars.mult } : undefined),
    onDiscard: (c) => {
      c.joker.vars.mult = Math.max(0, (c.joker.vars.mult ?? 0) - 1);
    },
    isCopyable: true,
  },
  {
    id: "ambitny",
    name: { pl: "Ambitny", en: "Ambitious" },
    desc: {
      pl: "Każda zagrana karta z poziomu [a:rozszerzonego] daje [c:+30] Żetonów",
      en: "Each played [a:extended-level] card gives [c:+30] Chips",
    },
    rarity: "common",
    cost: 4,
    art: "🧗",
    onCard: (c) => (c.task.level === "R" ? { chips: 30 } : undefined),
    isCopyable: true,
  },
  {
    id: "podstawa",
    name: { pl: "Podstawa", en: "Back to Basics" },
    desc: {
      pl: "Każda zagrana karta z poziomu [a:podstawowego] daje [m:+2] Mnożnika",
      en: "Each played [a:basic-level] card gives [m:+2] Mult",
    },
    rarity: "common",
    cost: 4,
    art: "🧱",
    onCard: (c) => (c.task.level === "P" ? { mult: 2 } : undefined),
    isCopyable: true,
  },
  {
    id: "pierwszak",
    name: { pl: "Pierwszak", en: "Freshman" },
    desc: {
      pl: "[a:Pierwsza] zagrana karta jest liczona [a:dwa razy]",
      en: "Retrigger the [a:first] played card",
    },
    rarity: "common",
    cost: 5,
    art: "🥇",
    retrigger: (c) => (c.index === 0 ? 1 : 0),
    isCopyable: true,
  },
  {
    id: "zongler",
    name: { pl: "Żongler", en: "Juggler" },
    desc: { pl: "[a:+1] karta na ręce", en: "[a:+1] hand size" },
    rarity: "common",
    cost: 4,
    art: "🤹",
    passive: { handSize: 1 },
  },
  {
    id: "gumka",
    name: { pl: "Gumka", en: "Eraser" },
    desc: { pl: "[a:+1] zrzutka w każdej rundzie", en: "[a:+1] discard each round" },
    rarity: "common",
    cost: 4,
    art: "🧽",
    passive: { discards: 1 },
  },
  {
    id: "chaos",
    name: { pl: "Chaos", en: "Chaos" },
    desc: { pl: "[a:1] darmowe losowanie w każdym sklepie", en: "[a:1] free reroll per shop" },
    rarity: "common",
    cost: 4,
    art: "🎲",
    passive: { freeRerolls: 1 },
  },
  {
    id: "notatnik",
    name: { pl: "Notatnik", en: "Notebook" },
    desc: {
      pl: "Karty z [a:poprawną odpowiedzią] dają [m:+2] Mnożnika",
      en: "Played cards with a [a:correct answer] give [m:+2] Mult",
    },
    rarity: "common",
    cost: 5,
    art: "📓",
    onCard: (c) => (c.isNoteCorrect ? { mult: 2 } : undefined),
    isCopyable: true,
  },
  {
    id: "powtorka",
    name: { pl: "Powtórka", en: "Revision" },
    desc: {
      pl: "Dodaje tyle Mnożnika, ile razy zagrałeś ten układ w tej grze",
      en: "Adds Mult equal to the number of times this hand type was played this run",
    },
    rarity: "common",
    cost: 5,
    art: "🔁",
    onHand: (c) => ({ mult: c.run.handPlays[c.handType] ?? 0 }),
    isCopyable: true,
  },
  {
    id: "suma",
    name: { pl: "Suma kontrolna", en: "Checksum" },
    desc: {
      pl: "[c:+10] Żetonów za każdą [a:różną kategorię] w zagranej ręce",
      en: "[c:+10] Chips for each [a:distinct category] in played hand",
    },
    rarity: "common",
    cost: 4,
    art: "Σ",
    onHand: (c) => ({ chips: 10 * new Set(c.tasks.map((t) => t.cat)).size }),
    isCopyable: true,
  },

  // ─── uncommon ─────────────────────────────────────────────────────────
  {
    id: "modul",
    name: { pl: "Moduł", en: "Absolute Value" },
    desc: {
      pl: "Karty z [a:ujemną] odpowiedzią dają [c:+30] Żetonów",
      en: "Cards with a [a:negative] answer give [c:+30] Chips",
    },
    rarity: "uncommon",
    cost: 7,
    art: "|x|",
    onCard: (c) => (c.value < 0 ? { chips: 30 } : undefined),
    isCopyable: true,
  },
  {
    id: "minusminus",
    name: { pl: "Minus razy minus", en: "Minus Times Minus" },
    desc: {
      pl: "[x:×2] Mnożnika, jeśli co najmniej 2 zagrane karty mają [a:ujemną] odpowiedź",
      en: "[x:×2] Mult if 2 or more played cards have a [a:negative] answer",
    },
    rarity: "uncommon",
    cost: 6,
    art: "−·−",
    onHand: (c) => (c.values.filter((v) => v < 0).length >= 2 ? { xmult: 2 } : undefined),
    isCopyable: true,
  },
  {
    id: "intuicja",
    name: { pl: "Intuicja", en: "Intuition" },
    desc: {
      pl: "Pokazuje [a:znak] (+/−) odpowiedzi każdej karty na ręce",
      en: "Shows the [a:sign] (+/−) of every card in your hand",
    },
    rarity: "uncommon",
    cost: 6,
    art: "🔮",
    passive: { revealSign: true },
  },
  {
    id: "rzeczoznawca",
    name: { pl: "Rzeczoznawca", en: "Appraiser" },
    desc: {
      pl: "Pokazuje [a:przedział] odpowiedzi każdej karty na ręce",
      en: "Shows the answer [a:range] of every card in your hand",
    },
    rarity: "uncommon",
    cost: 7,
    art: "🔍",
    passive: { revealRange: true },
  },
  {
    id: "wrozbita",
    name: { pl: "Wróżbita", en: "Fortune Teller" },
    desc: {
      pl: "Po każdej zagranej ręce ujawnia [a:odpowiedź] 1 losowej karty na ręce",
      en: "After each hand played, reveals the [a:answer] of 1 random card in hand",
    },
    rarity: "uncommon",
    cost: 6,
    art: "🧿",
  },
  {
    id: "fibonacci",
    name: { pl: "Fibonacci", en: "Fibonacci" },
    desc: {
      pl: "Karty z odpowiedzią z [a:ciągu Fibonacciego] (1, 2, 3, 5, 8, 13…) dają [m:+8] Mnożnika",
      en: "Cards whose answer is a [a:Fibonacci number] (1, 2, 3, 5, 8, 13…) give [m:+8] Mult",
    },
    rarity: "uncommon",
    cost: 7,
    art: "🐚",
    onCard: (c) => (isInt(c.value) && FIB.has(Math.round(c.value)) ? { mult: 8 } : undefined),
    isCopyable: true,
  },
  {
    id: "pierwsza",
    name: { pl: "Liczba pierwsza", en: "Prime Time" },
    desc: {
      pl: "Karty z odpowiedzią będącą [a:liczbą pierwszą] dają [c:+20] Żetonów i [m:+4] Mnożnika",
      en: "Cards with a [a:prime] answer give [c:+20] Chips and [m:+4] Mult",
    },
    rarity: "uncommon",
    cost: 7,
    art: "🔢",
    onCard: (c) => (isPrime(c.value) ? { chips: 20, mult: 4 } : undefined),
    isCopyable: true,
  },
  {
    id: "odwrotny",
    name: { pl: "Przekorny", en: "Contrarian" },
    desc: {
      pl: "Karty z [a:ujemną] odpowiedzią dają Mnożnik równy [m:|odpowiedzi|]",
      en: "Cards with a [a:negative] answer give Mult equal to [m:|answer|]",
    },
    rarity: "uncommon",
    cost: 7,
    art: "🙃",
    onCard: (c) => (c.value < 0 ? { mult: Math.min(50, Math.round(Math.abs(c.value))) } : undefined),
    isCopyable: true,
  },
  {
    id: "olimpijczyk",
    name: { pl: "Olimpijczyk", en: "Olympian" },
    desc: {
      pl: "[g:1 na 4] szansy na [a:podniesienie poziomu] zagranego układu",
      en: "[g:1 in 4] chance to [a:upgrade] the level of the played hand",
    },
    rarity: "uncommon",
    cost: 6,
    art: "🏅",
    onBefore: (c) => {
      if (c.rng.chance(1 / 4)) {
        c.run.handLevels[c.handType] = (c.run.handLevels[c.handType] ?? 1) + 1;
        return { text: { pl: "Poziom w górę!", en: "Level up!" } };
      }
    },
  },
  {
    id: "rutyna",
    name: { pl: "Rutyna", en: "Routine" },
    desc: {
      pl: "[x:×3] Mnożnika, jeśli ten układ był już zagrany w tej rundzie",
      en: "[x:×3] Mult if this hand type was already played this round",
    },
    rarity: "uncommon",
    cost: 6,
    art: "🔂",
    onHand: (c) => (c.round.handTypesPlayed.slice(0, -1).includes(c.handType) ? { xmult: 3 } : undefined),
    isCopyable: true,
  },
  {
    id: "seria",
    name: { pl: "Czysta seria", en: "Clean Streak" },
    desc: {
      pl: "[m:+2] Mnożnika za każdą kolejną rękę [a:bez ujemnej karty]; zeruje się przy ujemnej [a:(teraz +{mult})]",
      en: "[m:+2] Mult per consecutive hand [a:without a negative card]; resets otherwise [a:(currently +{mult})]",
    },
    rarity: "uncommon",
    cost: 6,
    art: "🔥",
    initVars: () => ({ mult: 0 }),
    vars: (j) => ({ mult: j.vars.mult ?? 0 }),
    onBefore: (c) => {
      if (c.values.some((v) => v < 0)) {
        c.joker.vars.mult = 0;
        return { text: { pl: "Reset!", en: "Reset!" } };
      }
      c.joker.vars.mult = (c.joker.vars.mult ?? 0) + 2;
    },
    onHand: (c) => ((c.joker.vars.mult ?? 0) > 0 ? { mult: c.joker.vars.mult } : undefined),
    isCopyable: true,
  },
  {
    id: "skrot",
    name: { pl: "Skrót myślowy", en: "Shortcut" },
    desc: {
      pl: "[a:Kolor] i [a:Przekrój] można ułożyć z [a:4] kart",
      en: "All [a:Flushes] and [a:Cross-sections] can be made with [a:4] cards",
    },
    rarity: "uncommon",
    cost: 7,
    art: "✌️",
    passive: { isFourFingers: true },
  },
  {
    id: "tablica",
    name: { pl: "Tablica", en: "Blackboard" },
    desc: {
      pl: "[x:×3] Mnożnika, jeśli wszystkie karty [a:trzymane] na ręce są z działów [alg:Algebra] lub [geo:Geometria]",
      en: "[x:×3] Mult if all cards [a:held] in hand are [alg:Algebra] or [geo:Geometry]",
    },
    rarity: "uncommon",
    cost: 6,
    art: "🖤",
    onHand: (c) =>
      c.heldTasks.every((t) => CAT_SUIT[t.cat] === "alg" || CAT_SUIT[t.cat] === "geo") ? { xmult: 3 } : undefined,
    isCopyable: true,
  },
  {
    id: "kredyt",
    name: { pl: "Kredyt studencki", en: "Student Loan" },
    desc: { pl: "Możesz zejść do [$:-$20] na minusie", en: "Go up to [$:-$20] in debt" },
    rarity: "uncommon",
    cost: 5,
    art: "💳",
    passive: { debtLimit: 20 },
  },
  {
    id: "nocka",
    name: { pl: "Zarwana nocka", en: "All-Nighter" },
    desc: {
      pl: "W [a:ostatniej] ręce rundy wszystkie zagrane karty liczą się [a:dwa razy]",
      en: "Retrigger all played cards in the [a:final] hand of the round",
    },
    rarity: "uncommon",
    cost: 5,
    art: "🌙",
    retrigger: (c) => (c.isLastHand ? 1 : 0),
    isCopyable: true,
  },
  {
    id: "korepetytor",
    name: { pl: "Korepetytor", en: "Tutor" },
    desc: {
      pl: "[$:$3], jeśli [a:wszystkie] zagrane karty mają poprawną odpowiedź",
      en: "Earn [$:$3] if [a:every] played card is answered correctly",
    },
    rarity: "uncommon",
    cost: 6,
    art: "👩‍🏫",
    onHand: (c) => (c.correctNotes > 0 && c.correctNotes === c.played.length ? { money: 3 } : undefined),
    isCopyable: true,
  },
  {
    id: "rownowaga",
    name: { pl: "Równowaga", en: "Equilibrium" },
    desc: {
      pl: "[x:×2] Mnożnika, jeśli ręka ma karty [a:dodatnie i ujemne]",
      en: "[x:×2] Mult if the played hand has both [a:positive and negative] cards",
    },
    rarity: "uncommon",
    cost: 6,
    art: "☯️",
    onHand: (c) => (c.values.some((v) => v > 0) && c.values.some((v) => v < 0) ? { xmult: 2 } : undefined),
    isCopyable: true,
  },

  // ─── rare ─────────────────────────────────────────────────────────────
  handXJoker("duet", "pair", 2, { pl: "Duet", en: "The Duo" }, HN.pair, "🎭"),
  handXJoker("trio", "three", 3, { pl: "Trio", en: "The Trio" }, HN.three, "🎺"),
  handXJoker("rodzina", "four", 4, { pl: "Rodzina", en: "The Family" }, HN.four, "👨‍👩‍👧‍👦"),
  handXJoker("porzadek", "cross", 3, { pl: "Porządek", en: "The Order" }, HN.cross, "📊"),
  handXJoker("plemie", "flush", 2, { pl: "Plemię", en: "The Tribe" }, HN.flush, "🏕️"),
  {
    id: "ksero",
    name: { pl: "Ksero", en: "Photocopier" },
    desc: { pl: "Kopiuje zdolność Jokera [a:po prawej]", en: "Copies the ability of the Joker to the [a:right]" },
    rarity: "rare",
    cost: 10,
    art: "📠",
  },
  {
    id: "burza",
    name: { pl: "Burza mózgów", en: "Brainstorm" },
    desc: { pl: "Kopiuje zdolność [a:skrajnie lewego] Jokera", en: "Copies the ability of the [a:leftmost] Joker" },
    rarity: "rare",
    cost: 10,
    art: "🧠",
  },
  {
    id: "kwadrat",
    name: { pl: "Do kwadratu", en: "Squared" },
    desc: {
      pl: "Karty, których odpowiedź jest [a:kwadratem] liczby całkowitej (0, 1, 4, 9…), dają [x:×1.5] Mnożnika",
      en: "Cards whose answer is a [a:perfect square] (0, 1, 4, 9…) give [x:×1.5] Mult",
    },
    rarity: "rare",
    cost: 9,
    art: "x²",
    onCard: (c) =>
      isInt(c.value) && c.value >= 0 && Number.isInteger(Math.sqrt(Math.round(c.value))) ? { xmult: 1.5 } : undefined,
    isCopyable: true,
  },
  {
    id: "nieskonczonosc",
    name: { pl: "Nieskończoność", en: "Infinity" },
    desc: {
      pl: "Zagrane karty dodają też swoją [a:odpowiedź] |x| jako Żetony (maks. {cap})",
      en: "Played cards also add their [a:answer] |x| as Chips (max {cap})",
    },
    rarity: "rare",
    cost: 9,
    art: "∞",
    vars: () => ({ cap: 50 }),
    onCard: (c) => {
      const chips = Math.round(Math.min(50, Math.abs(c.value)) * 100) / 100;
      return chips > 0 ? { chips } : undefined;
    },
    isCopyable: true,
  },
  {
    id: "prymus",
    name: { pl: "Prymus", en: "Valedictorian" },
    desc: {
      pl: "[x:×2] Mnożnika, jeśli [a:wszystkie] zagrane karty mają poprawną odpowiedź",
      en: "[x:×2] Mult if [a:every] played card is answered correctly",
    },
    rarity: "rare",
    cost: 9,
    art: "🏆",
    onHand: (c) => (c.correctNotes > 0 && c.correctNotes === c.played.length ? { xmult: 2 } : undefined),
    isCopyable: true,
  },
  {
    id: "wykladnik",
    name: { pl: "Wykładnik", en: "Exponent" },
    desc: {
      pl: "Zyskuje [x:×0.25] Mnożnika za każdą [a:Piątkę kart] zagraną w tej grze [a:(teraz ×{x})]",
      en: "Gains [x:×0.25] Mult for every [a:5-card] hand played [a:(currently ×{x})]",
    },
    rarity: "rare",
    cost: 8,
    art: "eˣ",
    initVars: () => ({ x: 1 }),
    vars: (j) => ({ x: (j.vars.x ?? 1).toFixed(2).replace(/\.?0+$/, "") }),
    onBefore: (c) => {
      if (c.played.length === 5) c.joker.vars.x = (c.joker.vars.x ?? 1) + 0.25;
    },
    onHand: (c) => ((c.joker.vars.x ?? 1) > 1 ? { xmult: c.joker.vars.x } : undefined),
    isCopyable: true,
  },

  // ─── legendary (only from "Natchnienie") ──────────────────────────────
  {
    id: "banach",
    name: { pl: "Stefan Banach", en: "Stefan Banach" },
    desc: {
      pl: "Zyskuje [x:×0.1] Mnożnika za każdą kartę z [a:poprawną odpowiedzią] [a:(teraz ×{x})]",
      en: "Gains [x:×0.1] Mult for every card played with a [a:correct answer] [a:(currently ×{x})]",
    },
    rarity: "legendary",
    cost: 20,
    art: "🇵🇱",
    initVars: () => ({ x: 1 }),
    vars: (j) => ({ x: j.vars.x ?? 1 }),
    onBefore: (c) => {
      if (c.correctNotes > 0) c.joker.vars.x = Math.round(((c.joker.vars.x ?? 1) + 0.1 * c.correctNotes) * 10) / 10;
    },
    onHand: (c) => ((c.joker.vars.x ?? 1) > 1 ? { xmult: c.joker.vars.x } : undefined),
    isCopyable: true,
  },
  {
    id: "sierpinski",
    name: { pl: "Wacław Sierpiński", en: "Wacław Sierpiński" },
    desc: {
      pl: "Każda zagrana karta liczy się [a:dwa razy] (fraktal!)",
      en: "Retrigger [a:every] played card (fractal!)",
    },
    rarity: "legendary",
    cost: 20,
    art: "🔻",
    retrigger: () => 1,
    isCopyable: true,
  },
  {
    id: "kopernik",
    name: { pl: "Mikołaj Kopernik", en: "Nicolaus Copernicus" },
    desc: { pl: "Wyłącza efekt każdego [a:Bossa]", en: "Disables the effect of every [a:Boss Blind]" },
    rarity: "legendary",
    cost: 20,
    art: "☀️",
    passive: { disablesBoss: true },
  },
  {
    id: "ulam",
    name: { pl: "Stanisław Ulam", en: "Stanisław Ulam" },
    desc: {
      pl: "Karty z odpowiedzią [a:pierwszą] dają [x:×2] Mnożnika (spirala Ulama)",
      en: "Cards with a [a:prime] answer give [x:×2] Mult (Ulam spiral)",
    },
    rarity: "legendary",
    cost: 20,
    art: "🌀",
    onCard: (c) => (isPrime(c.value) ? { xmult: 2 } : undefined),
    isCopyable: true,
  },
  {
    id: "steinhaus",
    name: { pl: "Hugo Steinhaus", en: "Hugo Steinhaus" },
    desc: {
      pl: "[x:×1] Mnożnika plus [x:×0.2] za każdą kartę w [a:talii] powyżej 20 [a:(teraz ×{x})]",
      en: "[x:×1] Mult plus [x:×0.2] for every card left in [a:deck] above 20 [a:(currently ×{x})]",
    },
    rarity: "legendary",
    cost: 20,
    art: "🎻",
    vars: (_j, run) => ({ x: (1 + 0.2 * Math.max(0, (run?.round?.deck.length ?? 20) - 20)).toFixed(1) }),
    onHand: (c) => ({ xmult: 1 + 0.2 * Math.max(0, c.round.deck.length - 20) }),
    isCopyable: true,
  },
];

export const JOKER_BY_ID = Object.fromEntries(JOKERS.map((j) => [j.id, j])) as Record<string, JokerDef>;

export const RARITY_COLOR: Record<JokerRarity, string> = {
  common: "#009dff",
  uncommon: "#4bc292",
  rare: "#fe5f55",
  legendary: "#b26cbb",
};

export const RARITY_NAME: Record<JokerRarity, L10n> = {
  common: { pl: "Pospolity", en: "Common" },
  uncommon: { pl: "Niepospolity", en: "Uncommon" },
  rare: { pl: "Rzadki", en: "Rare" },
  legendary: { pl: "Legendarny", en: "Legendary" },
};

/** Base-hand chips for tooltips (kept here so UI doesn't import scoring). */
export function describeHandBase(id: HandTypeId, level: number) {
  return handBase(id, level);
}
