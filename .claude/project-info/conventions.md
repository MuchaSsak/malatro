# Conventions — Malatro

Owner of code style, naming, folder rules and "definition of done". Derived from the actual code
(this is the ground truth) plus the pattern research in `research/context-analysis.md` (the
`context/` reference monorepo Malatro's style is based on — that repo is Next.js/Turborepo and does
not exist for a Vite SPA verbatim, so entries below say when Malatro diverges).

## Components

- `export default function Name(props: NameProps) { ... }` — never an arrow-const component.
  Confirmed across every file in `src/components/**` and `src/screens/**`. [repo: src/components/**]
- Props type is `type NameProps = { ... }` directly above the component, destructured in the
  signature. [repo: src/components/cards/TaskCard.tsx and siblings]
- No manual `memo`/`useMemo`/`useCallback` — the React Compiler (`babel-plugin-react-compiler`)
  handles it. [repo: vite.config.ts, context-analysis.md §12]
- No barrel `index.ts` files anywhere under `src/`. [repo: src/ directory listing]
- Folders are feature-based and kebab/camel per existing folder names:
  `components/{cards,game,layout,ui,viewer}/`, `contexts/`, `hooks/<domain>/`, `services/<domain>/`,
  `screens/`. [repo: src/ directory listing]

## Types

- `type`, never `interface` — lint-enforced (`@typescript-eslint/consistent-type-definitions`).
  [repo: eslint.config.mjs]
- `TaskRecord`, `RunState`, `RoundState` etc. in `src/lib/game/types.ts` must stay JSON-serialisable
  (the engine persists them raw via `structuredClone`/`JSON.stringify`). [repo: src/lib/game/types.ts]

## Imports

- Alias `~/` → `src/*` only; no `@/`, no `../../../`. [repo: vite.config.ts, tsconfig.json]
- Import order enforced by `simple-import-sort`: side-effect imports, `node:`, external packages,
  `~/` imports, then relative. [repo: eslint.config.mjs]
- `no-restricted-imports` blocks `~/services/*` inside `src/components/**` and `src/screens/**` —
  **components use hooks, not services** directly. [repo: eslint.config.mjs]

## State management

- **No Redux/Zustand/Jotai/Context-as-store.** The entire run/game state lives in a framework-free
  `GameEngine` class (`src/lib/game/engine.ts`): actions clone the run with `structuredClone`, apply
  a pure rule function from `run.ts`, persist to localStorage, and notify subscribers. React reads
  it via `useSyncExternalStore` in `GameContext.tsx`. [repo: src/lib/game/engine.ts], [repo: src/contexts/GameContext.tsx]
- Cross-tree UI state (auth session, settings, viewer target, playback/shake flags) is plain React
  Context, one per concern: `AuthContext`, `SettingsContext`, `ViewerContext`, `PlaybackContext`.
  Each exports a `use<Name>()` hook that throws if used outside its provider. [repo: src/contexts/*.tsx]
- Server state (Supabase) goes through TanStack Query only.

## Data layer (services + hooks)

- **Services do I/O.** One default-exported async function per file, single object param, a
  `<VerbNoun>ServiceProps` type, throws on `error`. [repo: src/services/runs/submitRun.ts and siblings]
- **Hooks are thin wrappers.** One `useQuery`/`useMutation` per file, default export, returns the
  query/mutation object unchanged; mutation hooks own their toasts (Lingui `t` + error detail) and
  call a colocated `invalidate<Domain>()` helper on success. [repo: src/hooks/runs/useSubmitRun.ts]
- **Query keys**: `["<serviceName>", ...params]` — e.g. `["getLeaderboard", difficulty]`,
  `["submitRun"]`, `["signInWithPin"]`. Invalidation targets the same first segment with
  `exact: false`. [repo: src/services/runs/invalidateRuns.ts]
- **Mutations never retry** (`mutations: { retry: false }` in the module-level `queryClient` —
  a retried submit would be a duplicate). Queries: `retry: 1, staleTime: 30_000`.
  [repo: src/services/tanstack-query/client.ts]
- `null` is reserved for genuine not-found (`maybeSingle()`), not a generic empty state.
  [repo: src/services/profiles/getProfile.ts]

## Naming

- Booleans: `is/has/should/can*` (`isFaceDown`, `hasSeenTutorial`, `isReducedMotion`).
- Constants: `SCREAMING_SNAKE` (`VALUE_CAP`, `BASE_HANDS`, `ANTE_BASE`).
- Regex constants end in `_REGEX` (`SLUG_REGEX`, `PIN_REGEX`). [repo: src/services/auth/signInWithPin.ts]
- Handlers: `handle<Event>` for local functions, `on<Event>` for props (`onMainMenu`, `onSuccess`).

## Copy and i18n

- Every user-facing string is a Lingui macro (`<Trans>`, `t`), lint-checked via
  `eslint-plugin-lingui`; the rule is turned **off** for `src/lib/**` and `tests/**` since game data
  carries its own bilingual `L10n` objects instead. [repo: eslint.config.mjs]
- **ASCII hyphen only**, never en/em dash, in all UI copy and task data — enforced in the data
  pipeline by `clean()` (`DASH_RE`) and stated as a house rule for hand-written strings.
  [repo: data-pipeline/build_dataset.py]
- See `i18n.md` for the full Lingui + PL-dictionary workflow.

## Storage

- All localStorage access goes through `readJson`/`writeJson` (`src/lib/storage.ts`): every call is
  try/catch, degrading to an in-memory `Map` if storage is blocked or full.
- Versioned envelopes: `{ schemaVersion: 1, run }` for the engine, similarly for settings/drawings —
  see `data-model.md` for the exact keys.

## Comments

- Short prose docblock at the top of non-obvious modules explaining WHY, not WHAT (see
  `engine.ts`, `constants.ts`, `graphics.ts`, `Tilt.tsx` for examples). Inline comments call out
  constraints or deliberate trade-offs (e.g. why the swirl downscales instead of using `devicePixelRatio`).
- `/** Types */`, `/** Provider */` section headers inside larger files (contexts, engine).

## Testing

- `bun test`, root `tests/`, preload `tests/setup.ts` (minimal localStorage polyfill so engine
  persistence works under Bun's test runner outside a browser). [repo: bunfig.toml]
- `tests/fixtures.ts` provides a deterministic fake task pool (`fakePool`) and a single-task
  builder (`task(...)`) covering all 13 categories. Only `tests/engine.test.ts` exists today.
- `scripts/balance.ts` is a separate, manually-run simulation (`bun scripts/balance.ts`) used to pick
  `VALUE_CAP` and `ANTE_BASE` — **not** a `bun test` file (`game-design.md` was corrected to point
  here during this pass; it previously cited a non-existent `tests/balance.test.ts`).

## Definition of done

`bun run check` (typecheck + lint + `bun test`) plus a manual visual check. Playwright is the
intended tool for the visual check per project instructions, but **no Playwright dependency is
installed yet** (`package.json` has no `@playwright/test`) — until it is added, "visual check" means
running `bun run dev` and looking at the change. See `open-questions.md`.

## Git

- No git hooks are currently committed: `package.json`'s `hooks:install` script points at
  `.githooks/`, which does not exist in the repo yet (contrast with the reference monorepo's
  `commit-msg`/`pre-commit` hooks in `research/context-analysis.md` §4). The project itself is not
  yet a git repository (no `.git/`). See `open-questions.md`.
