# Technologies — Malatro

Owner of the stack, versions, commands and repo layout. See `conventions.md` for how the stack is
used, `design.md` for the visual libraries, `data-model.md` for Supabase schema.

## Stack (from `package.json`, checked 2026-09-26)

| Layer | Choice | Version | Notes |
| --- | --- | --- | --- |
| Package manager | Bun | `1.3.14` (`packageManager` field) | Single app, no Turbo/workspaces (unlike the `context/` reference monorepo) [repo: package.json] |
| Framework | React + Vite (SPA, no Next.js) | React 19.2.3 (pinned via `overrides`/`resolutions`), Vite 7.3.6 | [user, project-brief.md] |
| Language | TypeScript | `~6.0.3`, `strict: true` | [repo: tsconfig.json] |
| Compiler | React Compiler (`babel-plugin-react-compiler`) | 1.0.0 | Via Babel in `@vitejs/plugin-react`; no manual `memo`/`useMemo` needed |
| i18n | Lingui (`@lingui/core`/`react`/`cli`/`vite-plugin`) | 5.9.5 | See `i18n.md` |
| Styling | Tailwind CSS 3 + `tailwindcss-animate` | 3.4.19 | RGB-channel tokens, see `design.md` |
| Data fetching | `@tanstack/react-query` | 5.104.0 | Module-level `queryClient` (client-only app) |
| Backend | `@supabase/supabase-js` | 2.117.2 | Optional — guest mode if unconfigured |
| Motion | `motion` (`motion/react`) | 12.43.0 | Springs, `Reorder`, layout animation |
| Background shader | `ogl` | 1.0.11 | Adapted React Bits "Balatro" swirl |
| Audio | `howler` | 2.2.4 | See `assets.md` |
| Drawing | `perfect-freehand` | 1.2.3 | Task-viewer scratch layer |
| Math rendering | `katex` | 0.16.22 | `katex/dist/katex.min.css` imported in `src/styles.css` |
| Validation | `zod` | 4.4.3 | Env parsing (`src/lib/env.ts`) |
| Class utils | `class-variance-authority`, `clsx`, `tailwind-merge` | 0.7.1 / 2.1.1 / 3.6.0 | `cn()` in `src/lib/utils.ts` |
| Toasts | `sonner` | 2.0.7 | |
| Lint | ESLint 9 flat config + `typescript-eslint` 8 + `eslint-plugin-react-hooks` 7 + `eslint-plugin-simple-import-sort` + `eslint-plugin-lingui` | [repo: eslint.config.mjs] |
| Format | Prettier 3 + `prettier-plugin-sql` + `prettier-plugin-tailwindcss` | printWidth 120 | [repo: .prettierrc] |
| Tests | `bun test` | preload `tests/setup.ts` (localStorage shim) | No Playwright/e2e dependency is installed yet — see `open-questions.md` |
| Data pipeline | Python 3 + `pymupdf` + `Pillow` | not pinned (no `requirements.txt`) | [repo: data-pipeline/extract.py], [repo: data-pipeline/build_dataset.py] |

## Commands

| Command | Does |
| --- | --- |
| `bun install` | Install JS dependencies |
| `bun run dev` | Vite dev server on port 5173 |
| `bun run build` | `i18n:compile` → `tsc --noEmit` → `vite build` |
| `bun run preview` | Preview the production build |
| `bun run typecheck` | `tsc --noEmit -p tsconfig.json` |
| `bun run lint` / `bun run fix` | ESLint check / autofix |
| `bun run fmt` | Prettier write |
| `bun test` | Run `tests/*.test.ts` |
| `bun run check` | typecheck + lint + test (the CI/definition-of-done bundle) |
| `bun run translate` | `lingui extract --clean && lingui compile --typescript --strict` |
| `bun run i18n:compile` | `lingui compile --typescript --strict` only (also runs before `build`) |
| `bun run data:build` | `python data-pipeline/build_dataset.py` — rebuild `public/data/tasks.json` from annotations |
| `bun run supabase:types` | `supabase gen types typescript --local --schema public > src/lib/supabase/database.types.ts` |
| `bun run hooks:install` | `git config core.hooksPath .githooks` — see `open-questions.md` (folder doesn't exist yet) |
| `python data-pipeline/extract.py [exam_id ...]` | Crop tasks out of exam PDFs into `data-pipeline/out/` |
| `python scripts/translate-pl.py` | Fill `src/locales/pl/messages.po` from its PL dictionary |
| `python scripts/make-cursors.py` | Regenerate `public/cursors/*.png` |
| `bun scripts/balance.ts` | Simulate scoring to sanity-check `VALUE_CAP` / ante targets (not a `bun test` file) |

## Environment variables (names only — see `.env.example`)

| Var | Purpose | Required |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | No — omitted means guest-only mode |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key | No — same as above |

Both are read once via `zod` in `src/lib/env.ts`; never read real `.env`/`.env.local` values, only
`.env.example` names them. Local dev values come from `supabase start` output.

### Supabase setup (optional — login + leaderboard)

1. Needs the Supabase CLI + Docker. `supabase start` runs the local stack, applies
   `supabase/migrations/*`, and prints the local API URL + publishable key.
2. Copy `.env.example` → `.env.local`, set the two vars above.
3. Email confirmation is disabled for the local stack (`supabase/config.toml`). A **hosted** project
   must also have "Confirm email" turned off (Authentication settings) — login is slug + PIN, not email.

## Repo layout

```
src/
  components/{cards,game,layout,ui,viewer}/   feature components, PascalCase, default export
  contexts/           Auth, Game, Playback, Settings, Viewer — React bridges over lib/services
  hooks/{auth,runs}/  thin TanStack Query wrappers
  services/{auth,profiles,runs,tanstack-query}/  Supabase I/O, one export per file
  lib/                framework-free helpers
    game/              engine, rules (run.ts), scoring, hands, deck, rng, constants, content/*
    supabase/          client, typed Database wrapper, generated database.types.ts
  screens/            top-level screens (Auth, MainMenu, GameScreen, HowToPlay)
  locales/{en,pl}/    Lingui catalogs (.po source + compiled .ts)
supabase/
  schemas/{TABLES,RPC}/   declarative SQL source of truth
  migrations/             timestamped deltas applied to a local/hosted project
  config.toml             local stack config (project_id "malatro")
data-pipeline/        Python: manifest -> extract -> annotations -> build_dataset (see data-model.md)
scripts/              balance.ts, make-cursors.py, translate-pl.py
tests/                bun:test specs + fixtures + preload setup
public/               fonts, audio, cursors, and the built dataset (tasks.json, statements/, tasks/)
assets/               research-only source assets + licences (see assets.md) — not served
context/              gitignored reference monorepo (read-only pattern source, see research/context-analysis.md)
.claude/project-info/ this wiki
```

## Notes

- Path alias `~/` → `src/*`, configured in both `vite.config.ts` (`resolve.alias`) and `tsconfig.json`
  (`paths`). No `@/` and no deep relative imports. [repo: vite.config.ts], [repo: tsconfig.json]
- The project directory is **not currently a git repository** (no `.git/`) even though `.gitignore`,
  `.prettierignore` and a `hooks:install` script exist — see `open-questions.md`.
- `data-pipeline/raw/` (source PDFs) and `data-pipeline/.cache/` are gitignored; `data-pipeline/out/`
  (extracted crops + text, ~72 MB) is **not** gitignored — see `open-questions.md`.
- Vite build target `es2022`; `manualChunks` splits react / motion / katex / supabase / vendor, and
  GameScreen + TaskViewer are lazy (`src/screens/lazy.ts`, prefetched on idle).
