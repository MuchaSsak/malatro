import js from "@eslint/js";
import lingui from "eslint-plugin-lingui";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".claude/**", "dist/**", "node_modules/**", "src/locales/**", "context/**", "data-pipeline/**", "public/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  { files: ["src/**/*.tsx", "src/**/*.ts"], ...lingui.configs["flat/recommended"] },
  {
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": ["warn", { groups: [["^\\u0000"], ["^node:"], ["^@?\\w"], ["^~/"], ["^\\."]] }],
      "simple-import-sort/exports": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty-pattern": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    // game engine + data are pure logic: no copy lives there except via msg descriptors
    files: ["src/lib/**", "tests/**"],
    rules: { "lingui/no-unlocalized-strings": "off" },
  },
  {
    files: ["src/components/**", "src/screens/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["~/services/*"], message: "Components use hooks, not services." }] },
      ],
    },
  },
);
