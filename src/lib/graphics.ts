/**
 * Graphics presets. The expensive parts of a frame are the full-screen swirl shader, backdrop
 * blur over it, and non-composited CSS animations (edition sheen, pack foil); presets trade those
 * off. Everything else (card tilt, jiggles) is transform-only and stays on in every preset.
 */
export type GraphicsQuality = "high" | "medium" | "low";

export type GraphicsProfile = {
  /** swirl canvas renders at 1/n of the window size; the shader pixelates anyway, so 2 looks native */
  bgDownscale: number;
  /** frame cap for the swirl (also caps 120/144 Hz screens) */
  bgFps: number;
  /** frame cap while the task viewer covers the screen */
  bgFpsCovered: number;
};

export const GRAPHICS: Record<GraphicsQuality, GraphicsProfile> = {
  high: { bgDownscale: 2, bgFps: 60, bgFpsCovered: 30 },
  medium: { bgDownscale: 3, bgFps: 30, bgFpsCovered: 15 },
  low: { bgDownscale: 5, bgFps: 20, bgFpsCovered: 0 },
};

export const GRAPHICS_ORDER: GraphicsQuality[] = ["low", "medium", "high"];

/** First-run default: weak machines (few cores / little memory) start on medium. */
export function detectGraphics(): GraphicsQuality {
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || memory <= 4 ? "medium" : "high";
}

/** Fullscreen helpers (the API needs a user gesture, so the state is never persisted). */
export function isFullscreen() {
  return !!document.fullscreenElement;
}

export async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch {
    // denied (iframe, unsupported): nothing to do
  }
}
