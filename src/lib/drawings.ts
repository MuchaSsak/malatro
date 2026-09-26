/**
 * Scratch drawings per task sheet: vector strokes in viewer-board units (the board is a fixed
 * 1600-unit-wide sheet scaled to the window, see TaskViewer), so they stay aligned at any zoom and
 * may cover the dark margin around the task too. The Polish crop and the English statement are
 * laid out differently, so each gets its own key ("<taskId>" / "<taskId>:en"). Kept in
 * localStorage with an LRU cap; drawings are never graded.
 */
import { readJson, writeJson } from "~/lib/storage";

export type Stroke = { color: string; size: number; points: [number, number, number][]; isEraser?: boolean };
type Store = { order: string[]; byTask: Record<string, Stroke[]> };

const KEY = "malatro_drawings_v2"; // v1 stored image pixels
const MAX_TASKS = 150;

let cache: Store | null = null;
function store(): Store {
  cache ??= readJson<Store>(KEY, { order: [], byTask: {} });
  return cache;
}

export function getStrokes(taskId: string): Stroke[] {
  return store().byTask[taskId] ?? [];
}

export function setStrokes(taskId: string, strokes: Stroke[]) {
  const s = store();
  s.order = [taskId, ...s.order.filter((t) => t !== taskId)];
  if (strokes.length) s.byTask[taskId] = strokes;
  else delete s.byTask[taskId];
  while (s.order.length > MAX_TASKS) {
    const old = s.order.pop()!;
    delete s.byTask[old];
  }
  writeJson(KEY, s);
}

export function drawingKey(taskId: string, sheet: "pl" | "en"): string {
  return sheet === "en" ? `${taskId}:en` : taskId;
}

export function hasDrawing(taskId: string): boolean {
  const byTask = store().byTask;
  return (byTask[taskId]?.length ?? 0) > 0 || (byTask[`${taskId}:en`]?.length ?? 0) > 0;
}
