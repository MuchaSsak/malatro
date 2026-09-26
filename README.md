# Malatro

A Balatro-style roguelike deckbuilder that runs in the browser, where every card is a real Polish
matura (high-school exit exam) math task. A card's chip value is hidden until you solve the task —
knowing your hand means knowing the math.

Full project docs (gameplay rules, stack, conventions, assets, data pipeline) live in
[`.claude/project-info/README.md`](.claude/project-info/README.md).

## Quick start

```bash
bun install
bun run dev
```

Opens on `http://localhost:5173`. Without Supabase configured the game runs fully in **guest mode**
(no login, no leaderboard, everything else works).

### Optional: Supabase (login + leaderboard)

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker.
2. `supabase start` — runs the local stack and applies `supabase/migrations/*` automatically; it
   prints the local API URL and anon/publishable key.
3. Copy `.env.example` to `.env.local` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Email confirmation is already disabled for the **local** stack (`supabase/config.toml`). If you
   instead link a **hosted** Supabase project, disable "Confirm email" under Authentication settings
   there too — this project's login is a short slug + PIN, not an email flow.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the Vite dev server |
| `bun run build` | Compile translations, typecheck, then production build |
| `bun run preview` | Preview the production build locally |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` / `bun run fix` | ESLint check / autofix |
| `bun run fmt` | Prettier write |
| `bun test` | Run unit tests (`bun:test`) |
| `bun run check` | typecheck + lint + test (run this before considering a change done) |
| `bun run translate` | Extract + compile Lingui i18n catalogs (see the i18n workflow below) |
| `bun run data:build` | Rebuild `public/data/tasks.json` from the annotated task pool |
| `bun run supabase:types` | Regenerate `src/lib/supabase/database.types.ts` from the local DB |
| `bun run hooks:install` | Point git at `.githooks/` (not yet populated — see the wiki's open questions) |

## Rebuilding the task dataset

The shipped dataset (`public/data/tasks.json`, `public/data/statements/`, `public/tasks/*.webp`) is
built from raw CKE exam PDFs, which are **gitignored** (`data-pipeline/raw/`) and not part of this
repo. To rebuild from scratch you need the raw PDFs plus:

```bash
pip install pymupdf pillow
python data-pipeline/extract.py            # crop tasks out of the PDFs -> data-pipeline/out/
# annotate data-pipeline/out/<exam>/tasks.json -> data-pipeline/annotations/<exam>.json
# (see data-pipeline/ANNOTATE.md for the include/exclude/value rules)
python data-pipeline/build_dataset.py       # == `bun run data:build`
```

This merges `data-pipeline/annotations/*.json` onto the extracted crops and writes the three
`public/` outputs plus `data-pipeline/dataset-report.json` (counts + validation problems). See
[`.claude/project-info/data-model.md`](.claude/project-info/data-model.md) for the full pipeline and
current dataset counts (2,520 tasks from 150 exams).

Regenerate the pixel cursors with `python scripts/make-cursors.py` if you change them.

## Controls

| Input | Action |
| --- | --- |
| Left click a card | Open the fullscreen task viewer (read the task, draw scratch work, type your answer) |
| Right click a card / hover "+" tab / keys **1-9** | Select or deselect a card for play |
| Drag a card | Reorder your hand |
| **Enter** | Play the selected cards |
| **Backspace** / Delete | Discard the selected cards |
| **F** | Toggle fullscreen |
| **Esc** | Close the task viewer |

## Credits & licences

Personal, non-commercial project. Not affiliated with LocalThunk/Playstack; no Balatro asset (font,
sprite, sound, music) is used.

- Font **m6x11 / m6x11plus** by Daniel Linssen — free to use with attribution.
- Font **Pixelify Sans** — SIL OFL 1.1.
- SFX — **Kenney**, CC0.
- Music **"Hep Cats"** and **"Chill Wave"** by Kevin MacLeod (incompetech.com) — CC BY 4.0, credited
  in-game under Options.
- Background shader adapted from **React Bits "Balatro"** (`DavidHDev/react-bits`) — MIT + Commons
  Clause; itself a port of LocalThunk's original Balatro paint-swirl shader.
- Task content sourced from official **CKE** (Centralna Komisja Egzaminacyjna) matura exam PDFs and
  answer keys, used for personal, non-commercial study purposes.

Full inventory, file paths and per-asset licence terms: [`.claude/project-info/assets.md`](.claude/project-info/assets.md).
