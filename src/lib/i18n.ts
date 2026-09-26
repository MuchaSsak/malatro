import { type I18n, setupI18n } from "@lingui/core";

import type { L10n, Locale } from "~/lib/game/types";
import { messages as enMessages } from "~/locales/en/messages";
import { messages as plMessages } from "~/locales/pl/messages";

export const LOCALES: Locale[] = ["pl", "en"];

export function createI18n(locale: Locale): I18n {
  return setupI18n({ locale, messages: { en: enMessages, pl: plMessages } });
}

/** Game-content catalogs (jokers, bosses, task summaries) carry both languages inline. */
export function loc(text: L10n | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale] || text.pl;
}
