import type { L10n } from "~/lib/game/types";

export type VoucherDef = {
  id: string;
  name: L10n;
  desc: L10n;
  art: string;
  /** tier-2 vouchers require their base voucher */
  requires?: string;
  effect:
    | { kind: "shop-slots"; delta: number }
    | { kind: "discount"; pct: number }
    | { kind: "consumable-slots"; delta: number }
    | { kind: "hands"; delta: number }
    | { kind: "discards"; delta: number }
    | { kind: "hand-size"; delta: number }
    | { kind: "interest-cap"; cap: number }
    | { kind: "reroll-discount"; delta: number }
    | { kind: "joker-slots"; delta: number }
    | { kind: "reveal-sign-on-draw"; count: number }
    | { kind: "note-bonus"; chips: number; mult: number }
    | { kind: "planet-mult" };
};

export const VOUCHERS: VoucherDef[] = [
  {
    id: "stolik",
    name: { pl: "Większy stolik", en: "Overstock" },
    desc: { pl: "[a:+1] miejsce na karty w sklepie", en: "[a:+1] card slot available in shop" },
    art: "🛒",
    effect: { kind: "shop-slots", delta: 1 },
  },
  {
    id: "hurtownia",
    name: { pl: "Hurtownia", en: "Overstock Plus" },
    desc: { pl: "[a:+1] miejsce na karty w sklepie", en: "[a:+1] card slot available in shop" },
    art: "🏬",
    requires: "stolik",
    effect: { kind: "shop-slots", delta: 1 },
  },
  {
    id: "promocja",
    name: { pl: "Promocja", en: "Clearance Sale" },
    desc: { pl: "Wszystko w sklepie [a:25%] taniej", en: "All cards and packs in shop are [a:25%] off" },
    art: "🏷",
    effect: { kind: "discount", pct: 25 },
  },
  {
    id: "likwidacja",
    name: { pl: "Likwidacja sklepu", en: "Liquidation" },
    desc: { pl: "Wszystko w sklepie [a:50%] taniej", en: "All cards and packs in shop are [a:50%] off" },
    art: "💸",
    requires: "promocja",
    effect: { kind: "discount", pct: 50 },
  },
  {
    id: "piornik",
    name: { pl: "Piórnik", en: "Pencil Case" },
    desc: { pl: "[a:+1] miejsce na Ściągi i Twierdzenia", en: "[a:+1] consumable slot" },
    art: "✏",
    effect: { kind: "consumable-slots", delta: 1 },
  },
  {
    id: "reka",
    name: { pl: "Dodatkowa ręka", en: "Grabber" },
    desc: { pl: "Na stałe [a:+1] ręka w każdej rundzie", en: "Permanently gain [a:+1] hand per round" },
    art: "✋",
    effect: { kind: "hands", delta: 1 },
  },
  {
    id: "reka2",
    name: { pl: "Druga ręka", en: "Nacho Tong" },
    desc: { pl: "Na stałe [a:+1] ręka w każdej rundzie", en: "Permanently gain [a:+1] hand per round" },
    art: "🤲",
    requires: "reka",
    effect: { kind: "hands", delta: 1 },
  },
  {
    id: "kosz",
    name: { pl: "Kosz na śmieci", en: "Wastebasket" },
    desc: { pl: "Na stałe [a:+1] zrzutka w każdej rundzie", en: "Permanently gain [a:+1] discard each round" },
    art: "🗑",
    effect: { kind: "discards", delta: 1 },
  },
  {
    id: "niszczarka",
    name: { pl: "Niszczarka", en: "Shredder" },
    desc: { pl: "Na stałe [a:+1] zrzutka w każdej rundzie", en: "Permanently gain [a:+1] discard each round" },
    art: "📄",
    requires: "kosz",
    effect: { kind: "discards", delta: 1 },
  },
  {
    id: "biurko",
    name: { pl: "Duże biurko", en: "Big Desk" },
    desc: { pl: "[a:+1] karta na ręce", en: "[a:+1] hand size" },
    art: "🪑",
    effect: { kind: "hand-size", delta: 1 },
  },
  {
    id: "lokata",
    name: { pl: "Lokata", en: "Seed Money" },
    desc: {
      pl: "Limit odsetek rośnie do [$:$10] na rundę",
      en: "Raise the cap on interest earned in each round to [$:$10]",
    },
    art: "🌱",
    effect: { kind: "interest-cap", cap: 10 },
  },
  {
    id: "obligacje",
    name: { pl: "Obligacje", en: "Money Tree" },
    desc: {
      pl: "Limit odsetek rośnie do [$:$20] na rundę",
      en: "Raise the cap on interest earned in each round to [$:$20]",
    },
    art: "🌳",
    requires: "lokata",
    effect: { kind: "interest-cap", cap: 20 },
  },
  {
    id: "losowanie",
    name: { pl: "Tańsze losowanie", en: "Reroll Surplus" },
    desc: { pl: "Losowanie w sklepie kosztuje [$:$2] mniej", en: "Rerolls cost [$:$2] less" },
    art: "🎰",
    effect: { kind: "reroll-discount", delta: 2 },
  },
  {
    id: "losowanie2",
    name: { pl: "Hurtowe losowanie", en: "Reroll Glut" },
    desc: { pl: "Losowanie w sklepie kosztuje [$:$2] mniej", en: "Rerolls cost [$:$2] less" },
    art: "🎰",
    requires: "losowanie",
    effect: { kind: "reroll-discount", delta: 2 },
  },
  {
    id: "tablice",
    name: { pl: "Tablice wzorów", en: "Formula Tables" },
    desc: {
      pl: "Po każdym dobraniu ujawnia [a:znak] 2 losowych kart na ręce",
      en: "After every draw, reveals the [a:sign] of 2 random cards in hand",
    },
    art: "📘",
    effect: { kind: "reveal-sign-on-draw", count: 2 },
  },
  {
    id: "szafka",
    name: { pl: "Szafka", en: "Locker" },
    desc: { pl: "[a:+1] miejsce na Jokera", en: "[a:+1] Joker slot" },
    art: "🗄",
    requires: "tablice",
    effect: { kind: "joker-slots", delta: 1 },
  },
  {
    id: "korepetycje",
    name: { pl: "Korepetycje", en: "Tutoring" },
    desc: {
      pl: "Karty z [a:poprawną odpowiedzią] dają dodatkowo [c:+10] Żetonów",
      en: "Cards with a [a:correct answer] give an extra [c:+10] Chips",
    },
    art: "📚",
    effect: { kind: "note-bonus", chips: 10, mult: 0 },
  },
  {
    id: "olimpiada",
    name: { pl: "Olimpiada", en: "Olympiad" },
    desc: {
      pl: "Karty z [a:poprawną odpowiedzią] dają też [m:+3] Mnożnika",
      en: "Cards with a [a:correct answer] also give [m:+3] Mult",
    },
    art: "🥇",
    requires: "korepetycje",
    effect: { kind: "note-bonus", chips: 0, mult: 3 },
  },
  {
    id: "teleskop",
    name: { pl: "Obserwatorium", en: "Observatory" },
    desc: {
      pl: "Twierdzenia trzymane w slotach dają [x:×1.5] Mnożnika dla swojego układu",
      en: "Theorem cards in your consumable area give [x:×1.5] Mult for their hand",
    },
    art: "🔭",
    effect: { kind: "planet-mult" },
  },
];

export const VOUCHER_BY_ID = Object.fromEntries(VOUCHERS.map((v) => [v.id, v])) as Record<string, VoucherDef>;
