import { CATEGORIES } from "~/lib/game/categories";
import type { CategoryId, HandTypeId, L10n } from "~/lib/game/types";

export type HandTypeDef = {
  id: HandTypeId;
  name: L10n;
  rule: L10n;
  chips: number;
  mult: number;
  lvlChips: number;
  lvlMult: number;
  /** hidden from the run-info list until played once (Balatro's secret hands) */
  isSecret?: boolean;
};

/** Ordered weakest -> strongest; detection walks it backwards. */
export const HAND_TYPES: HandTypeDef[] = [
  {
    id: "high",
    name: { pl: "Karta wysoka", en: "High Card" },
    rule: { pl: "Dowolne karty bez układu", en: "Any cards, no combination" },
    chips: 5,
    mult: 1,
    lvlChips: 10,
    lvlMult: 1,
  },
  {
    id: "pair",
    name: { pl: "Para", en: "Pair" },
    rule: { pl: "2 karty z tej samej kategorii", en: "2 cards of the same category" },
    chips: 10,
    mult: 2,
    lvlChips: 15,
    lvlMult: 1,
  },
  {
    id: "twopair",
    name: { pl: "Dwie pary", en: "Two Pair" },
    rule: { pl: "2 + 2 karty z dwóch kategorii", en: "2 + 2 cards from two categories" },
    chips: 20,
    mult: 2,
    lvlChips: 20,
    lvlMult: 1,
  },
  {
    id: "three",
    name: { pl: "Trójka", en: "Three of a Kind" },
    rule: { pl: "3 karty z tej samej kategorii", en: "3 cards of the same category" },
    chips: 30,
    mult: 3,
    lvlChips: 20,
    lvlMult: 2,
  },
  {
    id: "cross",
    name: { pl: "Przekrój", en: "Cross-section" },
    rule: {
      pl: "5 kart z 5 różnych kategorii, wszystkie 4 działy",
      en: "5 cards from 5 different categories covering all 4 branches",
    },
    chips: 30,
    mult: 4,
    lvlChips: 30,
    lvlMult: 3,
  },
  {
    id: "flush",
    name: { pl: "Kolor", en: "Flush" },
    rule: { pl: "5 kart z tego samego działu", en: "5 cards of the same branch" },
    chips: 35,
    mult: 4,
    lvlChips: 15,
    lvlMult: 2,
  },
  {
    id: "full",
    name: { pl: "Full", en: "Full House" },
    rule: { pl: "3 + 2 karty z dwóch kategorii", en: "3 + 2 cards from two categories" },
    chips: 40,
    mult: 4,
    lvlChips: 25,
    lvlMult: 2,
  },
  {
    id: "four",
    name: { pl: "Kareta", en: "Four of a Kind" },
    rule: { pl: "4 karty z tej samej kategorii", en: "4 cards of the same category" },
    chips: 60,
    mult: 7,
    lvlChips: 30,
    lvlMult: 3,
  },
  {
    id: "flushfull",
    name: { pl: "Full w kolorze", en: "Flush House" },
    rule: { pl: "Full, wszystkie karty z jednego działu", en: "Full House within one branch" },
    chips: 140,
    mult: 14,
    lvlChips: 40,
    lvlMult: 4,
    isSecret: true,
  },
  {
    id: "five",
    name: { pl: "Piątka", en: "Five of a Kind" },
    rule: { pl: "5 kart z tej samej kategorii", en: "5 cards of the same category" },
    chips: 160,
    mult: 16,
    lvlChips: 50,
    lvlMult: 3,
    isSecret: true,
  },
];

export const HAND_BY_ID = Object.fromEntries(HAND_TYPES.map((h) => [h.id, h])) as Record<HandTypeId, HandTypeDef>;

export function handBase(id: HandTypeId, level: number): { chips: number; mult: number } {
  const def = HAND_BY_ID[id];
  const l = Math.max(1, level) - 1;
  return { chips: def.chips + def.lvlChips * l, mult: def.mult + def.lvlMult * l };
}

export type HandOptions = {
  /** "Skrót" joker: Kolor / Przekrój need only 4 cards */
  isFourFingers?: boolean;
};

export function detectHand(cats: CategoryId[], opts: HandOptions = {}): HandTypeId {
  if (cats.length === 0) return "high";
  const counts = new Map<CategoryId, number>();
  for (const c of cats) counts.set(c, (counts.get(c) ?? 0) + 1);
  const sorted = [...counts.values()].sort((a, b) => b - a);
  const suits = new Map<string, number>();
  for (const c of cats) suits.set(CATEGORIES[c].suit, (suits.get(CATEGORIES[c].suit) ?? 0) + 1);
  const need = opts.isFourFingers ? 4 : 5;
  const maxSuit = Math.max(...suits.values());
  const isFlush = cats.length >= need && maxSuit >= need;
  const isFull = sorted[0] >= 3 && (sorted[1] ?? 0) >= 2;
  const isCross = cats.length >= need && counts.size >= need && suits.size === 4;

  if (sorted[0] >= 5) return "five";
  if (isFull && suits.size === 1) return "flushfull";
  if (sorted[0] >= 4) return "four";
  if (isFull) return "full";
  if (isFlush) return "flush";
  if (isCross) return "cross";
  if (sorted[0] >= 3) return "three";
  if (sorted[0] >= 2 && (sorted[1] ?? 0) >= 2) return "twopair";
  if (sorted[0] >= 2) return "pair";
  return "high";
}

/** True when the played set "contains" a hand type (Balatro semantics for jokers like Jolly). */
export function containsHand(played: HandTypeId, wanted: HandTypeId): boolean {
  const contains: Record<HandTypeId, HandTypeId[]> = {
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
  return contains[played].includes(wanted);
}
