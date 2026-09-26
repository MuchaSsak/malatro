# Malatro — project-info wiki

A `.claude/project-info/` wiki: read the page that owns the fact you need instead of re-scanning the
repo. Extend-mode conventions: one owner per fact, source tags (`[user]`, `[repo: path]`,
`[research]`, `[assumption]`), `Unknown` over invented, `open-questions.md` for every gap.

## Pages

| Page | Owns |
| --- | --- |
| `project-brief.md` | Vision, goal, scope in/out, constraints, stakeholders, risks |
| `game-design.md` | All gameplay rules and numbers: card anatomy, hand types, scoring pipeline, run structure, economy |
| `requirements.md` | User flows + acceptance criteria, MoSCoW priorities, non-functional requirements |
| `technologies.md` | Stack + versions, commands, env var names, repo layout |
| `conventions.md` | Code style, naming, folder rules, data-layer patterns, definition of done |
| `design.md` | Palette tokens, fonts, stage/letterboxing, background shader, CRT overlay, cursors, graphics presets, motion rules |
| `data-model.md` | `TaskRecord`, run/round state shapes, localStorage keys, Supabase schema + RPCs, data pipeline stages and current dataset counts |
| `assets.md` | Inventory of shipped fonts/audio/cursors/task crops, licences, sourcing policy |
| `i18n.md` | Lingui workflow (UI chrome) vs. `L10n` bilingual content, PL default + EN switch, math terminology glossary pointer |
| `open-questions.md` | Every `Unknown` and code-vs-wiki contradiction found, what each blocks |
| `log.md` | Append-only history of what changed and why |
| `research/context-analysis.md` | Coding patterns to reuse from the `context/` reference monorepo |
| `research/balatro-mechanics.md` | Balatro's own rules/numbers (reference, not Malatro's actual numbers — see `game-design.md`) |
| `research/balatro-visuals-and-assets.md` | Balatro's palette/typography/motion/audio research + full asset provenance |
| `research/reactbits-balatro.tsx` | Verbatim upstream background-shader component (see `design.md` for the adapted version) |

## Routing table — "my task touches X, so I read Y"

| Task touches | Read |
| --- | --- |
| Game rules, scoring, hand types, economy numbers | `game-design.md` |
| A new feature, flow, or "is this in scope" | `requirements.md`, then `project-brief.md` |
| Adding a dependency, a script, env vars, folder placement | `technologies.md` |
| Component/hook/service structure, naming, query keys, testing | `conventions.md` |
| Colours, fonts, the shader background, CRT/cursor/graphics presets, card motion | `design.md` |
| `TaskRecord` fields, run/round state, localStorage, Supabase tables/RPCs, the data pipeline | `data-model.md` |
| Fonts/audio/cursors/task-crop files, licences, "can I use asset X" | `assets.md` |
| Adding or changing any UI string, or task-content translation | `i18n.md` |
| "Is this already known/decided", blockers, contradictions | `open-questions.md` |
| "What happened recently and why" | `log.md` |
| Matching Malatro's look to real Balatro from screenshots | `research/balatro-visuals-and-assets.md`, `research/balatro-mechanics.md` |
| Reusing patterns from the reference monorepo (`context/`) | `research/context-analysis.md` |

Root pointers: `../../CLAUDE.md` (session routing) and `../../README.md` (developer quick start).
