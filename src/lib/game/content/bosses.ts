import type { L10n, SuitId } from "~/lib/game/types";

export type BossEffect =
  | { kind: "hook" }
  | { kind: "debuff-suit"; suit: SuitId }
  | { kind: "no-drawing" }
  | { kind: "must-five" }
  | { kind: "hand-size"; delta: number }
  | { kind: "round-down" }
  | { kind: "wall" }
  | { kind: "needle" }
  | { kind: "fog" }
  | { kind: "water" }
  | { kind: "mouth" }
  | { kind: "amnesia" }
  | { kind: "flint" }
  | { kind: "mirror" }
  | { kind: "eye" }
  | { kind: "tooth" }
  | { kind: "hard" }
  | { kind: "clock"; seconds: number }
  | { kind: "committee" }
  | { kind: "director" }
  | { kind: "examiner" }
  | { kind: "resit" }
  | { kind: "curator" };

export type BossDef = {
  id: string;
  name: L10n;
  desc: L10n;
  minAnte: number;
  isFinisher?: boolean;
  color: string;
  targetMult: number;
  reward?: number;
  effect: BossEffect;
  glyph: string;
};

export const BOSSES: BossDef[] = [
  {
    id: "hak",
    name: { pl: "Hak", en: "The Hook" },
    desc: {
      pl: "Po każdej zagranej ręce odrzuca 2 losowe karty z ręki",
      en: "Discards 2 random cards from your hand after each hand played",
    },
    minAnte: 1,
    color: "#a84024",
    targetMult: 2,
    effect: { kind: "hook" },
    glyph: "🪝",
  },
  {
    id: "bez_alg",
    name: { pl: "Bez algebry", en: "No Algebra" },
    desc: { pl: "Karty z działu Algebra nie dają punktów", en: "All Algebra cards are debuffed" },
    minAnte: 1,
    color: "#4f6cf0",
    targetMult: 2,
    effect: { kind: "debuff-suit", suit: "alg" },
    glyph: "♠",
  },
  {
    id: "bez_fun",
    name: { pl: "Bez funkcji", en: "No Functions" },
    desc: { pl: "Karty z działu Funkcje nie dają punktów", en: "All Functions cards are debuffed" },
    minAnte: 1,
    color: "#fe4d5f",
    targetMult: 2,
    effect: { kind: "debuff-suit", suit: "fun" },
    glyph: "♥",
  },
  {
    id: "bez_geo",
    name: { pl: "Bez geometrii", en: "No Geometry" },
    desc: { pl: "Karty z działu Geometria nie dają punktów", en: "All Geometry cards are debuffed" },
    minAnte: 1,
    color: "#f0892a",
    targetMult: 2,
    effect: { kind: "debuff-suit", suit: "geo" },
    glyph: "♦",
  },
  {
    id: "bez_rac",
    name: { pl: "Bez rachunku", en: "No Chance" },
    desc: { pl: "Karty z działu Rachunek nie dają punktów", en: "All Chance cards are debuffed" },
    minAnte: 1,
    color: "#2fae78",
    targetMult: 2,
    effect: { kind: "debuff-suit", suit: "rac" },
    glyph: "♣",
  },
  {
    id: "brudnopis",
    name: { pl: "Zakaz brudnopisu", en: "No Scratch Paper" },
    desc: { pl: "W tej rundzie nie możesz rysować po zadaniach", en: "You cannot draw on tasks this round" },
    minAnte: 1,
    color: "#7d7d7d",
    targetMult: 2,
    effect: { kind: "no-drawing" },
    glyph: "🚫",
  },
  {
    id: "pelne_zdanie",
    name: { pl: "Pełne zdanie", en: "Full Sentence" },
    desc: { pl: "Musisz zagrać 5 kart", en: "Must play 5 cards" },
    minAnte: 1,
    color: "#efc03c",
    targetMult: 2,
    effect: { kind: "must-five" },
    glyph: "5",
  },
  {
    id: "ciasna_lawka",
    name: { pl: "Ciasna ławka", en: "Cramped Desk" },
    desc: { pl: "-1 karta na ręce", en: "-1 hand size" },
    minAnte: 1,
    color: "#575757",
    targetMult: 2,
    effect: { kind: "hand-size", delta: -1 },
    glyph: "⛓",
  },
  {
    id: "zaokraglenie",
    name: { pl: "Zaokrąglenie w dół", en: "Round Down" },
    desc: {
      pl: "Wartości kart są zaokrąglane w dół do liczb całkowitych",
      en: "Card values are rounded down to integers",
    },
    minAnte: 1,
    color: "#5c6e91",
    targetMult: 2,
    effect: { kind: "round-down" },
    glyph: "⌊x⌋",
  },
  {
    id: "sciana",
    name: { pl: "Ściana", en: "The Wall" },
    desc: { pl: "Bardzo duży próg punktowy", en: "Extra large blind" },
    minAnte: 2,
    color: "#8a59a5",
    targetMult: 3,
    effect: { kind: "wall" },
    glyph: "🧱",
  },
  {
    id: "kartkowka",
    name: { pl: "Kartkówka", en: "Pop Quiz" },
    desc: { pl: "Tylko 1 ręka", en: "Play only 1 hand" },
    minAnte: 2,
    color: "#5c6e31",
    targetMult: 1,
    effect: { kind: "needle" },
    glyph: "📝",
  },
  {
    id: "mgla",
    name: { pl: "Mgła", en: "The Fog" },
    desc: { pl: "1 na 3 karty jest dobierana zakryta", en: "1 in 3 cards are drawn face down" },
    minAnte: 2,
    color: "#50bf7c",
    targetMult: 2,
    effect: { kind: "fog" },
    glyph: "🌫",
  },
  {
    id: "woda",
    name: { pl: "Woda", en: "The Water" },
    desc: { pl: "Zaczynasz z 0 zrzutkami", en: "Start with 0 discards" },
    minAnte: 2,
    color: "#c6e0eb",
    targetMult: 2,
    effect: { kind: "water" },
    glyph: "💧",
  },
  {
    id: "usta",
    name: { pl: "Usta", en: "The Mouth" },
    desc: { pl: "W tej rundzie możesz grać tylko jeden rodzaj układu", en: "Play only 1 hand type this round" },
    minAnte: 2,
    color: "#ae718e",
    targetMult: 2,
    effect: { kind: "mouth" },
    glyph: "👄",
  },
  {
    id: "amnezja",
    name: { pl: "Amnezja", en: "Amnesia" },
    desc: { pl: "Obniża poziom zagranego układu", en: "Decrease level of played poker hand" },
    minAnte: 2,
    color: "#6865f3",
    targetMult: 2,
    effect: { kind: "amnesia" },
    glyph: "💭",
  },
  {
    id: "polowa",
    name: { pl: "Połowa", en: "The Flint" },
    desc: { pl: "Bazowe Żetony i Mnożnik są o połowę mniejsze", en: "Base Chips and Mult are halved" },
    minAnte: 2,
    color: "#e56a2f",
    targetMult: 2,
    effect: { kind: "flint" },
    glyph: "½",
  },
  {
    id: "lustro",
    name: { pl: "Lustro", en: "The Mirror" },
    desc: { pl: "Wartości wszystkich kart zmieniają znak", en: "All card values are negated" },
    minAnte: 3,
    color: "#b9cbe0",
    targetMult: 2,
    effect: { kind: "mirror" },
    glyph: "🪞",
  },
  {
    id: "oko",
    name: { pl: "Oko", en: "The Eye" },
    desc: { pl: "Żaden układ nie może się powtórzyć w tej rundzie", en: "No repeat hand types this round" },
    minAnte: 3,
    color: "#4b71e4",
    targetMult: 2,
    effect: { kind: "eye" },
    glyph: "👁",
  },
  {
    id: "oplata",
    name: { pl: "Opłata egzaminacyjna", en: "Exam Fee" },
    desc: { pl: "Tracisz $1 za każdą zagraną kartę", en: "Lose $1 per card played" },
    minAnte: 3,
    color: "#b52d2d",
    targetMult: 2,
    effect: { kind: "tooth" },
    glyph: "🦷",
  },
  {
    id: "trudny",
    name: { pl: "Trudny arkusz", en: "Hard Paper" },
    desc: { pl: "Dobierane są tylko najtrudniejsze zadania", en: "Only the hardest tasks are drawn" },
    minAnte: 3,
    color: "#3d3d5c",
    targetMult: 2,
    effect: { kind: "hard" },
    glyph: "☠",
  },
  {
    id: "zegar",
    name: { pl: "Zegar", en: "The Clock" },
    desc: {
      pl: "Masz 5 minut. Potem zostaje Ci tylko 1 ręka",
      en: "You have 5 minutes. After that only 1 hand remains",
    },
    minAnte: 4,
    color: "#d9a13b",
    targetMult: 2,
    effect: { kind: "clock", seconds: 300 },
    glyph: "⏰",
  },
  // finishers (ante 8)
  {
    id: "komisja",
    name: { pl: "Komisja egzaminacyjna", en: "Exam Committee" },
    desc: { pl: "Ogromny próg punktowy", en: "Very large blind" },
    minAnte: 8,
    isFinisher: true,
    color: "#8a71e1",
    targetMult: 4,
    reward: 8,
    effect: { kind: "committee" },
    glyph: "🏺",
  },
  {
    id: "dyrektor",
    name: { pl: "Dyrektor CKE", en: "CKE Director" },
    desc: {
      pl: "Wszystkie karty nie dają punktów, dopóki nie sprzedasz Jokera",
      en: "All cards debuffed until 1 Joker sold",
    },
    minAnte: 8,
    isFinisher: true,
    color: "#56a786",
    targetMult: 2,
    reward: 8,
    effect: { kind: "director" },
    glyph: "🌿",
  },
  {
    id: "egzaminator",
    name: { pl: "Egzaminator", en: "The Examiner" },
    desc: { pl: "Jedna karta jest zawsze wybrana", en: "Forces 1 card to always be selected" },
    minAnte: 8,
    isFinisher: true,
    color: "#009cfd",
    targetMult: 2,
    reward: 8,
    effect: { kind: "examiner" },
    glyph: "🔔",
  },
  {
    id: "poprawka",
    name: { pl: "Poprawka", en: "The Resit" },
    desc: { pl: "Co rękę jeden losowy Joker jest wyłączony", en: "One random Joker disabled every hand" },
    minAnte: 8,
    isFinisher: true,
    color: "#ac3232",
    targetMult: 2,
    reward: 8,
    effect: { kind: "resit" },
    glyph: "❤",
  },
  {
    id: "kurator",
    name: { pl: "Kurator oświaty", en: "The Superintendent" },
    desc: { pl: "Zakrywa i tasuje wszystkie Jokery", en: "Flips and shuffles all Joker cards" },
    minAnte: 8,
    isFinisher: true,
    color: "#fda200",
    targetMult: 2,
    reward: 8,
    effect: { kind: "curator" },
    glyph: "🌰",
  },
];

export const BOSS_BY_ID = Object.fromEntries(BOSSES.map((b) => [b.id, b])) as Record<string, BossDef>;
