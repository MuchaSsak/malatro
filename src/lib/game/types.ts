/**
 * Core game types. The engine is framework-free: React observes it through a snapshot
 * (see `engine.ts`), so everything here must stay JSON-serialisable for run saves.
 */

/** Types */

export type Locale = "pl" | "en";
export type L10n = { pl: string; en: string };

export type SuitId = "alg" | "fun" | "geo" | "rac";
export type CategoryId =
  | "liczby"
  | "wyrazenia"
  | "rownania"
  | "funkcje"
  | "ciagi"
  | "analiza"
  | "trygonometria"
  | "planimetria"
  | "analityczna"
  | "stereometria"
  | "kombinatoryka"
  | "prawdopodobienstwo"
  | "statystyka";

export type Level = "P" | "R";
export type DifficultyMode = "trywialne" | "trywialne_plus" | "ciekawe";

/** One matura task as shipped in `public/data/tasks.json` (short keys keep the file small). */
export type TaskRecord = {
  id: string; // "f2023-P-2024-maj__14.1"
  exam: string; // "f2023-P-2024-maj"
  task: string; // "14.1"
  level: Level;
  cat: CategoryId;
  topic: L10n;
  diff: number; // 1..5
  pts: number; // max points in the exam
  value: number; // hidden chip value (final numeric answer, Σ if `sum`)
  sum: boolean; // value is the sum of all numbers in the answer
  tex: string; // exact value in LaTeX
  ans?: string; // full final answer as the key states it (LaTeX)
  s: L10n; // short card summary (inline LaTeX in $...$)
  img: string; // path under /tasks/
  w: number;
  h: number;
  year: number;
  session: string; // maj | czerwiec | sierpien | probna | diagnostyczna
  formula: string; // 2005 | 2015 | 2023
  conf?: "high" | "medium"; // annotation confidence (low ones are dropped by build_dataset.py)
  fig?: boolean; // solving needs the sheet's figure: the English sheet shows the original crop too
  /** closed task: options A-D as [display LaTeX, answer to type]; exactly one matches `value` */
  opts?: [string, string][];
};

export type HandTypeId =
  "high" | "pair" | "twopair" | "three" | "cross" | "flush" | "full" | "four" | "five" | "flushfull";

export type Edition = "foil" | "holo" | "poly" | "negative";
export type Enhancement = "bonus" | "mult" | "glass" | "lucky" | "gold";
export type RevealKind = "value" | "sign" | "range";

export type CardInstance = {
  uid: string;
  taskId: string;
  enh?: Enhancement;
  edition?: Exclude<Edition, "negative">;
  reveal?: RevealKind;
  /** value transforms applied by ściągi (negate / double / abs) */
  mods?: ("neg" | "dbl" | "abs")[];
  isFaceDown?: boolean;
  isDebuffed?: boolean;
};

export type JokerRarity = "common" | "uncommon" | "rare" | "legendary";

export type JokerInstance = {
  uid: string;
  id: string;
  edition?: Edition;
  /** per-instance counters for scaling jokers */
  vars: Record<string, number>;
  isDisabled?: boolean;
};

export type ConsumableKind = "sciaga" | "twierdzenie";
export type ConsumableInstance = { uid: string; kind: ConsumableKind; id: string; isNegative?: boolean };

export type BlindKind = "small" | "big" | "boss";

export type PackKind = "zadania" | "sciagi" | "twierdzenia" | "jokery";
export type PackSize = "normal" | "jumbo" | "mega";

export type ShopItem =
  | { uid: string; type: "joker"; joker: JokerInstance; price: number }
  | { uid: string; type: "consumable"; item: ConsumableInstance; price: number }
  | { uid: string; type: "task"; card: CardInstance; price: number };

export type ShopPack = { uid: string; kind: PackKind; size: PackSize; price: number; isSold?: boolean };

export type ShopState = {
  items: (ShopItem & { isSold?: boolean })[];
  packs: ShopPack[];
  vouchers: { id: string; price: number; isSold?: boolean }[];
  rerollCost: number;
  freeRerolls: number;
};

export type PackChoice =
  | { uid: string; type: "joker"; joker: JokerInstance }
  | { uid: string; type: "consumable"; item: ConsumableInstance }
  | { uid: string; type: "task"; card: CardInstance };

export type PackState = {
  kind: PackKind;
  size: PackSize;
  choices: PackChoice[];
  picksLeft: number;
  /** where to go when done */
  returnTo: "shop" | "blind-select";
};

export type ScoreEvent =
  | { kind: "hand"; chips: number; mult: number }
  | {
      kind: "card";
      cardUid: string;
      chips: number;
      value: number;
      isRetrigger?: boolean;
      isDebuffed?: boolean;
      /** the player's answer was wrong: the card scores nothing */
      isWrong?: boolean;
    }
  | { kind: "card-mult"; cardUid: string; mult: number }
  | { kind: "card-xmult"; cardUid: string; xmult: number }
  | { kind: "card-chips"; cardUid: string; chips: number }
  | { kind: "card-money"; cardUid: string; money: number }
  | { kind: "card-note"; cardUid: string; isCorrect: boolean }
  | { kind: "joker-chips"; jokerUid: string; chips: number }
  | { kind: "joker-mult"; jokerUid: string; mult: number }
  | { kind: "joker-xmult"; jokerUid: string; xmult: number }
  | { kind: "joker-money"; jokerUid: string; money: number }
  | { kind: "joker-text"; jokerUid: string; text: L10n }
  | { kind: "boss"; text: L10n };

export type ScoringResult = {
  handType: HandTypeId;
  handLevel: number;
  events: ScoreEvent[];
  chips: number;
  mult: number;
  total: number;
  moneyGained: number;
  correctNotes: number;
  /** per answered (face-up) card: was the player's answer right */
  noteResults: { taskId: string; isCorrect: boolean }[];
  /** cards actually scored (after debuffs), left to right */
  scoredUids: string[];
};

export type RoundState = {
  blind: BlindKind;
  bossId: string | null;
  target: number;
  score: number;
  handsLeft: number;
  discardsLeft: number;
  handSize: number;
  deck: CardInstance[];
  hand: CardInstance[];
  selected: string[];
  discardPile: CardInstance[];
  handTypesPlayed: HandTypeId[];
  /** set while the UI animates a played hand; cleared by `resolvePlay` */
  pending: { played: CardInstance[]; result: ScoringResult } | null;
  handsPlayed: number;
  /** boss "Mgła": remember first-hand-face-down etc. */
  flags: Record<string, number>;
  forcedUid: string | null;
  startedAt: number;
  /** boss "Zegar": epoch ms when the timer runs out */
  deadline: number | null;
};

export type CashoutLine = { label: L10n; money: number; tone: "blind" | "hands" | "interest" | "joker" | "other" };
export type CashoutState = { lines: CashoutLine[]; total: number };

export type BlindPlan = {
  small: { tag: string };
  big: { tag: string };
  boss: { bossId: string };
};

export type RunStats = {
  handsPlayed: number;
  cardsPlayed: number;
  correctNotes: number;
  /** face-up cards played (each needed an answer); older saves lack it */
  answeredNotes?: number;
  bestHand: number;
  totalScore: number;
  rerolls: number;
  bossesBeaten: number;
  moneyEarned: number;
  /** active play time in ms; gaps between actions are capped so idle/closed tabs don't count */
  playTimeMs?: number;
};

export type RunPhase = "blind-select" | "round" | "cashout" | "shop" | "pack" | "gameover" | "won";

export type RunState = {
  version: 1;
  id: string;
  seed: string;
  rng: number;
  difficulty: DifficultyMode;
  ante: number;
  blindIndex: 0 | 1 | 2;
  phase: RunPhase;
  money: number;
  jokerSlots: number;
  consumableSlots: number;
  jokers: JokerInstance[];
  consumables: ConsumableInstance[];
  vouchers: string[];
  tags: string[];
  handLevels: Record<HandTypeId, number>;
  handPlays: Record<HandTypeId, number>;
  seen: Record<string, number>; // taskId -> blind counter when dealt
  blindCounter: number;
  reserved: CardInstance[];
  plan: BlindPlan;
  round: RoundState | null;
  shop: ShopState | null;
  pack: PackState | null;
  cashout: CashoutState | null;
  stats: RunStats;
  /** player's own answers, by task id */
  notes: Record<string, string>;
  /** values learned by playing / revealing, by task id */
  known: Record<string, RevealKind>;
  lastPlanet: string | null;
  bossHistory: string[];
  /** voucher offered this ante (restocks after each boss) */
  anteVoucher: string | null;
  shopsVisited: number;
  lastConsumable: { kind: ConsumableKind; id: string } | null;
  createdAt: number;
  updatedAt: number;
  isSubmitted?: boolean;
  endless?: boolean;
  /**
   * tasks already met in earlier runs (bitset over the pool, see `encodeTaskSet`) when the run was
   * started with "prefer new tasks": fresh ones are dealt more often. Kept in the run (and the run
   * history) so replaying the seed deals the same cards.
   */
  avoid?: string;
  /** a testing cheat was used: the run never goes to the leaderboard */
  isCheated?: boolean;
  /** cheat: ×mult applied to the next played hand, then cleared */
  cheatMult?: number;
  lostTo?: { ante: number; blind: BlindKind; bossId: string | null; score: number; target: number } | null;
};
