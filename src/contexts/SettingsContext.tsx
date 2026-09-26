import { I18nProvider } from "@lingui/react";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { audio } from "~/lib/audio";
import type { L10n, Locale } from "~/lib/game/types";
import { isFullscreen, toggleFullscreen } from "~/lib/graphics";
import { createI18n, loc } from "~/lib/i18n";
import { loadSettings, saveSettings, type Settings } from "~/lib/settings";

/** Types */

type SettingsContextValue = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  /** pick the current language from a bilingual content string */
  l: (text: L10n | undefined) => string;
  locale: Locale;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Provider */

export default function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [i18n] = useState(() => createI18n(settings.locale));
  const [isFull, setIsFull] = useState(isFullscreen);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  useEffect(() => {
    i18n.activate(settings.locale);
    document.documentElement.lang = settings.locale;
  }, [i18n, settings.locale]);

  useEffect(() => {
    audio.setVolumes(settings.sfxVolume, settings.musicVolume);
  }, [settings.sfxVolume, settings.musicVolume]);

  useEffect(() => {
    document.documentElement.style.setProperty("--crt", String(settings.crt));
  }, [settings.crt]);

  // styles.css keys presets off these attributes, so no component re-renders for them
  useEffect(() => {
    const root = document.documentElement.dataset;
    root.gfx = settings.graphics;
    root.cursor = settings.isPixelCursor ? "pixel" : "system";
    root.motion = settings.isReducedMotion ? "reduced" : "full";
  }, [settings.graphics, settings.isPixelCursor, settings.isReducedMotion]);

  useEffect(() => {
    const handleChange = () => setIsFull(isFullscreen());
    const handleKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.code !== "KeyF" || e.ctrlKey || e.metaKey || e.altKey || el?.closest("input, textarea")) return;
      void toggleFullscreen();
    };
    document.addEventListener("fullscreenchange", handleChange);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  const value: SettingsContextValue = {
    settings,
    update,
    locale: settings.locale,
    l: (text) => loc(text, settings.locale),
    isFullscreen: isFull,
    toggleFullscreen: () => void toggleFullscreen(),
  };

  return (
    <SettingsContext.Provider value={value}>
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings was used outside of SettingsProvider!");
  return ctx;
}
