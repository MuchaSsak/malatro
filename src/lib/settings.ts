import type { Locale } from "~/lib/game/types";
import { detectGraphics, type GraphicsQuality } from "~/lib/graphics";
import { readJson, writeJson } from "~/lib/storage";

export type Settings = {
  locale: Locale;
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  speed: number; // multiplier for scoring animations
  crt: number; // 0..1
  isReducedMotion: boolean;
  graphics: GraphicsQuality;
  isPixelCursor: boolean;
  hasSeenTutorial: boolean;
  /** new runs deal tasks never met before more often */
  isPreferNew: boolean;
  /** testing cheat panel (unlocked by tapping the blind chip 10 times) */
  isCheats: boolean;
};

const KEY = "malatro_settings_v1";

export const DEFAULT_SETTINGS: Settings = {
  // English first; picking Polish is remembered with the other settings [user]
  locale: "en",
  musicVolume: 0.35,
  sfxVolume: 0.7,
  speed: 1,
  crt: 0.6,
  isReducedMotion: false,
  graphics: "high",
  isPixelCursor: true,
  hasSeenTutorial: false,
  isPreferNew: true,
  isCheats: false,
};

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, graphics: detectGraphics(), ...readJson<Partial<Settings>>(KEY, {}) };
}

export function saveSettings(s: Settings) {
  writeJson(KEY, s);
}
