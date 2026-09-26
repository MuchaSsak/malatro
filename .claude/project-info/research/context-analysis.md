# Context analysis: patterns to replicate in Malatro (Vite + React + TS SPA)

> Source: the reference monorepo copied into `context/` (PstrykWeb factory, Bun + Turborepo). Read-only.
> Path aliases used in tags below:
> `APP` = `context/apps/app.pstrykweb.pl` (Next 16 app, the newest house style) ·
> `LKG` = `context/context/ANALYZE PROJECT EXAMLPE #1` (Linkoglot, called "the matured style"; its Expo
> app talks to Supabase from the client, which is the closest analog to a SPA) ·
> `TPL` = `context/.claude/templates/root` (generated-site framework docs) · `WIKI` = `context/.claude/project-info`.
> The reference has **no Vite app** (only a legacy `vite.config.js` in a landing snapshot), **no zustand/jotai**,
> **no `queryOptions()`**, and **no Tailwind v4**. Anything marked *(rec)* is my recommendation, not a repo fact.

## 1. Stack & versions

| Concern | Declared range | Resolved (bun.lock) | Tag |
| --- | --- | --- | --- |
| Package manager | `bun@1.3.14` (`packageManager`) | text `bun.lock` v1 | [repo: context/package.json] |
| Monorepo runner | `turbo ^2` | 2.10.3 | [repo: context/turbo.json] |
| React / DOM | `^19.2.0`, root `overrides`+`resolutions` pin `19.2.3` | 19.2.3 | [repo: context/package.json] |
| TypeScript | `~6.0.3` | 6.0.3 | [repo: context/package.json] |
| @tanstack/react-query | `^5.95.2` | 5.101.2 | [repo: APP/package.json] |
| @supabase/supabase-js | `^2.100.1` | 2.110.5 | [repo: APP/package.json] |
| @supabase/ssr | only in a Next example (`^0.7.0`), not needed for SPA | - | [repo: context/context/ANALYZE PROJECT EXAMPLE #4/apps/web/package.json] |
| Tailwind | `^3.4.17` (+ `tailwindcss-animate ^1.0.7`, postcss `^8.5.15`, autoprefixer `^10.5.0`) | 3.4.19 | [repo: APP/package.json] |
| Motion | `motion ^12.40.0` (import `motion/react`) | 12.42.2 | [repo: LKG/apps/website/package.json] |
| UI primitives | `radix-ui ^1.6.0` (LKG/TPL) or per-pkg `@radix-ui/react-*` (APP) | 1.6.1 | [repo: LKG/apps/website/package.json] |
| cva / clsx / tailwind-merge | `^0.7.1` / `^2.1.1` / `^3.6.0` | 0.7.1 / 2.1.1 / 3.6.0 | [repo: APP/package.json] |
| Icons / toasts | `lucide-react ^0.545.0` / `sonner ^2.0.7` | 0.545.0 / 2.0.8 | [repo: APP/package.json] |
| Forms | `react-hook-form ^7.63.0`, `@hookform/resolvers ^5.2.2`, `zod ^4.1.11` | 7.88.0 / 5.9.1 / 4.4.3 | [repo: APP/package.json] |
| i18n | `@lingui/core`/`react`/`cli ^5.9.3`, `@lingui/swc-plugin ^6.1.0` (Next) | 5.9.5 | [repo: APP/package.json] |
| React Compiler | `babel-plugin-react-compiler ^1.0.0` (+ `reactCompiler: true`) | 1.0.0 | [repo: APP/next.config.ts] |
| Lint | `eslint ^9`, `typescript-eslint ^8`, `eslint-plugin-react-hooks ^7`, `eslint-plugin-simple-import-sort ^12.1.1`, `eslint-plugin-lingui ^0.12.0` | 9.39.5 / 8.64.0 / 7.1.1 / 12.1.1 / 0.12.0 | [repo: context/bun.lock] |
| Format | Prettier 3 + `prettier-plugin-sql 0.18.1` + `prettier-plugin-tailwindcss 0.5.11` | 3.9.4 | [repo: context/package.json] |
| Tests | `bun test` (unit), `@playwright/test ^1.56.0` (e2e), `playwright ^1.62.1` root | 1.62.1 | [repo: APP/package.json], [repo: TPL/../nextjs-landing-page/apps/nextjs-landing-page/package.json] |
| Type utils | `type-fest` (`MergeDeep` in DB override layer) | 5.7.0 | [repo: LKG/packages/shared/src/lib/database.ts] |

## 2. Package manager & scripts

- Bun only, workspaces `apps/*`, `packages/*`, `supabase`; never cross toolchains (Deno only for edge fns) [repo: context/CLAUDE.md].
- Root script naming is `<scope>:<task>`: `app:dev`, `app:check`, `supabase:types`, `root:translate`, `hooks:install` [repo: WIKI/conventions/coding-guidelines.md].
- Turbo tasks: `build` (dependsOn `^build`, outputs `dist/**`), `typecheck`, `lint`, `check` = typecheck + lint + build, `dev`/`preview` `cache:false, persistent:true`; `globalEnv: ["CI","NODE_ENV"]`; strict env mode strips undeclared vars [repo: context/turbo.json].
- Per-app scripts: `typecheck: tsc --noEmit -p tsconfig.json`, `lint: eslint .`, `test: bun test`, `translate: lingui extract --clean && lingui compile --typescript --strict`, `build` runs `i18n:compile` first [repo: APP/package.json].
- Root helpers: `root:fmt: prettier --write . --log-level warn`, `root:fix: eslint --fix .`, `hooks:install: git config core.hooksPath .githooks` [repo: context/package.json].
- *(rec)* Malatro is a single app, so skip Turbo/workspaces; keep the same script names (`dev`, `build`, `preview`, `typecheck`, `lint`, `fix`, `fmt`, `test`, `check`, `translate`, `supabase:types`).

## 3. TS config conventions

- Base: `target/module: esnext`, `moduleResolution: bundler`, `strict`, `noEmit`, `isolatedModules`, `allowImportingTsExtensions`, `resolveJsonModule`, `skipLibCheck`, `esModuleInterop`, `forceConsistentCasingInFileNames`, `ignoreDeprecations: "6.0"` (TS 6) [repo: context/tsconfig.base.json].
- App: extends base, `target ES2022`, `lib ["dom","dom.iterable","esnext"]`, `jsx: react-jsx`, `allowJs: false`, `types ["node","bun"]` [repo: APP/tsconfig.json].
- Aliases: `~/<app>/*` for app code, `@package/shared/*` for shared; **never `@/`, never `../../../`** [repo: WIKI/conventions/coding-guidelines.md]. (LKG mobile still uses `@/`, the newer APP rule forbids it.)
- *(rec)* Malatro: `"paths": { "~/*": ["src/*"] }` + matching `resolve.alias` in `vite.config.ts`.

## 4. Lint / format

- **ESLint 9 flat config** per app (`eslint.config.mjs`), no Biome/oxlint anywhere [repo: APP/eslint.config.mjs]:
  ```js
  export default tseslint.config(
    { ignores: [".next/**", "node_modules/**", "locales/**", "next-env.d.ts"] },
    ...tseslint.configs.recommended,
    reactHooks.configs.flat["recommended-latest"],
    lingui.configs["flat/recommended"],
    { plugins: { "simple-import-sort": simpleImportSort },
      rules: {
        "simple-import-sort/imports": ["warn", { groups: [["^\\u0000"], ["^node:"], ["^@?\\w"], ["^~/"], ["^\\."]] }],
        "simple-import-sort/exports": "warn",
        "@typescript-eslint/consistent-type-definitions": ["error", "type"],
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      } },
    { files: ["components/**", "hooks/**", ...], rules: { "no-restricted-imports": ["error", { patterns: [...] }] } },
  );
  ```
- Shared rules block: `no-empty-pattern: off`, `@typescript-eslint/no-empty-object-type: off`, `no-restricted-syntax` guard against committing test flags (`IS_TESTING_MOCKS = false`) [repo: LKG/eslint.config.base.js].
- **Prettier**: `.prettierrc` = `{ "plugins": ["prettier-plugin-sql"], "overrides": [{ "files": "*.sql", "options": { "language": "postgresql", "dialect": "postgresql" } }] }` + a `.prettierignore` (node_modules, dist, .turbo, `supabase/migrations/`, lockfiles, `.env*`) [repo: LKG/.prettierrc], [repo: LKG/.prettierignore].
- Gaps to fix when copying: `prettier-plugin-tailwindcss` is installed but NOT listed in `plugins`; no `printWidth` set (default 80) while APP source runs to ~120 cols [repo: context/package.json], [repo: APP/components].
- VS Code: Prettier default formatter, `formatOnSave`, `source.fixAll: explicit`, `source.organizeImports: always`, `eslint.useFlatConfig` [repo: context/.vscode/settings.json].
- Git hooks: `commit-msg` enforces Conventional Commits `^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(scope\))?!?: .+`; `pre-commit` blocks ~25 secret shapes (`sb_secret_`, `sbp_`, JWTs, `VITE/NEXT_PUBLIC_*SECRET`) and real `.env*` files [repo: context/.githooks/commit-msg], [repo: context/.githooks/pre-commit].

## 5. Folder layout conventions (per app)

```
components/<feature>/  PascalCase.tsx, default export, one component per file (StepIndustry.tsx)
components/ui/         shadcn primitives, kebab-case (button.tsx), named exports + cva
components/layout/     Providers.tsx, TanstackQueryProvider.tsx, LinguiProvider.tsx, ToastProvider.tsx
contexts/<Name>Context.tsx   genuinely cross-tree client state
hooks/<domain>/use<VerbNoun>.ts   thin TanStack wrappers; hooks/utils/ for generic hooks
services/<domain>/<verbNoun>.ts   I/O only (+ invalidate<Domain>.ts, optimistic<Domain>Update.ts)
lib/                   pure helpers + config (env.ts, i18n.ts, utils.ts, api.ts, supabase/)
tests/                 *.test.ts (bun:test) + fixtures/
```
[repo: WIKI/conventions/coding-guidelines.md], [repo: APP/]. Folders are kebab-case; **no barrel `index.ts`** in component folders.

## 6. Supabase client creation + DB types

- Browser-side client (LKG mobile, the SPA analog; module singleton, services import it) [repo: LKG/apps/mobile/src/services/supabase/client.ts]:
  ```ts
  export const supabase = createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_ANON_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  ```
- Typed + lazy (APP server client; pass the `Database` generic, no `as Tables<>` casts) [repo: APP/lib/supabase/admin.server.ts]:
  ```ts
  let client: SupabaseClient<Database> | null = null;
  export function supabaseAdmin(): SupabaseClient<Database> { /* createClient<Database>(url, key, { auth: {...}, global: { headers: { "x-client-info": "app.pstrykweb.pl" } } }) */ }
  ```
- Public URL + publishable key may live in code (`sb_publishable_...`), "safe as long as RLS is right"; plus `RPC = { PERMISSION_DENIED: "42501", DUPLICATION: "23505", DEADLOCK: "40P01" }` [repo: LKG/packages/shared/src/lib/supabase/config.ts].
- Types: `supabase gen types typescript --project-id <ref> --schema public > ./packages/shared/src/lib/database.types.ts` (root script `supabase:types`) [repo: context/package.json].
- Override layer `database.ts`: `Database = Omit<Generated,"public"> & { public: MergeDeep<...> }` for typed jsonb, re-exports `Tables<>`, `TablesInsert<>`, `TablesUpdate<>`, `Enums<>`; apps import `database.ts`, never the generated file directly [repo: LKG/packages/shared/src/lib/database.ts], [repo: TPL/.claude/project-info/usage/supabase.md].
- DB-encoded constants: single-variant enums `FOO_CONST` / `BAR_CONST_ARR` read in TS via `database.constants.ts` [repo: LKG/packages/shared/src/lib/database.constants.ts].
- *(rec)* Malatro: `src/lib/supabase/{client,config,database,database.types}.ts`; `createClient<Database>(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, ...)` with `detectSessionInUrl: true` if you use OAuth/magic links; validate env with zod like [repo: APP/lib/env.ts].

## 7. TanStack Query patterns

- **No query-key factory and no `queryOptions()`** in the whole reference. Convention: key = `["<serviceName>", ...params]`; the first segment is the invalidation handle [repo: WIKI/conventions/nextjs-and-data-layer.md].
- Client defaults (APP; `useState(makeQueryClient)` per tree) [repo: APP/components/layout/TanstackQueryProvider.tsx]:
  ```ts
  new QueryClient({ defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true },
    mutations: { retry: false }, // a retried submit is a duplicate
  } });
  ```
  A module-level `queryClient` is fine "ONLY for a purely client-side app" (LKG: `retry: 1, gcTime: 1h`, exports `QueryError = Error & { code?; is_developer_err? }`) [repo: LKG/apps/mobile/src/services/tanstack-query/client.ts], [repo: TPL/.claude/project-info/usage/tanstack-query.md].
- Read hook: one per file, default export, returns the query object unchanged [repo: LKG/apps/mobile/src/hooks/study-sets/useGetStudySetById.ts]:
  ```ts
  export default function useGetStudySetById(studySetId?: string | null) {
    return useQuery({ queryKey: ["getStudySetById", studySetId],
      queryFn: () => (studySetId ? getStudySetById({ studySetId }) : null), enabled: !!studySetId });
  }
  ```
- Service: default export, single object param, exported `<VerbNoun>ServiceProps`, destructure `{ error }` and throw [repo: LKG/apps/mobile/src/services/study-sets/deleteStudySet.ts]:
  ```ts
  export type DeleteStudySetServiceProps = { studySetId: string };
  export default async function deleteStudySet({ studySetId }: DeleteStudySetServiceProps) {
    const { error } = await supabase.from("study_sets").delete().eq("id", studySetId);
    if (error) throw error;
  }
  ```
- Mutation hook: `mutationKey`, owns its toasts (translated `t` + `error.message` detail), then a per-domain invalidate helper; UI flags/callbacks ride on the variables (`isSuccessToast`, `onSuccess`) [repo: LKG/apps/mobile/src/hooks/study-sets/useDeleteStudySet.ts], [repo: LKG/apps/mobile/src/hooks/profiles/useUpdateProfile.ts].
- Invalidation only via colocated helpers: `invalidateStudySets({ studySetId })` → exact key for the entity + `{ queryKey: ["searchLibrary"], exact: false }` for lists [repo: LKG/apps/mobile/src/services/study-sets/invalidateStudySets.ts]; optimistic via `optimisticProfileUpdate()` → `queryClient.setQueryData(["getProfileEssentials"], old => ...)` [repo: LKG/apps/mobile/src/services/profiles/optimisticProfileUpdate.ts]. Template variant: `onMutate: optimistic...`, `onSettled: invalidate` [repo: TPL/.claude/project-info/usage/tanstack-query.md].
- Lists: `useInfiniteQuery`, `initialPageParam: 0`, `getNextPageParam` returns `undefined` on a short page; one `Page<T>` with exact `total` [repo: WIKI/conventions/nextjs-and-data-layer.md].
- Naming: reads `useGet*`/`useSearch*`, writes `use<Verb>*`; components import hooks, never services [repo: TPL/.claude/project-info/usage/tanstack-query.md].

## 8. Supabase migrations + RLS style

- Declarative source of truth `supabase/schemas/<CATEGORY>/<Name>.sql` (UPPERCASE categories `GLOBAL`, `ENUMS`, `UTILS`, `TABLES`, `RPC`, `CRONS`; PascalCase table files) + timestamped deltas `supabase/migrations/<YYYYMMDDHHMMSS>_<snake_desc>.sql` (e.g. `20260703013000_day_streaks_fire_on_finish_update.sql`; CLI-diffed ones are `_auto.sql`) [repo: WIKI/database/schema-workflow.md], [repo: LKG/supabase/migrations].
- SQL naming: snake_case plural tables, `is_/has_` booleans, `*_at` timestamptz, `<table>_<cols>_idx`, triggers `<table>_<purpose>_tr`, function params `p_`, locals `v_`, quoted-sentence policy names [repo: WIKI/database/schema-workflow.md].
- File shape: `begin; set local search_path = public, pg_catalog;` → `/* Table - who writes, who reads, why */` → table (`if not exists`, `id uuid default gen_random_uuid()`, `created_at timestamptz not null default now()`) → `alter ... add column if not exists` → Indexes → Triggers → RLS → explicit grants/revokes → `commit;`. Idempotent always [repo: context/supabase/schemas/TABLES/Projects.sql].
- Owner-scoped RLS (evaluate `auth.uid()` once via scalar subquery) [repo: LKG/supabase/schemas/TABLES/Chats.sql]:
  ```sql
  alter table public.chats enable row level security;
  drop policy if exists "Enable SELECT_OWN for authenticated" on public.chats;
  create policy "Enable SELECT_OWN for authenticated" on public.chats for select
     to authenticated using (user_id = (select auth.uid ()));
  create policy "Enable INSERT_OWN for authenticated" on public.chats for insert
     to authenticated with check (user_id = (select auth.uid ()));
  ```
- RPC: `security definer`, `set search_path = ''`, fully qualified refs, `revoke all ... from public, anon;` then narrow `grant execute` [repo: context/supabase/schemas/RPC/get_project_by_token.sql]. New public functions are callable at `/rest/v1/rpc/<fn>` unless revoked [repo: WIKI/database/overview.md].
- Event trigger `private.rls_auto_enable()` turns on RLS for every new table; internals live in non-exposed `private` schema [repo: context/supabase/schemas/GLOBAL/RLS AUTO ENABLE.sql].
- Enums: `do $$ if not exists (select 1 from pg_type ...) then create type ...; end $$;` + `alter type ... add value if not exists` [repo: context/supabase/schemas/ENUMS/ProjectJobStatus.sql].
- jsonb columns validated with `extensions.jsonb_matches_schema(...)` check constraints; length checks as named constraints [repo: LKG/supabase/schemas/TABLES/Chats.sql].
- Edge functions: Deno, `supabase/functions/<kebab-name>/{index.ts,deno.json}`, declared in `config.toml` with `verify_jwt` [repo: context/supabase/config.toml].

## 9. Auth patterns

- `AuthContext` holds `session` from `supabase.auth.onAuthStateChange((_, s) => setSession(s))`; on sign-out it nulls user-scoped caches (`setQueryData(["getProfileEssentials"], null)`, `setQueriesData({ predicate })`); `useAuth()` throws `"useAuth was used outside of AuthProvider!"` [repo: LKG/apps/mobile/src/contexts/AuthContext.tsx].
- Auth I/O is ordinary services + mutation hooks: `signInViaPassword({ email: email.trim(), password })`, `signOut()`, `useSignOut()` with toasts + invalidation [repo: LKG/apps/mobile/src/services/auth/signInViaPassword.ts], [repo: LKG/apps/mobile/src/hooks/auth/useSignOut.ts].
- Profile row created server-side by `after insert on auth.users` trigger → `private.profiles_sync_with_users()` [repo: LKG/supabase/schemas/TABLES/Profiles.sql].
- `getUser()` (server-verified), never `getSession()`, for authorization decisions; roles in `app_metadata` (not user-writable) [repo: WIKI/conventions/nextjs-and-data-layer.md], [repo: WIKI/database/overview.md].
- Never trust a `userId`/`role` sent in a body; never a policy `to authenticated using (true)` [repo: WIKI/conventions/coding-guidelines.md].

## 10. i18n pattern (Lingui v5)

- Macros: `<Trans>` + `useLingui()` from `@lingui/react/macro` in components; `msg` for static option arrays rendered with `_()`; `t` from `@lingui/core/macro` in non-React code (zod schema factories). Never import `@lingui/macro` [repo: WIKI/conventions/i18n-and-routing.md].
- Source string = id (`useLinguiV5IdGeneration: true` on the SWC plugin); compile `--typescript --strict` so a missing translation fails the build [repo: APP/next.config.ts], [repo: APP/lingui.config.ts].
- Config: `sourceLocale: "en"`, `locales: ["en","pl","uk"]`, `fallbackLocales.default: "en"`, catalog `<rootDir>/locales/{locale}/messages` (`.po` + committed compiled `.ts`) [repo: APP/lingui.config.ts]. One `localeCodes` module owns locale lists [repo: context/lingui.config.js].
- Provider: `const [i18n] = useState(() => setupI18n({ locale, messages: { [locale]: messages } }))` → `<I18nProvider>` [repo: APP/components/layout/LinguiProvider.tsx].
- Rules: every user-facing string is a macro (lint fails otherwise); `context` for homonyms; interpolate local variables for readable placeholders; **only ASCII hyphen in copy** (no em/en dash) [repo: WIKI/conventions/coding-guidelines.md].
- Tests stub the macro via a Bun preload plugin (`tests/setup.ts`, `bunfig.toml` `preload`) [repo: APP/tests/setup.ts].
- *(rec)* Vite: `@lingui/vite-plugin` + `@vitejs/plugin-react` with babel plugins `@lingui/babel-plugin-lingui-macro` and `babel-plugin-react-compiler`.

## 11. Styling pattern

- Tailwind **3.4** + PostCSS (`tailwindcss`, `autoprefixer`) + `tailwindcss-animate` [repo: APP/postcss.config.mjs].
- Tokens as RGB-channel CSS vars on `:root` so opacity modifiers work: `const channel = (n) => \`rgb(var(--pw-${n}) / <alpha-value>)\``; semantic names (`accent`, `bg`, `surface`, `ink`, `line`), custom `fontSize` (`h1: clamp(...)`), `borderRadius` via vars, named keyframes; components never hand-pick hex [repo: APP/tailwind.config.ts], [repo: APP/app/globals.css].
- shadcn/ui "new-york", `cssVariables: true`, lucide icons; primitives with `cva` + `cn()` (`twMerge(clsx(inputs))`), `export { Button, buttonVariants }`, `asChild` via Radix `Slot` [repo: TPL/../nextjs-landing-page/apps/nextjs-landing-page/components.json], [repo: APP/components/ui/button.tsx].
- Motion: `motion/react`; custom easing tokens `EASE = { out: [0.16,1,0.3,1], quart: [0.25,1,0.5,1], inOut: [0.87,0,0.13,1] }`, durations 150/300/500/800/1200 ms; animate only `transform`/`opacity`; exit about 60-70% of entrance; respect `prefers-reduced-motion` [repo: TPL/.claude/project-info/usage/motion.md].
- A11y: visible `focus-visible` ring, 44px touch targets, `text-base sm:text-sm` inputs, skeletons over spinners [repo: WIKI/conventions/coding-guidelines.md].

## 12. Coding guidelines distilled

- **Components**: `export default function Name()` (never arrow-const), props `type NameProps = ...` right above, destructure in signature, peel `className` + `...props`, `cn(base, conditionals, className)` last. No manual `memo`/`useMemo`/`forwardRef` (React Compiler on; `"use no memo"` to opt out); `ref` is a normal prop [repo: WIKI/conventions/coding-guidelines.md].
- **Types**: `type` only, never `interface` (lint-enforced) [repo: APP/eslint.config.mjs].
- **Names**: booleans `is/has/should/can`; handlers `handle<Event>` locally, `on<Event>` as props; constants `SCREAMING_SNAKE` with `MIN_/MAX_/DEFAULT_` prefixes and `7_500` separators; regex `_REGEX`; env vars purpose-scoped.
- **Contexts**: `createContext<X | null>(null)`, default-export `<Name>Provider`, named `use<Name>()` that throws outside the provider [repo: APP/contexts/KonfiguratorContext.tsx].
- **State**: server state = TanStack Query; cross-tree = Context; ephemeral = `useState`. "No Redux/Zustand/Jotai." Complex logic lives in a **framework-free engine object** that React observes via a snapshot (`draftSyncEngine.ts` → `SyncSnapshot`) [repo: WIKI/conventions/forms-and-autosave.md].
- **Errors**: services throw, hooks/UI decide; `null` only for genuine not-found (`maybeSingle()`); never `String(error)` on a supabase error, use `describeError()`; typed `ApiError { status, code, body }` [repo: APP/lib/supabase/admin.server.ts], [repo: APP/lib/api.ts].
- **Forms**: RHF + zod v4; schemas are factories taking `i18n` (messages resolved at call time); limits exported constants; store enum ids, not labels; submit keeps its label and disables while pending [repo: WIKI/conventions/forms-and-autosave.md].
- **localStorage**: every access in try/catch, degrade to memory; versioned envelope (`pw_konfigurator_v1`, `schemaVersion` + `migrate`) [repo: WIKI/conventions/forms-and-autosave.md].
- **Comments**: code says WHAT, comments say WHY (constraint, incident, rejected approach); short prose docblock atop non-obvious modules; `/** Label */` section headers (`/** Types */`, `/** Provider */`); no `@param` restating types [repo: LKG/apps/mobile/src/contexts/AuthContext.tsx].
- **Do NOT**: arrow-const components · `interface` · barrel files · `@/` or deep relative imports · hardcoded copy · em/en dashes · fetch/Supabase inside components or hooks (go through `services/`) · secrets in public env · auto-retrying mutations · reshaping a hook's return · scattered `useQueryClient` invalidation · giant single-`useState` forms · module-level zod schemas with untranslated messages · placeholder copy/links [repo: WIKI/conventions/coding-guidelines.md].
- **Workflow**: Conventional Commits; verification scaled to change (typecheck+lint → + unit tests → + Playwright screenshots at 390/1024/1920); wiki in `.claude/project-info/` updated with the code + `log.md` line `## [YYYY-MM-DD] <wiki|feat|fix|lint> | <summary>` [repo: WIKI/conventions/workflow-and-docs.md].

## 13. Notable for a Vite SPA (what changes vs. the reference)

- No server: follow the **LKG mobile** model (services call the typed browser Supabase client directly), not APP's `/api/*` + service-role model. RLS + `security definer` RPCs are the only guards, so write them as the reference does (deny-all default, `(select auth.uid())`, revoke from `public, anon`).
- *(rec)* Leaderboard: public `select` policy on the scores view/table for `anon, authenticated`; inserts via an RPC `submit_score(p_...)` (security definer) that validates bounds and stamps `user_id = auth.uid()` rather than a raw insert policy, so clients cannot write arbitrary rows.
- A module-level `queryClient` is acceptable (pure client app) and lets `invalidate*`/`optimistic*` helpers import it like LKG; keep `mutations.retry: false`.
- Game engine = pure TS module(s) in `src/lib/game/` (scoring, deck, jokers) tested with `bun test` like `mergeDrafts.test.ts`; React observes it through a context/snapshot, matching the house "no zustand" rule [repo: APP/tests/mergeDrafts.test.ts].
- Env: `VITE_*` only for public values; the pre-commit secret-shape hook adapts by swapping `NEXT_PUBLIC_` for `VITE_` [repo: context/.githooks/pre-commit].
- React Compiler + Lingui macros both need Babel in Vite (`@vitejs/plugin-react` `babel.plugins`), where Next used SWC.
- Keep Tailwind 3.4 + RGB-channel tokens to reuse the reference configs verbatim; moving to Tailwind 4 would mean rewriting `tailwind.config.ts` as CSS `@theme`.
