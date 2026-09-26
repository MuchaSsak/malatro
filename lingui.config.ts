import type { LinguiConfig } from "@lingui/conf";

/** English source strings are the message ids; Polish is the default in-game locale. */
const config: LinguiConfig = {
  sourceLocale: "en",
  locales: ["en", "pl"],
  fallbackLocales: { default: "en" },
  catalogs: [{ path: "<rootDir>/src/locales/{locale}/messages", include: ["src"] }],
  format: "po",
};

export default config;
