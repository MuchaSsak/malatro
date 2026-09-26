# Open questions — Malatro

Every `Unknown` and unresolved contradiction found while writing this wiki, newest-relevant first.
Mark resolved items `[RESOLVED yyyy-mm-dd]` rather than deleting them.

## Blocking user decisions

| # | Question | Blocks | Notes |
| --- | --- | --- | --- |
| 1 | Deploy a real Supabase project (or run `supabase start` locally)? | Login/leaderboard testing beyond guest mode | Needs Docker Desktop (or an equivalent) for the local stack, or a hosted project + `supabase link`. Schema/RPCs are ready (`supabase/schemas/`, one migration). `.env.local` needs `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` either way. [repo: supabase/config.toml] |
| 2 | For a **hosted** Supabase project: disable email confirmations in Auth settings | PIN-only sign-in (`signInWithPin.ts` has no email-confirmation flow) | Local `supabase start` already ships `enable_confirmations = false` in `supabase/config.toml` (lines 226, 261) — this only matters once the project is pushed to a real Supabase org. |
| 3 | Balance playtesting | Whether `ANTE_BASE`/`VALUE_CAP`/economy constants need retuning | Everything in `src/lib/game/constants.ts` is hand-tuned from `scripts/balance.ts` simulation, not real playtesting. [user] |

## Data quality

| # | Question | Blocks | Notes |
| --- | --- | --- | --- |
| 5 | Full second-opinion pass over unverified cards | Trust in shipped answers (answers are now required) | 172 doubtful + sampled cards were re-solved 2026-09-26 (`data-pipeline/verify/`); the random sample showed ~5% gameplay-affecting errors among the ~2,300 unverified cards. Waiting on user go-ahead (cost). [user] |
| 6 | [RESOLVED 2026-09-26] Old-exam shared figures | — | `INFO_RE` now also matches "W zadaniach X i Y"; 18 exams re-extracted, crop issues are dropped by `build_dataset.py`; `dataset-report.json` `problems[]` is empty. |
| 7 | [RESOLVED 2026-09-26] `TaskRecord.conf` | — | `conf?: "high" \| "medium"` added to `types.ts`. |

## Repo hygiene

| # | Question | Blocks | Notes |
| --- | --- | --- | --- |
| 8 | Initialize git? | Version control, PR workflow, the `.githooks`/hooks:install script having any effect | The working directory is not currently a git repository, despite `.gitignore` and `.prettierignore` existing. |
| 9 | [RESOLVED 2026-09-26] `.githooks/` | — | the dead `hooks:install` script was removed from `package.json`; revisit with #8. |
| 10 | Should `data-pipeline/out/` be gitignored? | Repo size (~72 MB of regenerable crops/text) | `.gitignore` excludes `data-pipeline/raw/` and `data-pipeline/.cache/` but not `data-pipeline/out/`, which is fully regenerable via `python data-pipeline/extract.py`. |
| 11 | Pin Python dependencies | Reproducible pipeline runs | No `requirements.txt`/`pyproject.toml` for `data-pipeline/extract.py` (`pymupdf`, `Pillow`) or `scripts/make-cursors.py` (`Pillow`); versions are whatever is installed locally. |

## Non-functional unknowns

| # | Question | Blocks | Notes |
| --- | --- | --- | --- |
| 14 | Playwright for the "visual check" step | Whether `bun run check` should gain an e2e/screenshot step | Convention (per project instructions) names Playwright for the definition-of-done visual check, but `@playwright/test` is not a `package.json` dependency yet. |
| 15 | [RESOLVED 2026-09-26] WebGL / Fullscreen fallback | — | no WebGL: `BalatroBackground` keeps a CSS gradient of the palette; fullscreen silently no-ops. Render errors hit `src/components/layout/ErrorBoundary.tsx` (reload / reset saved run). |
| 16 | Accessibility beyond reduced-motion | Whether an a11y pass is in scope for v1 | No contrast/screen-reader/keyboard-only-shop pass found or referenced anywhere in the repo or existing wiki. |

## Answered while writing this pass

- Whether the credits screen lists font/music/SFX/background/task attributions: **yes**,
  `src/components/game/OptionsPanel.tsx` already shows them (see `assets.md`).
- Whether local Supabase dev needs manual email-confirmation disabling: **no**, already set in
  `supabase/config.toml` — see #2 above for the hosted-project caveat.
