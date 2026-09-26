/**
 * Framework-free game engine. Each action clones the run, applies a rule function from `run.ts`,
 * persists the result and notifies subscribers; React reads it via `useSyncExternalStore`.
 * Immutable snapshots matter: the React Compiler memoises on identity, so in-place mutation
 * would silently skip renders.
 */
import type { TaskPool } from "~/lib/game/deck";
import { Rng } from "~/lib/game/rng";
import * as R from "~/lib/game/run";
import type { DifficultyMode, RunState } from "~/lib/game/types";
import { recordAttempts, recordRun } from "~/lib/progress";
import { loadSettings } from "~/lib/settings";

export const STORAGE_KEY = "malatro_run_v1";

/** longest gap between two actions still counted as play time */
const IDLE_CAP_MS = 60_000;

export type EngineListener = () => void;
export type FxListener = (fx: R.Fx) => void;

export class GameEngine {
  private state: RunState | null;
  private listeners = new Set<EngineListener>();
  private fxListeners = new Set<FxListener>();

  constructor(private readonly pool: TaskPool) {
    this.state = loadRun(pool);
  }

  /** Subscriptions */

  subscribe = (fn: EngineListener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  onFx(fn: FxListener) {
    this.fxListeners.add(fn);
    return () => {
      this.fxListeners.delete(fn);
    };
  }

  getSnapshot = (): RunState | null => this.state;

  getPool(): TaskPool {
    return this.pool;
  }

  private emit(fx: R.Fx) {
    if (fx.kind === "attempts") recordAttempts(fx.results);
    for (const fn of this.fxListeners) fn(fx);
  }

  private commit(next: RunState | null) {
    const prev = this.state;
    // run history: a run is recorded when it ends (an endless run updates its record on the final loss)
    if (
      next &&
      (next.phase === "gameover" || next.phase === "won") &&
      prev?.id === next.id &&
      prev.phase !== next.phase
    )
      recordRun(next, next.phase === "won" ? "won" : "lost", loadSettings().locale);
    this.state = next;
    saveRun(next);
    for (const fn of this.listeners) fn();
  }

  /**
   * Apply a rule function to a cloned draft. Rule violations surface as a toast and
   * leave state untouched.
   */
  private act(fn: (run: RunState, ctx: R.Ctx) => void): boolean {
    if (!this.state) return false;
    const draft = structuredClone(this.state);
    const rng = new Rng(draft.rng);
    const queued: R.Fx[] = [];
    try {
      fn(draft, { pool: this.pool, rng, now: Date.now(), fx: (f) => queued.push(f) });
    } catch (e) {
      if (e instanceof R.RuleError) {
        this.emit({ kind: "toast", text: e.text, tone: "bad" });
        this.emit({ kind: "sound", name: "error" });
        return false;
      }
      throw e;
    }
    draft.rng = rng.state;
    const now = Date.now();
    if (this.state.phase !== "gameover" && this.state.phase !== "won") {
      const gap = Math.max(0, Math.min(now - this.state.updatedAt, IDLE_CAP_MS));
      draft.stats.playTimeMs = (draft.stats.playTimeMs ?? 0) + gap;
    }
    draft.updatedAt = now;
    this.commit(draft);
    for (const f of queued) this.emit(f);
    return true;
  }

  /** Actions */

  /** `avoid`: tasks met before (encodeTaskSet), dealt less often; a replay passes the original's */
  newRun(difficulty: DifficultyMode, seed: string, avoid?: string) {
    // starting over mid-run leaves an unfinished run behind: keep it in the history as abandoned
    const run = this.state;
    if (run && run.stats.handsPlayed > 0 && run.phase !== "gameover" && run.phase !== "won")
      recordRun(run, "abandoned", loadSettings().locale);
    this.commit(R.createRun(difficulty, seed, Date.now(), avoid));
  }

  abandonRun() {
    const run = this.state;
    if (run && run.stats.handsPlayed > 0 && run.phase !== "gameover" && run.phase !== "won")
      recordRun(run, "abandoned", loadSettings().locale);
    this.commit(null);
  }

  markSubmitted() {
    this.act((r) => {
      r.isSubmitted = true;
    });
  }

  selectBlind = () => this.act(R.selectBlind);
  skipBlind = () => this.act(R.skipBlind);
  toggleSelect = (uid: string) => this.act((r) => R.toggleSelect(r, uid));
  clearSelection = () => this.act(R.clearSelection);
  reorderHand = (uids: string[]) => this.act((r) => R.reorderHand(r, uids));
  sortHand = (by: "suit" | "note") => this.act((r) => R.sortHand(r, this.pool, by));
  playHand = () => this.act(R.playHand);
  resolvePlay = () => this.act(R.resolvePlay);
  discard = () => this.act(R.discardSelected);
  timeUp = () => this.act(R.timeUp);
  cashOut = () => this.act(R.cashOut);
  reroll = () => this.act(R.reroll);
  buyItem = (uid: string, useNow = false) => this.act((r, c) => R.buyItem(r, c, uid, useNow));
  buyVoucher = (id: string) => this.act((r, c) => R.buyVoucher(r, c, id));
  buyPack = (uid: string) => this.act((r, c) => R.buyPack(r, c, uid));
  pickFromPack = (uid: string) => this.act((r, c) => R.pickFromPack(r, c, uid));
  skipPack = () => this.act(R.skipPack);
  leaveShop = () => this.act(R.leaveShop);
  sellJoker = (uid: string) => this.act((r, c) => R.sellJoker(r, c, uid));
  sellConsumable = (uid: string) => this.act((r, c) => R.sellConsumable(r, c, uid));
  reorderJokers = (uids: string[]) => this.act((r) => R.reorderJokers(r, uids));
  activateConsumable = (uid: string) => this.act((r, c) => R.activateConsumable(r, c, uid));
  setNote = (taskId: string, note: string) => this.act((r) => R.setNote(r, taskId, note));
  continueEndless = () => this.act(R.continueEndless);
  cheat = (kind: R.CheatKind) => this.act((r, c) => R.cheat(r, c, kind));
}

/** Persistence (versioned envelope; storage may be unavailable) */

type Envelope = { schemaVersion: 1; run: RunState };

function loadRun(pool: TaskPool): RunState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope;
    if (env.schemaVersion !== 1 || !env.run) return null;
    // drop saves referencing tasks that no longer exist in the dataset
    const run = env.run;
    const ids = [
      ...(run.round?.hand ?? []),
      ...(run.round?.deck ?? []),
      ...run.reserved,
      ...(run.round?.pending?.played ?? []),
    ].map((c) => c.taskId);
    if (ids.some((id) => !pool.byId.has(id))) return null;
    // an interrupted scoring animation stays `pending`; the round screen replays and resolves it
    return run;
  } catch {
    return null;
  }
}

function saveRun(run: RunState | null) {
  try {
    if (!run) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, run } satisfies Envelope));
  } catch {
    // storage full or blocked: the run continues in memory
  }
}
