import { lazy } from "react";

/**
 * Code-split entry points. The menu only needs the engine and the background; the table UI
 * (cards, shop, KaTeX) and the task viewer (drawing) load on idle right after the first paint.
 */
export const loadGameScreen = () => import("~/screens/GameScreen");
export const loadTaskViewer = () => import("~/components/viewer/TaskViewer");

export const GameScreen = lazy(loadGameScreen);
export const TaskViewer = lazy(loadTaskViewer);

export function preloadOnIdle() {
  const run = () => {
    void loadGameScreen();
    void loadTaskViewer();
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 3_000 });
  else setTimeout(run, 1_500);
}
