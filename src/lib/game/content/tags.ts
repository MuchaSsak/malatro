import type { L10n } from "~/lib/game/types";

export type TagDef = {
  id: string;
  name: L10n;
  desc: L10n;
  art: string;
  minAnte: number;
  effect:
    | { kind: "pack"; pack: "zadania" | "sciagi" | "twierdzenia" | "jokery" }
    | { kind: "money-double"; max: number }
    | { kind: "money"; amount: number }
    | { kind: "investment"; amount: number }
    | { kind: "rare-joker" }
    | { kind: "coupon" }
    | { kind: "hand-size"; delta: number }
    | { kind: "voucher" }
    | { kind: "double" };
};

export const TAGS: TagDef[] = [
  {
    id: "t_jokery",
    name: { pl: "Znacznik błazna", en: "Buffoon Tag" },
    desc: { pl: "Darmowa [a:Mega Paczka jokerów]", en: "Gives a free [a:Mega Buffoon Pack]" },
    art: "🃏",
    minAnte: 2,
    effect: { kind: "pack", pack: "jokery" },
  },
  {
    id: "t_sciagi",
    name: { pl: "Znacznik ściąg", en: "Charm Tag" },
    desc: { pl: "Darmowa [a:Mega Paczka ściąg]", en: "Gives a free [a:Mega Cheat Sheet Pack]" },
    art: "📜",
    minAnte: 1,
    effect: { kind: "pack", pack: "sciagi" },
  },
  {
    id: "t_twierdzenia",
    name: { pl: "Znacznik meteoru", en: "Meteor Tag" },
    desc: { pl: "Darmowa [a:Mega Paczka twierdzeń]", en: "Gives a free [a:Mega Theorem Pack]" },
    art: "☄",
    minAnte: 2,
    effect: { kind: "pack", pack: "twierdzenia" },
  },
  {
    id: "t_zadania",
    name: { pl: "Znacznik zadań", en: "Standard Tag" },
    desc: { pl: "Darmowa [a:Mega Paczka zadań]", en: "Gives a free [a:Mega Task Pack]" },
    art: "📄",
    minAnte: 1,
    effect: { kind: "pack", pack: "zadania" },
  },
  {
    id: "t_ekonomia",
    name: { pl: "Znacznik ekonomii", en: "Economy Tag" },
    desc: { pl: "Podwaja pieniądze (maks. [$:+$40])", en: "Doubles your money (max of [$:$40])" },
    art: "💹",
    minAnte: 1,
    effect: { kind: "money-double", max: 40 },
  },
  {
    id: "t_inwestycja",
    name: { pl: "Znacznik inwestycji", en: "Investment Tag" },
    desc: { pl: "Po pokonaniu Bossa dostajesz [$:$25]", en: "After defeating the Boss Blind, gain [$:$25]" },
    art: "📈",
    minAnte: 1,
    effect: { kind: "investment", amount: 25 },
  },
  {
    id: "t_rzadki",
    name: { pl: "Znacznik rzadkości", en: "Rare Tag" },
    desc: { pl: "W sklepie pojawi się darmowy [a:Rzadki] Joker", en: "Shop has a free [a:Rare Joker]" },
    art: "💎",
    minAnte: 1,
    effect: { kind: "rare-joker" },
  },
  {
    id: "t_kupon",
    name: { pl: "Znacznik kuponu", en: "Coupon Tag" },
    desc: {
      pl: "Karty i paczki w następnym sklepie są [a:darmowe]",
      en: "Initial cards and packs in next shop are [a:free]",
    },
    art: "🎟",
    minAnte: 1,
    effect: { kind: "coupon" },
  },
  {
    id: "t_zonglerka",
    name: { pl: "Znacznik żonglera", en: "Juggle Tag" },
    desc: { pl: "[a:+3] karty na ręce w następnej rundzie", en: "[a:+3] hand size next round" },
    art: "🎪",
    minAnte: 1,
    effect: { kind: "hand-size", delta: 3 },
  },
  {
    id: "t_bon",
    name: { pl: "Znacznik bonu", en: "Voucher Tag" },
    desc: { pl: "Dodaje [a:bon] do następnego sklepu", en: "Adds one [a:Voucher] to the next shop" },
    art: "🎫",
    minAnte: 1,
    effect: { kind: "voucher" },
  },
  {
    id: "t_podwojny",
    name: { pl: "Znacznik podwójny", en: "Double Tag" },
    desc: { pl: "Kopiuje następny zdobyty znacznik", en: "Gives a copy of the next Tag selected" },
    art: "➕",
    minAnte: 1,
    effect: { kind: "double" },
  },
  {
    id: "t_kasa",
    name: { pl: "Znacznik skarbu", en: "Treasure Tag" },
    desc: { pl: "Natychmiast dostajesz [$:$10]", en: "Gain [$:$10] immediately" },
    art: "🪙",
    minAnte: 1,
    effect: { kind: "money", amount: 10 },
  },
];

export const TAG_BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t])) as Record<string, TagDef>;
