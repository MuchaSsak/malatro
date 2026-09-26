import type { HandTypeId, L10n, SuitId } from "~/lib/game/types";

/** Types */

export type SciagaTarget = { min: number; max: number } | null;

export type SciagaDef = {
  id: string;
  name: L10n;
  desc: L10n;
  art: string;
  /** hand cards the player must select (null = no target) */
  target: SciagaTarget;
  /** only usable while a round is in progress */
  isRoundOnly?: boolean;
  /** shop / pack weight */
  weight: number;
  effect:
    | { kind: "reveal"; reveal: "value" | "sign" | "range" }
    | { kind: "replace"; suit: SuitId }
    | { kind: "copy" }
    | { kind: "destroy" }
    | { kind: "enhance"; enh: "bonus" | "mult" | "glass" | "lucky" }
    | { kind: "mod"; mod: "neg" | "dbl" | "abs" }
    | { kind: "money-double" }
    | { kind: "wheel" }
    | { kind: "create"; what: "twierdzenie" | "sciaga" | "joker" | "legendary"; count: number }
    | { kind: "sell-sum" }
    | { kind: "repeat-last" };
};

export type TwierdzenieDef = { id: string; hand: HandTypeId; name: L10n; art: string };

/** Ściągi (tarot analogs) */

export const SCIAGI: SciagaDef[] = [
  {
    id: "klucz",
    name: { pl: "Klucz odpowiedzi", en: "Answer Key" },
    desc: { pl: "Ujawnia [a:dokładną wartość] 1 wybranej karty", en: "Reveals the [a:exact value] of 1 selected card" },
    art: "🗝️",
    target: { min: 1, max: 1 },
    isRoundOnly: true,
    weight: 5,
    effect: { kind: "reveal", reveal: "value" },
  },
  {
    id: "znak",
    name: { pl: "Test znaku", en: "Sign Test" },
    desc: { pl: "Ujawnia [a:znak] wartości do 3 wybranych kart", en: "Reveals the [a:sign] of up to 3 selected cards" },
    art: "±",
    target: { min: 1, max: 3 },
    isRoundOnly: true,
    weight: 6,
    effect: { kind: "reveal", reveal: "sign" },
  },
  {
    id: "szacunek",
    name: { pl: "Szacowanie", en: "Estimate" },
    desc: {
      pl: "Ujawnia [a:przedział] wartości do 2 wybranych kart",
      en: "Reveals the value [a:range] of up to 2 selected cards",
    },
    art: "≈",
    target: { min: 1, max: 2 },
    isRoundOnly: true,
    weight: 6,
    effect: { kind: "reveal", reveal: "range" },
  },
  {
    id: "zbior_alg",
    name: { pl: "Zbiór zadań: Algebra", en: "Workbook: Algebra" },
    desc: {
      pl: "Zamienia do 3 wybranych kart na nowe zadania z działu [alg:Algebra]",
      en: "Replaces up to 3 selected cards with new [alg:Algebra] tasks",
    },
    art: "♠",
    target: { min: 1, max: 3 },
    isRoundOnly: true,
    weight: 3,
    effect: { kind: "replace", suit: "alg" },
  },
  {
    id: "zbior_fun",
    name: { pl: "Zbiór zadań: Funkcje", en: "Workbook: Functions" },
    desc: {
      pl: "Zamienia do 3 wybranych kart na nowe zadania z działu [fun:Funkcje]",
      en: "Replaces up to 3 selected cards with new [fun:Functions] tasks",
    },
    art: "♥",
    target: { min: 1, max: 3 },
    isRoundOnly: true,
    weight: 3,
    effect: { kind: "replace", suit: "fun" },
  },
  {
    id: "zbior_geo",
    name: { pl: "Zbiór zadań: Geometria", en: "Workbook: Geometry" },
    desc: {
      pl: "Zamienia do 3 wybranych kart na nowe zadania z działu [geo:Geometria]",
      en: "Replaces up to 3 selected cards with new [geo:Geometry] tasks",
    },
    art: "♦",
    target: { min: 1, max: 3 },
    isRoundOnly: true,
    weight: 3,
    effect: { kind: "replace", suit: "geo" },
  },
  {
    id: "zbior_rac",
    name: { pl: "Zbiór zadań: Rachunek", en: "Workbook: Chance" },
    desc: {
      pl: "Zamienia do 3 wybranych kart na nowe zadania z działu [rac:Rachunek]",
      en: "Replaces up to 3 selected cards with new [rac:Chance] tasks",
    },
    art: "♣",
    target: { min: 1, max: 3 },
    isRoundOnly: true,
    weight: 3,
    effect: { kind: "replace", suit: "rac" },
  },
  {
    id: "kalka",
    name: { pl: "Kalka", en: "Carbon Copy" },
    desc: {
      pl: "Wybierz 2 karty: [a:lewa] staje się kopią [a:prawej]",
      en: "Select 2 cards: the [a:left] card becomes a copy of the [a:right] card",
    },
    art: "📑",
    target: { min: 2, max: 2 },
    isRoundOnly: true,
    weight: 4,
    effect: { kind: "copy" },
  },
  {
    id: "korektor",
    name: { pl: "Korektor", en: "Correction Fluid" },
    desc: { pl: "[a:Niszczy] do 2 wybranych kart", en: "[a:Destroys] up to 2 selected cards" },
    art: "⬜",
    target: { min: 1, max: 2 },
    isRoundOnly: true,
    weight: 4,
    effect: { kind: "destroy" },
  },
  {
    id: "zakreslacz",
    name: { pl: "Zakreślacz", en: "Highlighter" },
    desc: {
      pl: "Do 2 wybranych kart dostaje [a:Bonus]: [c:+30] Żetonów",
      en: "Enhances up to 2 selected cards to [a:Bonus]: [c:+30] Chips",
    },
    art: "🖍️",
    target: { min: 1, max: 2 },
    isRoundOnly: true,
    weight: 5,
    effect: { kind: "enhance", enh: "bonus" },
  },
  {
    id: "dlugopis",
    name: { pl: "Czerwony długopis", en: "Red Pen" },
    desc: {
      pl: "Do 2 wybranych kart dostaje [a:Mnożnik]: [m:+4] Mnożnika",
      en: "Enhances up to 2 selected cards to [a:Mult]: [m:+4] Mult",
    },
    art: "🖊️",
    target: { min: 1, max: 2 },
    isRoundOnly: true,
    weight: 5,
    effect: { kind: "enhance", enh: "mult" },
  },
  {
    id: "gwiazdka",
    name: { pl: "Złota gwiazdka", en: "Gold Star" },
    desc: {
      pl: "1 wybrana karta dostaje [a:Szkło]: [x:×2] Mnożnika",
      en: "Enhances 1 selected card to [a:Glass]: [x:×2] Mult",
    },
    art: "⭐",
    target: { min: 1, max: 1 },
    isRoundOnly: true,
    weight: 4,
    effect: { kind: "enhance", enh: "glass" },
  },
  {
    id: "olowek",
    name: { pl: "Szczęśliwy ołówek", en: "Lucky Pencil" },
    desc: {
      pl: "Do 2 wybranych kart dostaje [a:Szczęście]: [g:1 na 5] [m:+20] Mnożnika, [g:1 na 15] [$:$20]",
      en: "Enhances up to 2 cards to [a:Lucky]: [g:1 in 5] [m:+20] Mult, [g:1 in 15] [$:$20]",
    },
    art: "🍀",
    target: { min: 1, max: 2 },
    isRoundOnly: true,
    weight: 4,
    effect: { kind: "enhance", enh: "lucky" },
  },
  {
    id: "zmiana_znaku",
    name: { pl: "Zmiana znaku", en: "Sign Flip" },
    desc: { pl: "Zmienia [a:znak] wartości 1 wybranej karty", en: "Flips the [a:sign] of 1 selected card's value" },
    art: "⇄",
    target: { min: 1, max: 1 },
    isRoundOnly: true,
    weight: 4,
    effect: { kind: "mod", mod: "neg" },
  },
  {
    id: "podwojenie",
    name: { pl: "Podwojenie", en: "Doubling" },
    desc: { pl: "[a:Podwaja] wartość 1 wybranej karty", en: "[a:Doubles] the value of 1 selected card" },
    art: "×2",
    target: { min: 1, max: 1 },
    isRoundOnly: true,
    weight: 3,
    effect: { kind: "mod", mod: "dbl" },
  },
  {
    id: "wartosc_bezwzgledna",
    name: { pl: "Wartość bezwzględna", en: "Absolute" },
    desc: {
      pl: "Wartość do 2 wybranych kart staje się [a:|x|]",
      en: "The value of up to 2 selected cards becomes [a:|x|]",
    },
    art: "|·|",
    target: { min: 1, max: 2 },
    isRoundOnly: true,
    weight: 3,
    effect: { kind: "mod", mod: "abs" },
  },
  {
    id: "kieszonkowe",
    name: { pl: "Kieszonkowe", en: "Pocket Money" },
    desc: { pl: "[a:Podwaja] pieniądze (maks. [$:+$20])", en: "[a:Doubles] money (max of [$:$20])" },
    art: "💰",
    target: null,
    weight: 3,
    effect: { kind: "money-double" },
  },
  {
    id: "kolo",
    name: { pl: "Koło fortuny", en: "Wheel of Fortune" },
    desc: {
      pl: "[g:1 na 4] szansy na dodanie [a:Folii], [a:Holografii] lub [a:Polichromii] losowemu Jokerowi",
      en: "[g:1 in 4] chance to add [a:Foil], [a:Holographic] or [a:Polychrome] to a random Joker",
    },
    art: "🎡",
    target: null,
    weight: 3,
    effect: { kind: "wheel" },
  },
  {
    id: "wyrocznia",
    name: { pl: "Wyrocznia", en: "Oracle" },
    desc: { pl: "Tworzy do 2 losowych [a:Twierdzeń]", en: "Creates up to 2 random [a:Theorem] cards" },
    art: "🏛️",
    target: null,
    weight: 3,
    effect: { kind: "create", what: "twierdzenie", count: 2 },
  },
  {
    id: "notatki",
    name: { pl: "Notatki z lekcji", en: "Class Notes" },
    desc: { pl: "Tworzy do 2 losowych [a:Ściąg]", en: "Creates up to 2 random [a:Cheat Sheet] cards" },
    art: "🗒️",
    target: null,
    weight: 3,
    effect: { kind: "create", what: "sciaga", count: 2 },
  },
  {
    id: "sad",
    name: { pl: "Sąd", en: "Judgement" },
    desc: {
      pl: "Tworzy losowego [a:Jokera] (potrzebne miejsce)",
      en: "Creates a random [a:Joker] card (must have room)",
    },
    art: "⚖️",
    target: null,
    weight: 2,
    effect: { kind: "create", what: "joker", count: 1 },
  },
  {
    id: "wyprzedaz",
    name: { pl: "Wyprzedaż", en: "Garage Sale" },
    desc: {
      pl: "Daje łączną [a:wartość sprzedaży] Jokerów (maks. [$:$50])",
      en: "Gives the total [a:sell value] of all Jokers (max [$:$50])",
    },
    art: "🏷️",
    target: null,
    weight: 3,
    effect: { kind: "sell-sum" },
  },
  {
    id: "deja_vu",
    name: { pl: "Déjà vu", en: "Déjà Vu" },
    desc: {
      pl: "Tworzy ostatnio użytą [a:Ściągę] lub [a:Twierdzenie]",
      en: "Creates the last [a:Cheat Sheet] or [a:Theorem] used",
    },
    art: "🌫️",
    target: null,
    weight: 3,
    effect: { kind: "repeat-last" },
  },
  {
    id: "natchnienie",
    name: { pl: "Natchnienie", en: "Epiphany" },
    desc: { pl: "Tworzy [a:Legendarnego] Jokera", en: "Creates a [a:Legendary] Joker" },
    art: "💡",
    target: null,
    weight: 0, // only via the rare roll in Paczka ściąg
    effect: { kind: "create", what: "legendary", count: 1 },
  },
];

export const SCIAGA_BY_ID = Object.fromEntries(SCIAGI.map((s) => [s.id, s])) as Record<string, SciagaDef>;

/** Twierdzenia (planet analogs) — one per hand type */

export const TWIERDZENIA: TwierdzenieDef[] = [
  { id: "aksjomat", hand: "high", name: { pl: "Aksjomat", en: "Axiom" }, art: "𝔸" },
  { id: "tales", hand: "pair", name: { pl: "Twierdzenie Talesa", en: "Thales's Theorem" }, art: "∥" },
  { id: "pitagoras", hand: "twopair", name: { pl: "Twierdzenie Pitagorasa", en: "Pythagorean Theorem" }, art: "a²" },
  { id: "sinusy", hand: "three", name: { pl: "Twierdzenie sinusów", en: "Law of Sines" }, art: "sin" },
  { id: "bezout", hand: "cross", name: { pl: "Twierdzenie Bézouta", en: "Bézout's Theorem" }, art: "W(x)" },
  { id: "cosinusy", hand: "flush", name: { pl: "Twierdzenie cosinusów", en: "Law of Cosines" }, art: "cos" },
  { id: "viete", hand: "full", name: { pl: "Wzory Viète'a", en: "Vieta's Formulas" }, art: "x₁x₂" },
  { id: "fermat", hand: "four", name: { pl: "Wielkie twierdzenie Fermata", en: "Fermat's Last Theorem" }, art: "xⁿ" },
  { id: "godel", hand: "flushfull", name: { pl: "Twierdzenie Gödla", en: "Gödel's Theorem" }, art: "⊬" },
  { id: "riemann", hand: "five", name: { pl: "Hipoteza Riemanna", en: "Riemann Hypothesis" }, art: "ζ" },
];

export const TWIERDZENIE_BY_ID = Object.fromEntries(TWIERDZENIA.map((t) => [t.id, t])) as Record<
  string,
  TwierdzenieDef
>;
export const TWIERDZENIE_BY_HAND = Object.fromEntries(TWIERDZENIA.map((t) => [t.hand, t])) as Record<
  HandTypeId,
  TwierdzenieDef
>;
