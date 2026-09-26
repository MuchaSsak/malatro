/**
 * Balance probe on the real task pool: how many points does a hand score for different kinds
 * of players (no jokers, level-1 hands)? Used to pick VALUE_CAP and the ante-1 blind target.
 *   bun scripts/balance.ts
 */
import { readFileSync } from "node:fs";

import { CATEGORIES } from "~/lib/game/categories";
import { makePool, sampleTasks } from "~/lib/game/deck";
import { detectHand, handBase } from "~/lib/game/hands";
import { Rng } from "~/lib/game/rng";
import { createRun } from "~/lib/game/run";
import type { DifficultyMode, TaskRecord } from "~/lib/game/types";

const tasks = JSON.parse(readFileSync("public/data/tasks.json", "utf8")) as TaskRecord[];
const pool = makePool(tasks);

function score(cards: TaskRecord[], cap: number, isKnown: (t: TaskRecord) => boolean = () => true, guess = 4) {
  const type = detectHand(cards.map((c) => c.cat));
  const { chips, mult } = handBase(type, 1);
  const sum = cards.reduce((s, c) => s + (isKnown(c) ? Math.max(-cap, Math.min(cap, c.value)) : guess), 0);
  return (chips + sum) * mult;
}

function subsets<T>(arr: T[], maxK: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, cur: T[]) => {
    if (cur.length) out.push([...cur]);
    if (cur.length === maxK) return;
    for (let i = start; i < arr.length; i++) rec(i + 1, [...cur, arr[i]]);
  };
  rec(0, []);
  return out;
}

/** Simulate one blind: 4 hands, 3 discards; returns total score. */
function simulate(mode: DifficultyMode, cap: number, policy: "random" | "combo" | "half" | "oracle", seed: number) {
  const rng = new Rng(seed);
  const run = createRun(mode, `S${seed}`, 0);
  const deck = sampleTasks(pool, run, rng, 40);
  const hand: TaskRecord[] = deck.splice(0, 8);
  const knownSet = new Set<string>();
  if (policy === "half") for (const t of [...hand, ...deck]) if (rng.chance(0.5)) knownSet.add(t.id);
  const isKnown = (t: TaskRecord) => policy === "oracle" || (policy === "half" && knownSet.has(t.id));
  let total = 0;
  let discards = 3;
  for (let h = 0; h < 4; h++) {
    let pick: TaskRecord[];
    if (policy === "random") pick = rng.shuffle([...hand]).slice(0, 5);
    else if (policy === "combo") {
      // category-savvy but never solves: best mult, values guessed as a constant
      pick = subsets(hand, 5).sort((a, b) => score(b, cap, () => false) - score(a, cap, () => false))[0];
    } else {
      pick = subsets(hand, 5).sort((a, b) => score(b, cap, isKnown) - score(a, cap, isKnown))[0];
      // discard known negatives / smallest while we can
      if (discards > 0 && h < 3) {
        const bad = hand.filter((c) => isKnown(c) && c.value < 2).slice(0, 5);
        if (bad.length >= 2) {
          for (const b of bad) hand.splice(hand.indexOf(b), 1);
          hand.push(...deck.splice(0, bad.length));
          discards--;
          pick = subsets(hand, 5).sort((a, b) => score(b, cap, isKnown) - score(a, cap, isKnown))[0];
        }
      }
    }
    total += score(pick, cap);
    for (const p of pick) hand.splice(hand.indexOf(p), 1);
    hand.push(...deck.splice(0, 8 - hand.length));
  }
  return total;
}

const N = 400;
for (const mode of ["trywialne", "trywialne_plus", "ciekawe"] as DifficultyMode[]) {
  console.log(`\n== ${mode}: pool ${tasks.filter((t) => (mode === "trywialne" ? t.level === "P" : true)).length}`);
  for (const cap of [20, 25, 30, 50]) {
    const row: string[] = [];
    for (const policy of ["random", "combo", "half", "oracle"] as const) {
      const results = Array.from({ length: N }, (_, i) => simulate(mode, cap, policy, i + 1)).sort((a, b) => a - b);
      const p = (q: number) => Math.round(results[Math.floor(q * (N - 1))]);
      row.push(`${policy}: p10=${p(0.1)} p50=${p(0.5)} p90=${p(0.9)}`);
    }
    console.log(`cap ${cap} | ${row.join(" | ")}`);
  }
}
const suitCount = Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, tasks.filter((t) => t.cat === c).length]));
console.log("\ncategories", suitCount);
