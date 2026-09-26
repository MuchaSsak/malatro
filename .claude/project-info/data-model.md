# Data model — Malatro

Owner of the shapes data actually takes: the task record, run/round state, localStorage keys, the
Supabase schema, and the data pipeline that produces `public/data/tasks.json`. Game _rules_ (what the
numbers mean) are owned by `game-design.md`; this page owns _shapes and storage_.

## TaskRecord (one matura task = one card)

Defined in `src/lib/game/types.ts`, shipped compactly in `public/data/tasks.json` (short keys keep
the 2,462-record file small — 1.37 MB uncompressed [repo: public/data/tasks.json]):

| Field                        | Type              | Meaning                                                                                                                                                                                                                 |
| ---------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                         | string            | `"<exam>__<task>"`, e.g. `f2005-P-2005-maj__2`                                                                                                                                                                          |
| `exam`                       | string            | exam id, `f<formula>-<level>-<year>-<session>[-suffix]`                                                                                                                                                                 |
| `task`                       | string            | task number within the exam, e.g. `"14.1"`                                                                                                                                                                              |
| `level`                      | `"P" \| "R"`      | podstawowy / rozszerzony                                                                                                                                                                                                |
| `cat`                        | `CategoryId`      | one of 13 categories (the poker "rank")                                                                                                                                                                                 |
| `topic`                      | `L10n`            | 1-4 word subtopic, `{pl, en}`                                                                                                                                                                                           |
| `diff`                       | number 1-5        | difficulty, one scale across both levels                                                                                                                                                                                |
| `pts`                        | number            | max points in the original exam                                                                                                                                                                                         |
| `value`                      | number            | **hidden chip value** — the task's final numeric answer (or Σ, see `sum`)                                                                                                                                               |
| `sum`                        | boolean           | `value` is the sum of several numbers in the answer, not a single one                                                                                                                                                   |
| `tex`                        | string            | exact value in LaTeX (no `$`)                                                                                                                                                                                           |
| `ans?`                       | string            | full final answer as the key states it, LaTeX                                                                                                                                                                           |
| `s`                          | `L10n`            | short card summary, ≤ ~70 chars, inline `$...$` KaTeX, never reveals the answer                                                                                                                                         |
| `img`                        | string            | crop path under `/tasks/`, e.g. `f2005-P-2005-maj/2.webp`                                                                                                                                                               |
| `w`, `h`                     | number            | crop pixel dimensions (used for aspect-ratio boxes in the viewer)                                                                                                                                                       |
| `year`, `session`, `formula` |                   | exam metadata (`session`: maj/czerwiec/sierpien/probna/diagnostyczna/…; `formula`: 2005/2015/2023 grading-scheme era)                                                                                                   |
| `fig?`                       | boolean           | solving needs the sheet's figure: the English sheet also shows the original crop                                                                                                                                        |
| `opts?`                      | `[tex, answer][]` | closed task: options A-D as [display LaTeX, answer string to type]; shipped only when all four parse to numbers and exactly one matches `value` within the game's tolerance (`data-pipeline/options.py`); 1,095 records |

`conf?: "high" | "medium"` (annotation confidence written by `build_dataset.py`) is declared on `TaskRecord`; after the 2026-09-26 verification pass every shipped record is `"high"`. [repo: src/lib/game/types.ts]

`L10n = { pl: string; en: string }` is the universal bilingual-string shape for game _content_
(tasks, jokers, bosses); it is separate from Lingui, which handles UI _chrome_ strings — see `i18n.md`.

## Run / round state

`RunState` (one saved run) and `RoundState` (the current blind, nested when `phase === "round"`),
both in `src/lib/game/types.ts` — full field list there. Highlights not obvious from the name:

- `RunState.seen: Record<taskId, blindCounter>` — every task dealt this run, so a fresh 40-card deck
  per blind can exclude already-seen tasks (falls back to least-recently-seen when the pool runs low).
- `RunState.known: Record<taskId, RevealKind>` — values the player has learned (by playing the card
  or via a reveal joker/ściąga), independent of `notes`.
- `RunState.notes: Record<taskId, string>` — the player's own typed answer, kept even across cards
  moving between hand/deck/discard.
- `RoundState.pending: { played, result } | null` — set while a play's scoring animation runs;
  surviving a page reload with `pending` still set means the UI replays and resolves it rather than
  losing the play.
- `RunState.plan: BlindPlan` — this ante's Small/Big tag and Boss id, rolled once per ante.
- `RunState.avoid?` — "prefer new tasks" snapshot: base64 bitset over `pool.all` of tasks met in
  earlier runs; `sampleTasks` weights the others ×`NEW_TASK_BOOST` (5). Stored in the run and the
  run history so replaying a seed deals the same cards (`encodeTaskSet`/`decodeTaskSet`, `deck.ts`).
- `RunState.isCheated?` / `cheatMult?` — testing cheat panel was used (never submitted to the
  leaderboard) / pending ×mult for the next hand.
- `RunStats.answeredNotes?` — face-up cards played (each needed an answer); accuracy = correct / answered.
- `RunStats.playTimeMs?` — active play time; `engine.act` adds the gap since `updatedAt`, capped at 60 s, skipped once phase is `gameover`/`won`. Optional so old saves load (treated as 0). Sent as `p_play_time_ms` to `submit_run`; lifetime total comes from `get_my_stats`.

## localStorage keys

All access goes through `src/lib/storage.ts` (`readJson`/`writeJson`, try/catch, in-memory fallback).

| Key                   | Module                         | Shape                                                                                                                                                        | Notes                                                                                                                                                                                                                                                                                                               |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `malatro_run_v1`      | `src/lib/game/engine.ts`       | `{ schemaVersion: 1, run: RunState }`                                                                                                                        | Cleared (not migrated) if it references a task id missing from the current dataset                                                                                                                                                                                                                                  |
| `malatro_settings_v1` | `src/lib/settings.ts`          | `Settings` (locale, volumes, speed, crt, graphics, cursor, motion, tutorial-seen)                                                                            | Merged over `DEFAULT_SETTINGS` + a fresh `detectGraphics()` on load                                                                                                                                                                                                                                                 |
| `malatro_drawings_v2` | `src/lib/drawings.ts`          | `{ order: key[], byTask: Record<key, Stroke[]> }`, key = `taskId` (Polish crop) or `taskId:en` (English sheet); strokes in TaskBoard board units (1600 wide) | LRU-capped at 150 sheets; drawings cover the whole viewer board, scratch only, never graded                                                                                                                                                                                                                         |
| `malatro_progress_v1` | `src/lib/progress.ts`          | `{ schemaVersion: 1, tasks: Record<taskId, {ok, miss, last, isMarked?, firstAt, lastAt}>, runs: RunRecord[] }`                                               | Study progress across runs: per-task right/wrong counters, last result, manual "don't know" mark; up to 300 finished/abandoned runs with seed + `avoid` for replays. Feeds the Collection, the readiness stats and the card stickers. An attempt counts only for face-up cards whose value was not already revealed |
| `malatro_guest_v1`    | `src/contexts/AuthContext.tsx` | `boolean`                                                                                                                                                    | "Play as guest" choice, separate from any Supabase session                                                                                                                                                                                                                                                          |

## Supabase schema

Declarative source in `supabase/schemas/{TABLES,RPC}/`, migrations `20260926120000_init_malatro.sql`,
`20260926150000_run_play_time.sql`. RLS is enabled on both tables; the only
write path into `runs` is the RPC (no insert policy on the table itself).

**Tables**

| Table      | Key columns                                                                                                                                                                                                   | RLS                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles` | `id` (= `auth.users.id`), `slug` (unique, `^[a-z0-9_-]{3,20}$`)                                                                                                                                               | `select` own row only; row is created by an `after insert on auth.users` trigger (`private.profiles_sync_with_users`), slug from `signUp` metadata or the email's local part |
| `runs`     | `id`, `user_id`, `run_id` (client-generated, unique per user), `difficulty`, `ante`, `is_won`, `is_endless`, `total_score`, `best_hand`, `correct_notes`, `hands_played`, `play_time_ms` (0-100 days), `seed` | `select` own rows only; no insert/update policy — writes go through `submit_run`                                                                                             |

**RPCs**

| RPC                                                                                                                                                           | Access                | Behaviour                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submit_run(p_run_id, p_difficulty, p_ante, p_is_won, p_is_endless, p_total_score, p_best_hand, p_correct_notes, p_hands_played, p_seed, p_play_time_ms = 0)` | `authenticated` only  | `security definer`; upserts on `(user_id, run_id)`, keeping the **greatest** ante/score/best-hand/notes/hands-played/play-time across resubmits (so a longer continuation of the same run only ever improves the row) |
| `get_my_stats()`                                                                                                                                              | `authenticated` only  | Caller's `runs_count` + `total_play_time_ms` (sum over own runs); shown under the name in the main menu                                                                                                               |
| `get_leaderboard(p_difficulty, p_limit = 50)`                                                                                                                 | `anon, authenticated` | Best row per player for one difficulty (`distinct on (user_id)`), joined to `profiles.slug`, flags `is_me` via `auth.uid()`; limit clamped to 1-200                                                                   |

Client wiring: `src/lib/supabase/client.ts` builds a typed `SupabaseClient<Database>` only when
`IS_SUPABASE_CONFIGURED`; `requireSupabase()` throws a clear error otherwise. Auth is slug+PIN
mapped to a synthetic email (`<slug>@players.malatro.dev`, password `mlt-<pin>`) —
`src/services/auth/signInWithPin.ts`.

## Data pipeline (raw PDFs → shipped dataset)

```
data-pipeline/manifest.json              one row per exam: CKE URLs, local filenames, page counts
        |  (python data-pipeline/extract.py [exam_id ...])
        v
data-pipeline/out/<exam>/tasks.json      per-task: stem/text/key excerpt + crop image path
data-pipeline/out/<exam>/*.png           raw per-segment crops before stitching
        |  (annotation agents, following data-pipeline/ANNOTATE.md)
        v
data-pipeline/annotations/<exam>.json    include?/value/category/difficulty/summary_pl/summary_en/...
        |  (python data-pipeline/build_dataset.py, i.e. `bun run data:build`)
        v
public/data/tasks.json                  compact TaskRecord[] (this is what the game fetches)
public/data/statements/<exam>.json      {task: statement_en} lazily fetched by the task viewer
public/tasks/<exam>/<task>.webp         final task crops (included tasks only)
data-pipeline/dataset-report.json       counts + validation problems (below)
```

`extract.py` finds task headers (`"Zadanie 7. (0-2)"`, `"Zadanie 14.1."`) and "Informacja do zadań
X-Y" shared-context blocks via regex, splits pages between headers, raster-detects the true content
bottom (ignoring the blank solving grid), and stitches stem + subtask segments into one WebP per
task, using PyMuPDF (`pymupdf`) for PDF parsing/rendering and Pillow for image assembly.

`build_dataset.py` merges `annotations/*.json` onto `out/<exam>/tasks.json`, drops
`low_confidence` and `crop_issue`-flagged entries, cleans copy (ASCII hyphens only), and writes the
three `public/` outputs plus the report. `bun run data:build` passes `--require-verified`: only cards
marked `verified` by the full re-solve pass ship.

**Full verification pass (2026-09-26, `VERIFY-FULL.md`, `ADJUDICATE.md`, `apply_full.py`).** Every
included card (2,477) was re-solved from the crop by an independent agent and compared with the CKE
key; every value change got a second independent solve (all 12 disagreements confirmed the fix).
Result: 33 values fixed, 52 cards excluded (answer typeable without solving, |value| within the
0.011 tolerance of 0, solvers disagreeing, or hand-reviewed in `verify/full/manual-exclude.json`),
3 crop issues, 121 English statements, 299 summaries and 510 topic diacritics corrected, `fig` set
per card.

### Current counts (`data-pipeline/dataset-report.json`, generated 2026-09-26)

| Metric                                   | Value                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exams processed                          | 150 (`data-pipeline/annotations/*.json`, matches `public/tasks/*` subfolders)                                                                                             |
| Tasks annotated                          | 3,626                                                                                                                                                                     |
| Tasks included (shipped)                 | **2,462** (all `verified`)                                                                                                                                                |
| By level                                 | P: 1,965 · R: 497                                                                                                                                                         |
| Excluded (top reasons)                   | expression 311 · interval_or_set 300 · proof 269 · no_numeric 93 · statement 77 · true_false 44 · graph_or_drawing 41 · multi_choice_letters 9 · matching 6 · ambiguous 5 |
| Crop-issue dropped                       | 3                                                                                                                                                                         |
| Unverified dropped                       | 6                                                                                                                                                                         |
| Closed tasks with an A-D picker (`opts`) | 1,095                                                                                                                                                                     |
| Negative-value share                     | 12%                                                                                                                                                                       |
| Value percentiles (p1/p50/p90/p99)       | -19 / 4.15 / 128 / 192,080 (heavy right tail — motivates `VALUE_CAP`, see `game-design.md`)                                                                               |

Category and difficulty breakdowns (`byCategory`, `byLevelCategory`, `byDifficulty`) are in the
report file itself; not duplicated here to keep one owner per fact.

## Related open items

See `open-questions.md` for: the unverified-annotation error rate (formerly: 56 medium-confidence annotations not
manually audited, and the old-formula (2005) shared-figure crop gap that the 2015-formula `INFO_RE`
fix did not cover.
