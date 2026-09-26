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
