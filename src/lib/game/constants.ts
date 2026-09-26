import type { DifficultyMode, HandTypeId, L10n } from "~/lib/game/types";

/** Round defaults (Balatro values). */
export const BASE_HANDS = 4;
export const BASE_DISCARDS = 3;
export const BASE_HAND_SIZE = 8;
export const MAX_SELECT = 5;
export const BASE_JOKER_SLOTS = 5;
export const BASE_CONSUMABLE_SLOTS = 2;
export const DECK_SIZE = 40;
export const FINAL_ANTE = 8;

/**
 * A correctly answered card scores chips from how hard the task is, not from its answer's number
 * [user: "base it on difficulty"]: 6 + 5 per difficulty dot + 3 per exam point. A typical basic
 * task (2 dots, 1 pt) gives 19, a hard extended one (5 dots, 4 pts) 43. Every correct answer also
 * adds +1 Mult. A wrong answer scores nothing.
 */
export const CARD_CHIPS_BASE = 6;
export const CARD_CHIPS_PER_DIFF = 5;
export const CARD_CHIPS_PER_PT = 3;
export const KNOWLEDGE_MULT = 1;

export function taskChips(task: { diff: number; pts: number }): number {
  const diff = Math.max(1, Math.min(5, task.diff));
  const pts = Math.max(1, Math.min(6, task.pts));
  return CARD_CHIPS_BASE + CARD_CHIPS_PER_DIFF * diff + CARD_CHIPS_PER_PT * pts;
}

/**
 * Small-blind target per ante (index 0 = ante 1). Big = x1.5, Boss = x BossDef.targetMult.
 * Hand-tuned from the value distribution (mean capped card ~9): an unsolved 5-card pair scores
 * ~110 and a solved, well-picked hand ~200-450, so ante 1 needs 2-3 decent hands and rewards
 * solving. Growth is far gentler than Balatro's (x10 over 8 antes vs x166), per the brief: no
 * five-digit blinds. CIEKAWE is 10% lower because its tasks are much harder to solve.
 */
export const ANTE_BASE: Record<DifficultyMode, number[]> = {
  trywialne: [200, 400, 700, 1_050, 1_450, 1_900, 2_400, 3_000],
  trywialne_plus: [200, 400, 700, 1_050, 1_450, 1_900, 2_400, 3_000],
  ciekawe: [180, 360, 630, 950, 1_300, 1_700, 2_150, 2_700],
};

export function endlessBase(mode: DifficultyMode, ante: number): number {
  const a8 = ANTE_BASE[mode][7];
  const c = ante - FINAL_ANTE;
  return Math.floor(a8 * Math.pow(1.6 + Math.pow(0.75 * c, 1 + 0.2 * c), c));
}

export const BIG_BLIND_MULT = 1.5;

/** Economy */
export const START_MONEY = 4;
export const BLIND_REWARD = { small: 3, big: 4, boss: 5 } as const;
export const MONEY_PER_HAND = 1;
export const INTEREST_PER = 5;
export const BASE_INTEREST_CAP = 5;
export const BASE_REROLL = 5;
export const SHOP_CARD_SLOTS = 2;

export const PACK_PRICE = { normal: 4, jumbo: 6, mega: 8 } as const;
export const PACK_SHAPE = {
  zadania: { normal: [3, 1], jumbo: [5, 1], mega: [5, 2] },
  sciagi: { normal: [3, 1], jumbo: [5, 1], mega: [5, 2] },
  twierdzenia: { normal: [3, 1], jumbo: [5, 1], mega: [5, 2] },
  jokery: { normal: [2, 1], jumbo: [4, 1], mega: [4, 2] },
} as const;

export const VOUCHER_PRICE = 10;
export const SCIAGA_PRICE = 3;
export const TWIERDZENIE_PRICE = 3;

/** Shop card-type weights (Balatro: joker 20, tarot 4, planet 4) + our task cards. */
export const SHOP_WEIGHTS = { joker: 20, sciaga: 5, twierdzenie: 4, task: 6 } as const;
export const RARITY_WEIGHTS = { common: 70, uncommon: 25, rare: 5 } as const;
export const EDITION_ODDS = { foil: 0.04, holo: 0.028, poly: 0.006, negative: 0.004 } as const;
export const EDITION_SURCHARGE = { foil: 2, holo: 3, poly: 5, negative: 5 } as const;

export const DIFFICULTIES: { id: DifficultyMode; name: string; desc: L10n; tone: string }[] = [
  {
    id: "trywialne",
    name: "TRYWIALNE",
    desc: {
      pl: "Tylko zadania z matury podstawowej",
      en: "Basic-level matura tasks only",
    },
    tone: "#4bc292",
  },
  {
    id: "trywialne_plus",
    name: "TRYWIALNE+",
    desc: {
      pl: "Głównie podstawa, czasem łatwiejsze zadania z rozszerzenia (ok. 3:1)",
      en: "Mostly basic level, sometimes easier extended-level tasks (about 3:1)",
    },
    tone: "#009dff",
  },
  {
    id: "ciekawe",
    name: "CIEKAWE",
    desc: {
      pl: "Najtrudniejsze z podstawy i głównie rozszerzenie",
      en: "The hardest basic-level tasks and mostly extended level",
    },
    tone: "#fe5f55",
  },
];

export const HAND_ORDER: HandTypeId[] = [
  "five",
  "flushfull",
  "four",
  "full",
  "flush",
  "cross",
  "three",
  "twopair",
  "pair",
  "high",
];
