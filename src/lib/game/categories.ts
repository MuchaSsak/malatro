import type { CategoryId, L10n, SuitId } from "~/lib/game/types";

/** Działy play the role of poker suits; categories play the role of ranks. */
export const SUITS: Record<SuitId, { name: L10n; symbol: string; color: string }> = {
  alg: { name: { pl: "Algebra", en: "Algebra" }, symbol: "♠", color: "#4f6cf0" },
  fun: { name: { pl: "Funkcje", en: "Functions" }, symbol: "♥", color: "#fe4d5f" },
  geo: { name: { pl: "Geometria", en: "Geometry" }, symbol: "♦", color: "#f0892a" },
  rac: { name: { pl: "Rachunek", en: "Chance" }, symbol: "♣", color: "#2fae78" },
};

export const SUIT_IDS = Object.keys(SUITS) as SuitId[];

export const CATEGORIES: Record<CategoryId, { name: L10n; short: L10n; suit: SuitId; glyph: string }> = {
  liczby: {
    name: { pl: "Liczby rzeczywiste", en: "Real numbers" },
    short: { pl: "Liczby", en: "Numbers" },
    suit: "alg",
    glyph: "ℝ",
  },
  wyrazenia: {
    name: { pl: "Wyrażenia algebraiczne", en: "Algebraic expressions" },
    short: { pl: "Wyrażenia", en: "Expressions" },
    suit: "alg",
    glyph: "x²",
  },
  rownania: {
    name: { pl: "Równania i nierówności", en: "Equations & inequalities" },
    short: { pl: "Równania", en: "Equations" },
    suit: "alg",
    glyph: "=",
  },
  funkcje: {
    name: { pl: "Funkcje", en: "Functions" },
    short: { pl: "Funkcje", en: "Functions" },
    suit: "fun",
    glyph: "f",
  },
  ciagi: { name: { pl: "Ciągi", en: "Sequences" }, short: { pl: "Ciągi", en: "Sequences" }, suit: "fun", glyph: "aₙ" },
  analiza: {
    name: { pl: "Rachunek różniczkowy", en: "Calculus" },
    short: { pl: "Pochodne", en: "Calculus" },
    suit: "fun",
    glyph: "f′",
  },
  trygonometria: {
    name: { pl: "Trygonometria", en: "Trigonometry" },
    short: { pl: "Trygonometria", en: "Trig" },
    suit: "geo",
    glyph: "sin",
  },
  planimetria: {
    name: { pl: "Planimetria", en: "Plane geometry" },
    short: { pl: "Planimetria", en: "Plane geo" },
    suit: "geo",
    glyph: "△",
  },
  analityczna: {
    name: { pl: "Geometria analityczna", en: "Analytic geometry" },
    short: { pl: "Analityczna", en: "Analytic" },
    suit: "geo",
    glyph: "xy",
  },
  stereometria: {
    name: { pl: "Stereometria", en: "Solid geometry" },
    short: { pl: "Stereometria", en: "Solids" },
    suit: "geo",
    glyph: "◇",
  },
  kombinatoryka: {
    name: { pl: "Kombinatoryka", en: "Combinatorics" },
    short: { pl: "Kombinatoryka", en: "Counting" },
    suit: "rac",
    glyph: "n!",
  },
  prawdopodobienstwo: {
    name: { pl: "Prawdopodobieństwo", en: "Probability" },
    short: { pl: "Prawdop.", en: "Probability" },
    suit: "rac",
    glyph: "P",
  },
  statystyka: {
    name: { pl: "Statystyka", en: "Statistics" },
    short: { pl: "Statystyka", en: "Statistics" },
    suit: "rac",
    glyph: "x̄",
  },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function suitOf(cat: CategoryId): SuitId {
  return CATEGORIES[cat].suit;
}
