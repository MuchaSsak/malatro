import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  const rounded = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
  return rounded.toLocaleString("en-US").replace(/,/g, " ");
}

/** Global "grabbing" cursor while something is dragged (styles.css: [data-dragging]). */
export function setDragCursor(isDragging: boolean) {
  if (isDragging) document.documentElement.dataset.dragging = "";
  else delete document.documentElement.dataset.dragging;
}

/** ms -> "1:05:09" / "5:09" */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
