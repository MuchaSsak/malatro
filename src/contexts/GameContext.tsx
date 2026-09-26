import { createContext, type ReactNode, useContext, useEffect, useState, useSyncExternalStore } from "react";

import type { TaskPool } from "~/lib/game/deck";
import { GameEngine } from "~/lib/game/engine";
import type { RunState, TaskRecord } from "~/lib/game/types";
import { fetchTaskPool } from "~/lib/tasks";

/** Types */

type GameContextValue = {
  engine: GameEngine;
  run: RunState | null;
  pool: TaskPool;
  task: (taskId: string) => TaskRecord;
};

const GameContext = createContext<GameContextValue | null>(null);

/** Provider: loads the task dataset once, then owns the engine for the app's lifetime. */
export default function GameProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    fetchTaskPool()
      .then((pool) => isActive && setEngine(new GameEngine(pool)))
      .catch((e: Error) => isActive && setError(e.message));
    return () => {
      isActive = false;
    };
  }, []);

  if (error) return <div className="grid h-full place-items-center p-8 text-center text-2xl text-red">{error}</div>;
  if (!engine) return <>{fallback}</>;
  return <EngineBridge engine={engine}>{children}</EngineBridge>;
}

function EngineBridge({ engine, children }: { engine: GameEngine; children: ReactNode }) {
  const run = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const pool = engine.getPool();
  const value: GameContextValue = {
    engine,
    run,
    pool,
    task: (id) => pool.byId.get(id)!,
  };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame was used outside of GameProvider!");
  return ctx;
}

/** Narrow helper for screens that only render during a run. */
export function useRun(): RunState {
  const { run } = useGame();
  if (!run) throw new Error("useRun requires an active run");
  return run;
}
