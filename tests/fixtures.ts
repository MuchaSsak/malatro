import { CATEGORY_IDS } from "~/lib/game/categories";
import { makePool } from "~/lib/game/deck";
import type { CategoryId, RoundState, TaskRecord } from "~/lib/game/types";

/** Deterministic fake task pool: every category, both levels, mixed values. */
export function fakePool(n = 600) {
  const tasks: TaskRecord[] = [];
  for (let i = 0; i < n; i++) {
    const cat = CATEGORY_IDS[i % CATEGORY_IDS.length] as CategoryId;
    const value = ((i * 37) % 41) - 8 + (i % 7 === 0 ? 0.5 : 0);
    tasks.push({ ...task(cat, value, `fake-${i}`), level: i % 4 === 0 ? "R" : "P", diff: 1 + (i % 5) });
  }
  return makePool(tasks);
}

export function task(cat: CategoryId, value: number, id = `${cat}-${value}`): TaskRecord {
  return {
    id,
    exam: "t",
    task: "1",
    level: "P",
    cat,
    topic: { pl: "t", en: "t" },
    diff: 2,
    pts: 1,
    value,
    sum: false,
    tex: String(value),
    s: { pl: "s", en: "s" },
    img: "x.webp",
    w: 1,
    h: 1,
    year: 2024,
    session: "maj",
    formula: "2023",
  };
}

export function emptyRound(hand: RoundState["hand"]): RoundState {
  return {
    blind: "small",
    bossId: null,
    target: 100,
    score: 0,
    handsLeft: 4,
    discardsLeft: 3,
    handSize: 8,
    deck: [],
    hand,
    selected: [],
    discardPile: [],
    handTypesPlayed: [],
    pending: null,
    handsPlayed: 0,
    flags: {},
    forcedUid: null,
    startedAt: 0,
    deadline: null,
  };
}
