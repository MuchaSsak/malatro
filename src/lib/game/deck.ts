import { CATEGORIES } from "~/lib/game/categories";
import { DECK_SIZE } from "~/lib/game/constants";
import type { Rng } from "~/lib/game/rng";
import type { CardInstance, DifficultyMode, RunState, SuitId, TaskRecord } from "~/lib/game/types";

export type TaskPool = {
  all: TaskRecord[];
  byId: Map<string, TaskRecord>;
};

export function makePool(tasks: TaskRecord[]): TaskPool {
  return { all: tasks, byId: new Map(tasks.map((t) => [t.id, t])) };
}

/** Weight multiplier for tasks never met before, in runs started with "prefer new tasks". */
export const NEW_TASK_BOOST = 5;

/** Compact set of task ids: one bit per pool entry, base64 (a few hundred chars for the whole pool). */
export function encodeTaskSet(pool: TaskPool, ids: Set<string>): string {
  const bytes = new Uint8Array(Math.ceil(pool.all.length / 8));
  pool.all.forEach((t, i) => {
    if (ids.has(t.id)) bytes[i >> 3] |= 1 << (i & 7);
  });
  return btoa(String.fromCharCode(...bytes));
}

const decoded = new Map<string, Set<string>>();

export function decodeTaskSet(pool: TaskPool, encoded: string): Set<string> {
  let set = decoded.get(encoded);
  if (!set) {
    set = new Set();
    try {
      const raw = atob(encoded);
      pool.all.forEach((t, i) => {
        if ((raw.charCodeAt(i >> 3) >> (i & 7)) & 1) set!.add(t.id);
      });
    } catch {
      // a corrupt bitset just means no preference
    }
    decoded.set(encoded, set);
  }
  return set;
}

/** Which tasks a difficulty mode may deal, with sampling weights. [user] */
export function modeWeight(mode: DifficultyMode, t: TaskRecord, isHard = false): number {
  if (mode === "trywialne") {
    if (t.level !== "P") return 0;
    return isHard ? (t.diff >= 3 ? 1 : 0) : 1;
  }
  if (mode === "trywialne_plus") {
    if (t.level === "P") return isHard ? (t.diff >= 3 ? 1 : 0) : 3;
    if (t.diff > 3) return 0;
    return isHard ? 3 : 1;
  }
  // ciekawe
  if (t.level === "P") return !isHard && t.diff >= 3 ? 1 : 0;
  return isHard ? (t.diff >= 4 ? 1 : 0) : 1 + Math.max(0, t.diff - 3) * 0.5;
}

/** Normalise weights so the P:R ratio follows the mode, not the raw pool sizes. */
function levelShare(mode: DifficultyMode): { P: number; R: number } {
  if (mode === "trywialne") return { P: 1, R: 0 };
  if (mode === "trywialne_plus") return { P: 0.75, R: 0.25 };
  return { P: 0.25, R: 0.75 };
}

export type DrawFilter = { suit?: SuitId; isHard?: boolean; exclude?: Set<string> };

export function eligible(pool: TaskPool, mode: DifficultyMode, filter: DrawFilter = {}): TaskRecord[] {
  return pool.all.filter(
    (t) =>
      modeWeight(mode, t, filter.isHard) > 0 &&
      (!filter.suit || CATEGORIES[t.cat].suit === filter.suit) &&
      !filter.exclude?.has(t.id),
  );
}

/** Weighted sample without replacement, preferring tasks not yet dealt this run. */
export function sampleTasks(
  pool: TaskPool,
  run: RunState,
  rng: Rng,
  count: number,
  filter: DrawFilter = {},
): TaskRecord[] {
  let candidates = eligible(pool, run.difficulty, filter);
  if (candidates.length === 0 && filter.isHard)
    candidates = eligible(pool, run.difficulty, { ...filter, isHard: false });
  if (candidates.length === 0 && filter.suit) candidates = eligible(pool, run.difficulty, { exclude: filter.exclude });
  const share = levelShare(run.difficulty);
  const nP = candidates.filter((t) => t.level === "P").length || 1;
  const nR = candidates.filter((t) => t.level === "R").length || 1;
  const fresh = candidates.filter((t) => run.seen[t.id] === undefined);
  // fall back to the least-recently-seen tasks when the fresh pool runs dry
  const stale = candidates
    .filter((t) => run.seen[t.id] !== undefined)
    .sort((a, b) => (run.seen[a.id] ?? 0) - (run.seen[b.id] ?? 0));
  const out: TaskRecord[] = [];
  const taken = new Set<string>();
  const met = run.avoid ? decodeTaskSet(pool, run.avoid) : null;
  const weightOf = (t: TaskRecord) =>
    modeWeight(run.difficulty, t, filter.isHard) *
    (t.level === "P" ? share.P / nP : share.R / nR) *
    (met && !met.has(t.id) ? NEW_TASK_BOOST : 1);
  let source = fresh;
  while (out.length < count) {
    const avail = source.filter((t) => !taken.has(t.id));
    if (avail.length === 0) {
      if (source === fresh && stale.length) {
        source = stale.slice(0, Math.max(count * 2, 20));
        continue;
      }
      break;
    }
    const t = rng.weighted(avail, weightOf);
    taken.add(t.id);
    out.push(t);
  }
  return out;
}

export function makeCard(rng: Rng, taskId: string): CardInstance {
  return { uid: rng.uid("c"), taskId };
}

export function buildDeck(pool: TaskPool, run: RunState, rng: Rng, opts: { isHard?: boolean } = {}): CardInstance[] {
  const reserved = run.reserved.map((c) => ({ ...c }));
  const exclude = new Set(reserved.map((c) => c.taskId));
  const tasks = sampleTasks(pool, run, rng, Math.max(0, DECK_SIZE - reserved.length), {
    isHard: opts.isHard,
    exclude,
  });
  const drawn = rng.shuffle(tasks.map((t) => makeCard(rng, t.id)));
  // reserved (bought) cards are dealt first: the deck is drawn from the end
  return [...drawn, ...reserved.reverse()];
}
