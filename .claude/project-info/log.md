# Log — Malatro

Append-only. Format: `## [YYYY-MM-DD] <area> | <what changed and why>`.

## [2026-09-26] wiki | Initial `.claude/project-info/` wiki + research

Wrote `project-brief.md` and `game-design.md` from the user's brief, plus deep research in
`research/`: `context-analysis.md` (patterns to reuse from the `context/` reference monorepo),
`balatro-mechanics.md` and `balatro-visuals-and-assets.md` (Balatro's own rules/palette/motion/audio,
sampled from screenshots and community wikis), and `reactbits-balatro.tsx` (the MIT+Commons-Clause
background shader component, saved verbatim for adaptation).

## [2026-09-26] data-pipeline | Built and annotated the matura task dataset (150 exams)

Built the CKE exam manifest (`data-pipeline/manifest.json`), wrote `extract.py` (PyMuPDF-based PDF
cropping: task-header detection, raster content-bottom trim, stem+subtask stitching) and
`build_dataset.py` (merge annotations onto extracted crops, clean copy, write `public/data/tasks.json`
+ `statements/` + `tasks/*.webp` + `dataset-report.json`). Ran annotation agents over all 150 exams
per `ANNOTATE.md`'s include/exclude and value rules, producing 3,626 annotated tasks -> 2,520 shipped
cards. Findings and edge cases tracked in `audit-notes.md` as they came up.

## [2026-09-26] engine + UI | Built the game engine and UI

Implemented the framework-free `GameEngine` (`src/lib/game/engine.ts`) with rule functions in
`run.ts`, scoring/hands/deck logic, and content tables (jokers, ściągi, twierdzenia, bosses,
vouchers, tags). Built the full screen flow (auth, main menu, blind select, round, cash out, shop,
pack open, game over/win) plus the fullscreen task viewer with freehand drawing and answer notes.
Wired Supabase (schema + RPCs + slug/PIN auth), Lingui i18n (PL default, EN switch), Howler audio,
and the React Bits-derived swirl background.

## [2026-09-26] fixes | Stage centering, viewer scrim, graphics presets, shader grading, balance, INFO_RE

Same-day follow-up fixes after initial playtesting of the built UI:

- Fixed the 1920x1080 stage not centering correctly in the browser window (letterboxing bug); the
  stage now centers via a flex wrapper around the scaled layer (`Stage.tsx`).
- Fixed the task-viewer modal scrim bleeding into the letterbox bars outside the stage.
- Added the three graphics presets (high/medium/low: swirl resolution + fps + viewer blur + sheen/
  noise/sway toggles), fullscreen support (F key + a menu/options button), and pixel cursors
  (`scripts/make-cursors.py` + `data-cursor` CSS variable swap).
- Moved the CRT-style colour grading (contrast/saturation) from a CSS `filter` on the whole scene
  into the background shader itself, to avoid recompositing every layer every frame.
- Switched idle card/logo sway from JS-driven motion values to a plain CSS `@keyframes` class
  (`.sway`), so it can be cut for free by the `low` graphics preset and reduced-motion.
- Retuned the economy/scoring balance constants (`src/lib/game/constants.ts`) using
  `scripts/balance.ts`.
- Fixed `INFO_RE` (the "Informacja do zadań X-Y" shared-figure regex in `extract.py`) to match the
  2015-formula period-separated phrasing ("8.–10."); re-extracted 13 affected exams and cleared their
  `crop_issue` flags, then rebuilt the dataset to 2,520 shipped tasks. See `data-model.md` and
  `open-questions.md` for the remaining old-formula (2005) gap this fix did not cover.

## [2026-09-26] wiki | Filled in the remaining wiki pages

Extended the wiki (kept `project-brief.md`/`game-design.md`/`research/` as-is) by reading the actual
code and writing: `requirements.md`, `technologies.md`, `conventions.md`, `design.md`,
`data-model.md`, `assets.md`, `i18n.md`, `open-questions.md`, and this `README.md` index. Routed from
a new root `CLAUDE.md`, and wrote a root `README.md` for a first-time developer (quick start, scripts,
data-pipeline rebuild steps, controls, credits). Found two stale facts in `game-design.md` that the
code disproved (`VALUE_CAP` is 25, not the stated 50; the balance simulation lives at
`scripts/balance.ts`, not `tests/balance.test.ts`) and corrected both in place, since they were
factual errors rather than gameplay decisions. Logged everything else undecided in
`open-questions.md`.

## [2026-09-26] lint | 2 findings: fixed stale VALUE_CAP/test-path facts in game-design.md

Ran a wiki-lint pass over all `.claude/project-info/*.md`. Findings: (1) `game-design.md` stated the
per-card chip cap as 50 when `src/lib/game/constants.ts`'s `VALUE_CAP` is 25 — fixed in place, code
wins for a code fact. (2) `game-design.md` cited the balance simulation as `tests/balance.test.ts`,
which does not exist — corrected to `scripts/balance.ts` (run via `bun scripts/balance.ts`, not
`bun test`). Removed the two now-answered entries from `open-questions.md` and updated the stale
cross-reference in `conventions.md`. No other cross-file contradictions, leftover placeholders, or
missing files found.

## [2026-09-26] gameplay | answers required, no answer money [user]
Playing a face-up card now requires a typed answer; wrong = 0 chips, no card effects, not counted in
the hand type. Base $1 per correct note removed; note jokers/vouchers retuned (see game-design.md).
Viewer: English runs show the translated statement (original figure appended when referenced), no
translation toggle; drawing covers the whole board incl. the dark margin (drawings v2); symbol
buttons under the answer input. Language chosen on the New Run panel.

## [2026-09-26] data | second-opinion verification
172 doubtful/random answers re-solved by agents (`data-pipeline/VERIFY.md`, results in
`data-pipeline/verify/`): 146 ok, 10 fixed, 16 excluded as ambiguous; random sample of 60
"high-confidence" answers had 4 problems (~6%). `data-pipeline/consistency.py` added (automated
cross-checks); shared-figure regex extended to "10. i 11." and 2005-style "W zadaniach 8. i 9.".

## [2026-09-26] perf | code splitting
GameScreen and TaskViewer lazy-loaded (prefetched on idle), vendor chunks (react, motion, katex,
supabase, vendor): startup ~295 KB gzip vs ~416 KB single bundle.

## [2026-09-26] lint | 7 findings: stale counts 2520->2505, conf gap resolved, bundle/code-split facts, boss mult, answer wording; 2 open questions updated/removed

## [2026-09-26] robustness | ErrorBoundary (reload / reset saved run), WebGL-less CSS gradient fallback, meta description/OG tags; open questions #6 #7 #9 #15 resolved
