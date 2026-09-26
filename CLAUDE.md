# Malatro

Project knowledge lives in `.claude/project-info/` — read `.claude/project-info/README.md` first; it
indexes every page and has a routing table ("task touches X -> read page Y").

Most-used pages:

- `.claude/project-info/game-design.md` — gameplay rules, scoring, economy numbers
- `.claude/project-info/conventions.md` — code style, folder rules, data-layer patterns, definition of done
- `.claude/project-info/technologies.md` — stack, versions, commands, env vars, repo layout
- `.claude/project-info/design.md` — palette, fonts, background shader, graphics presets, motion
- `.claude/project-info/data-model.md` — task/run data shapes, Supabase schema, data pipeline

Also see `.claude/project-info/open-questions.md` before assuming something undocumented is
decided, and append to `.claude/project-info/log.md` after any change that affects the wiki.

Do not read real `.env`/`.env.local` files or print secret values — env vars are named only in
`.claude/project-info/technologies.md` and `.env.example`.
