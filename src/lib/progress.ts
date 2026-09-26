/**
 * Long-term study progress, kept across runs: every answered card (right / wrong counters, the
 * last result, a manual "don't know" mark) and a history of finished runs with their seeds.
 * Feeds the Collection, the stats charts and the card badges. Local to this browser, like the run
 * save; a card only counts when the player really answered it (not face down, value not revealed).
 */
import { useSyncExternalStore } from "react";

import type { DifficultyMode, Locale, RunState } from "~/lib/game/types";
import { readJson, writeJson } from "~/lib/storage";

/** Types */

export type TaskProgress = {
  ok: number;
  miss: number;
  last: "ok" | "miss" | null;
  /** manual "I don't know this one" mark (sticky until the player clears it) */
  isMarked?: boolean;
  firstAt: number;
  lastAt: number;
};

export type RunRecord = {
  id: string;
  seed: string;
  difficulty: DifficultyMode;
  locale?: Locale;
  outcome: "won" | "lost" | "abandoned";
  ante: number;
  isEndless?: boolean;
  totalScore: number;
  bestHand: number;
  handsPlayed: number;
  answered: number;
  correct: number;
  playTimeMs: number;
  startedAt: number;
  endedAt: number;
  /** the run's "prefer new tasks" snapshot, so a replay deals the same cards */
  avoid?: string;
  isCheated?: boolean;
};

type ProgressStore = { schemaVersion: 1; tasks: Record<string, TaskProgress>; runs: RunRecord[] };

const KEY = "malatro_progress_v1";
const MAX_RUNS = 300;

/** Store */

let cache: ProgressStore | null = null;
const listeners = new Set<() => void>();

function store(): ProgressStore {
  if (!cache) {
    const raw = readJson<ProgressStore | null>(KEY, null);
    cache = raw?.schemaVersion === 1 ? raw : { schemaVersion: 1, tasks: {}, runs: [] };
  }
  return cache;
}

function commit(next: ProgressStore) {
  cache = next;
  writeJson(KEY, next);
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Status the Collection sorts cards into: a miss or a mark means "don't know". */
export function taskStatus(p: TaskProgress | undefined): "ok" | "dontknow" | null {
  if (!p) return null;
  if (p.isMarked || p.last === "miss") return "dontknow";
  return p.last === "ok" ? "ok" : null;
}

/** Actions */

export function recordAttempts(results: { taskId: string; isCorrect: boolean }[], now = Date.now()) {
  if (!results.length) return;
  const s = store();
  const tasks = { ...s.tasks };
  for (const { taskId, isCorrect } of results) {
    const prev = tasks[taskId] ?? { ok: 0, miss: 0, last: null, firstAt: now, lastAt: now };
    tasks[taskId] = {
      ...prev,
      ok: prev.ok + (isCorrect ? 1 : 0),
      miss: prev.miss + (isCorrect ? 0 : 1),
      last: isCorrect ? "ok" : "miss",
      lastAt: now,
    };
  }
  commit({ ...s, tasks });
}

export function setMarked(taskId: string, isMarked: boolean, now = Date.now()) {
  const s = store();
  const prev = s.tasks[taskId] ?? { ok: 0, miss: 0, last: null, firstAt: now, lastAt: now };
  const next: TaskProgress = { ...prev, isMarked };
  const tasks = { ...s.tasks };
  // a mark on a card never answered is all the entry holds: clearing it removes the entry
  if (!isMarked && prev.ok + prev.miss === 0) delete tasks[taskId];
  else tasks[taskId] = next;
  commit({ ...s, tasks });
}

export function recordRun(run: RunState, outcome: RunRecord["outcome"], locale?: Locale, now = Date.now()) {
  const s = store();
  const record: RunRecord = {
    id: run.id,
    seed: run.seed,
    difficulty: run.difficulty,
    locale,
    outcome,
    ante: run.ante,
    isEndless: run.endless,
    totalScore: run.stats.totalScore,
    bestHand: run.stats.bestHand,
    handsPlayed: run.stats.handsPlayed,
    answered: run.stats.answeredNotes ?? run.stats.cardsPlayed,
    correct: run.stats.correctNotes,
    playTimeMs: run.stats.playTimeMs ?? 0,
    startedAt: run.createdAt,
    endedAt: now,
    avoid: run.avoid,
    isCheated: run.isCheated,
  };
  // an endless run ends twice (won, then lost later): keep the latest result
  const runs = [record, ...s.runs.filter((r) => r.id !== run.id)].slice(0, MAX_RUNS);
  commit({ ...s, runs });
}

/** Ids of every task the player has met (answered or marked) in any run. */
export function encounteredIds(): Set<string> {
  return new Set(Object.keys(store().tasks));
}

export function clearProgress() {
  commit({ schemaVersion: 1, tasks: {}, runs: [] });
}

/** Hooks */

export function useProgress(): ProgressStore {
  return useSyncExternalStore(subscribe, store);
}

export function useTaskProgress(taskId: string): TaskProgress | undefined {
  return useSyncExternalStore(subscribe, () => store().tasks[taskId]);
}
