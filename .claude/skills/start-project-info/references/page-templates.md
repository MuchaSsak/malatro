# Page templates for `.claude/project-info/`

Starting structures for each page. Drop sections that don't apply, keep headings stable so later
sessions know where to look, and replace every `<…>` with real content or `Unknown`. Source tags:
`[user]` `[repo: path]` `[file: name]` `[web: url]` `[research]` `[assumption]`.

## Contents

- README.md · project-brief.md · requirements.md · technologies.md · conventions.md
- open-questions.md · log.md
- audience.md · brand.md · competitors.md
- design-references.md · design.md · research/inspirations/<slug>.md
- assets.md · structure.md · api.md · data-model.md · compliance-and-data.md
- monetization.md · analytics.md · seo.md · i18n.md · operations.md

---

## README.md

```markdown
# <Project> — project info (read this first)

> What this project is, in one sentence. Last updated <date>.

## Routing: read only what your task needs

| Task touches | Read |
| --- | --- |
| goals, scope, priorities | project-brief.md, requirements.md |
| stack, commands, env, deploy | technologies.md |
| code style, git, definition of done | conventions.md |
| <UI / look & feel> | design.md (+ design-references.md) |
| <…one row per page that exists…> | |
| anything unresolved | open-questions.md |

## Pages
- `project-brief.md` — <one line>
- …

History: `log.md`.
```

## project-brief.md

```markdown
# Project brief

## One-liner
## Problem and why now
## Goal and success metrics   (| metric | target | by when | source |)
## Scope
- In (v1):
- Later:
- Out of scope:
## Constraints   (budget, deadline, required tech, team, legal, locales)
## Stakeholders and decision rights   (who approves what)
## Risks
```

## requirements.md

```markdown
# Requirements

## Users and roles
## Features   (| id | feature | priority must/should/could | acceptance criteria | status |)
## Key flows   (numbered steps per flow; edge cases + error states)
## Non-functional   (performance budgets, accessibility level, security, browsers/devices, uptime)
## Explicitly not building
```

## technologies.md

```markdown
# Technologies

| Layer | Choice | Version | Why | Source |
| --- | --- | --- | --- | --- |
| language / framework / styling / state / DB / auth / hosting / email / analytics / testing | | | | |

## Repo layout   (top folders and what lives where)
## Commands   (dev, test, lint, build, deploy — exact)
## Environment variables   (NAME | purpose | where set | required?)  — names only, never values
## External services and limits   (free-tier terms, quotas, commercial-use restrictions)
## Decisions   (date | decision | alternatives rejected | reason)
```

## conventions.md

```markdown
# Conventions
## Code style and naming
## Folder rules   (where new code goes)
## Error handling, logging (what must never be logged)
## Testing bar
## Git   (branches, commit format, review)
## Definition of done   (checklist)
## Do NOT
```

## open-questions.md

```markdown
# Open questions

| # | Question | Blocks | Who can answer | Default if unanswered | Status |
| --- | --- | --- | --- | --- | --- |
```

## log.md

```markdown
# Log (append-only, newest last)

## [YYYY-MM-DD] init | Created project-info: <pages>. Sources: <user brief, repo, N research sources>.
```

## audience.md

```markdown
# Audience
## Primary segment   (who, context, job-to-be-done, triggers, objections, channels)
## Secondary segments
## Not for
## Evidence   (each claim with a source; inferred items marked [assumption])
```

## brand.md

```markdown
# Brand
## Identity   (name, legal entity, one-line positioning, story — facts only)
## Voice and tone   (3 adjectives, do/don't examples, formality/address form per language)
## Microcopy rules   (CTA style, punctuation rules, words to avoid, claims never to make)
## Logo, colors, fonts provided   (→ assets.md)
```

## competitors.md

```markdown
# Competitors
| Name | URL | Positioning | Pricing | Strengths | Weaknesses | Source/date |
## Where we differ
```

## research/inspirations/<slug>.md

```markdown
# <Source name> — <url or Mobbin link>
Studied: <date> · Category: <same-category | same-feel> · Platform: <web/iOS/Android>
## What works   (layout, hierarchy, spacing rhythm, density text vs visuals, motion)
## Steal (as a pattern, re-expressed in our tokens)
## Skip
## Screenshots   (files in this folder; research only, never shipped)
```

## design-references.md

```markdown
# Design references (synthesis of research/inspirations/)
## Direction   (category + mood; 3 words; what it must never look like)
## Patterns we adopt   (| pattern | seen in | why it fits us |)
## Per section / screen   (hero, nav, lists, forms, empty states… → reference patterns)
## Anti-patterns   (generic template looks to avoid)
```

## design.md

```markdown
# Design system
## Art direction   (mood, signature element — the one memorable thing)
## Color tokens   (| token | value | use | contrast notes |)  light + dark if both
## Typography   (families + licences, scale, weights, line heights)
## Spacing, radii, shadows, grid, breakpoints
## Components   (what exists / source library + licence / states)
## Motion   (durations, easing, reduced-motion rule)
## Imagery   (style, treatment, what AI imagery may and may not depict)
## Accessibility   (target level, focus, contrast, touch targets)
## Do / Don't
```

## assets.md

```markdown
# Assets
## Sourcing policy   (allowed sources; forbidden sources; who approves; AI generation yes/no)
## Inventory
| File | What | Source | Licence / rights holder | Allowed use | Notes |
## Missing / needed   (→ open-questions.md)
```

## structure.md

```markdown
# Structure
## Sitemap / screen map   (tree)
## Per page / screen   (purpose, sections in order, content source, CTA, forms, embeds)
## Navigation, footer, legal pages
```

## api.md

```markdown
# API and integrations
## Endpoints   (| method | path | auth | request | response | errors |)
## Auth model
## External services   (| service | purpose | data sent | limits | docs |)
## Rate limits, idempotency, versioning
```

## data-model.md

```markdown
# Data model
## Entities   (| table | purpose | key columns | personal data columns | owner |)
## Relationships
## Access rules   (who can read/write what)
## Migrations workflow
```

## compliance-and-data.md

```markdown
# Compliance and data (facts, not legal advice)
## Data touchpoints   (| surface | data collected | stored where | purpose | legal basis [Unknown unless given] |)
## Cookies and browser storage   (| name/key | set by | purpose | category | lifetime |)
## Processors / third parties   (| vendor | purpose | data | region [verify] |)
## Consent mechanisms   (what is actually built)
## Retention and deletion   (only what is decided; else Unknown)
## Regions / regulations in scope
## Required legal pages
```

## monetization.md

```markdown
# Monetization
## Model   (subscription / one-off / usage / ads / free)
## Plans and prices   (| plan | price | billing | includes | source |)
## Promises made to customers   (SLAs, refunds, trials — exact wording + where published)
## Payment provider and flows
```

## analytics.md

```markdown
# Analytics
## Questions we need answered
## Events   (| event | when | properties (no PII) |)
## Funnels and KPIs
## Tools, consent gating, retention
```

## seo.md

```markdown
# SEO
## Target queries per page
## Metadata rules   (title/description length, OG, structured data)
## Locales and URLs
## Content plan
```

## i18n.md

```markdown
# Internationalization
## Locales   (default first) and URL scheme
## Translation workflow and tools
## Formatting rules   (dates, currency, plurals, address forms)
```

## operations.md

```markdown
# Operations
## Environments   (dev / preview / prod: URLs, who can deploy)
## Deploy steps
## Monitoring and alerts
## Backups and restore
## Runbooks   (common incidents → fix)
```
