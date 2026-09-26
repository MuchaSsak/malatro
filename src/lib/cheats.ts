/**
 * Secret unlock for the testing cheat panel: ten pokes on a blind chip, each within 1.5 s of the
 * previous one, ask the game screen (via `onCheatPrompt`) whether to turn cheats on.
 */
const TAPS_NEEDED = 10;
const MAX_GAP_MS = 1_500;

let taps = 0;
let lastTap = 0;
const listeners = new Set<() => void>();

export function tapBlindChip(now = Date.now()) {
  taps = now - lastTap <= MAX_GAP_MS ? taps + 1 : 1;
  lastTap = now;
  if (taps >= TAPS_NEEDED) {
    taps = 0;
    for (const fn of listeners) fn();
  }
}

export function onCheatPrompt(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
