---
name: start-project-info
description: "Kick off any project by building its knowledge base FIRST: a `.claude/project-info/` wiki holding the brief, audience, requirements, tech stack, research, design rules, assets inventory, compliance notes and open questions, all gathered from the user, the repo, provided files and web/design research before any code is written. Works for any kind of project (web app, landing page, mobile app, API, CLI, library, data/ML, game, content site, internal tool). Use this whenever the user starts a new project or a major new phase, says 'start project info', 'set up the wiki', 'gather context/research first', 'let's plan before coding', 'collect assets and design rules', 'onboard this repo', or drops a pile of briefs/links/screenshots and wants them organized — even if they don't name the folder."
argument-hint: "[optional: one-line project idea, repo path, URLs, or files to start from]"
disable-model-invocation: true
---

# /start-project-info

Build the project's memory before building the project. The output is a `.claude/project-info/`
wiki that any later session (or agent) reads instead of re-asking the user, re-scanning the repo or
re-doing research. Good context up front is what separates a bespoke result from a generic one, and
it is far cheaper to fix a wrong assumption in a markdown file than in shipped code.

The workflow is **gather → decide → write → verify**. Don't write code in this skill; its only
products are the wiki, an assets folder, and a routing pointer in `CLAUDE.md`.

## Principles (the why behind every step)

- **Facts carry their source.** Tag anything non-obvious: `[user]`, `[repo: path]`,
  `[file: name]`, `[web: url]`, `[research]`, `[assumption]`. A later reader must be able to tell a
  decision the user made from a guess you made, because guesses get revisited and decisions don't.
- **Unknown beats invented.** A missing fact is written `Unknown` and added to `open-questions.md`.
  Inventing a price, a stat, a customer quote or a legal basis poisons every later step that trusts
  the wiki.
- **One owner per fact.** Each fact lives in exactly one page; other pages link to it. Duplicated
  facts drift apart and then contradict each other.
- **Dense, not long.** Tables and short bullets. A page someone skims in 60 seconds gets read; a
  400-line essay doesn't. Aim for 40-150 lines per page.
- **Only the pages the project needs.** A CLI needs no brand page; a landing page needs no API
  contract. Adding empty ceremony pages makes the real ones harder to find.
- **Secrets never enter the wiki.** Name env vars, never values. Don't read real `.env` files or
  credential stores; use `.env.example` and ask the user where secrets live.
- **Research informs, never copies.** Screenshots and references are studied for patterns; no
  design, copy or code is reproduced 1:1 (copyright, and it makes the result generic).

## Phase 0 — Read the room (no questions yet)

1. Check whether `.claude/project-info/` already exists. If it does, read its `README.md`,
   `log.md` and `open-questions.md` and switch to **extend mode**: keep what's there, fill gaps,
   mark contradictions, and log every change. Never silently overwrite a user decision.
2. Scan what the repo already answers (cheap, targeted reads, not a full crawl):
   - manifests: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `pom.xml`,
     `*.csproj`, `pubspec.yaml`, `composer.json`, `Dockerfile`, CI configs, `.env.example`;
   - existing docs: `README*`, `CLAUDE.md`, `AGENTS.md`, `docs/`, ADRs, `PLAN.md`, issue templates;
   - structure: top-level folders, the main entry points, any schema/migration folders.
3. Collect everything the user handed over in `$ARGUMENTS` or the conversation: briefs, URLs,
   screenshots, PDFs, brand files, spreadsheets, old sites.
4. Classify the project (it can be several): see the module table in Phase 3. This decides which
   questions matter and which pages get written.

## Phase 1 — Intake interview (short, batched, only real gaps)

Ask only what Phases 0 couldn't answer, in **one or two batches**, not a drip of single questions.
Use the AskUserQuestion tool when available (multiple choice with a recommended default is faster
for the user); otherwise a compact numbered list. Offer "skip / decide later" for everything — a
skipped answer becomes an `Unknown`, not a blocker.

Core questions (pick the ones still open):

| Topic | Ask |
| --- | --- |
| Goal | What is this, in one sentence? What does success look like in 3 months (a number if possible)? |
| Who | Who uses it / buys it? Who is it explicitly NOT for? |
| Scope | Must-haves for v1; nice-to-haves; hard out-of-scope. Deadline? |
| Constraints | Budget, required stack/hosting, team size, compliance (GDPR, HIPAA, accessibility), languages/locales |
| Inputs | Existing site/app/repo? Brand assets (logo, colors, fonts)? Content (copy, photos, docs)? Who owns their rights? |
| Taste | 2-5 products/sites they admire (and why), anything they hate, the feel in three words |
| Business (if commercial) | Pricing/monetization, competitors, what they promise customers |
| Working style | Who approves decisions? Where do secrets live? Git/branch conventions? |

If the user says "just figure it out", proceed on sensible defaults and record each default as
`[assumption]` with the reason.

## Phase 2 — Gather research (parallel where possible)

Run independent gathering in parallel (subagents if available) and write raw findings to
`.claude/project-info/research/` as you go, so nothing is lost if the session ends.

- **Existing product / old site**: crawl it (WebFetch, Playwright or Firecrawl if available).
  Capture structure (pages, nav, flows), real content and microcopy verbatim, contact facts, and a
  short list of its real flaws. Its look is a reference for brand continuity, not a template.
- **Domain & competitors**: 3-6 comparable products. Per competitor: positioning, pricing if public,
  standout features, weaknesses. Cite URLs.
- **Audience**: where they are, what they search for, their objections. Evidence over persona
  fiction; label anything inferred.
- **Tech**: official docs for the chosen or likely stack (current versions, breaking changes,
  hosting limits, free-tier terms if commercial use matters). Note versions and the date checked.
- **Design research** (only if there is a UI): use the Mobbin MCP if connected (real shipped
  screens/flows, filter by platform), else Playwright screenshots of strong references and gallery
  sites (Awwwards, Land-book, Godly, SiteInspire, Dribbble for components). Study 10+ examples
  across two axes — **same category** and **same feel** — and keep only the best. One file per
  studied source in `research/inspirations/<slug>.md` (+ screenshots): what works in layout,
  hierarchy, density, motion, and what to steal vs skip.
- **Legal/compliance signals**: personal data collected, cookies/trackers, regions served,
  regulated sectors, licences of anything third-party.

Stop researching when new sources stop changing the decisions. Record what you did not get to.

## Phase 3 — Write the wiki

Always write the **core pages**; add **modules** that match the project type. Templates for every
page are in `references/page-templates.md` — read it now and follow the structure, dropping
sections that don't apply.

**Core (every project):**

| Page | Owns |
| --- | --- |
| `README.md` | the index + routing table: "task touches X → read page Y"; one-line purpose per page |
| `project-brief.md` | vision, goal, success metrics, scope in/out, constraints, deadline, stakeholders |
| `requirements.md` | features / user flows / acceptance criteria, priorities (must/should/could), non-functional requirements |
| `technologies.md` | stack + versions, hosting, services, env var NAMES, commands (dev/test/build/deploy), repo layout |
| `conventions.md` | code style, naming, folder rules, git/commit rules, testing bar, "definition of done" |
| `open-questions.md` | every `Unknown`, who can answer it, what it blocks |
| `log.md` | append-only: `## [YYYY-MM-DD] <area> | <what changed and why>` |

**Modules (pick what applies):**

| Project has… | Add |
| --- | --- |
| customers / a market / a brand | `audience.md`, `brand.md` (identity, voice, tone, microcopy rules, words to avoid), `competitors.md` |
| a UI | `design-references.md` (synthesis of `research/inspirations/`), `design.md` (art direction, color/type/spacing tokens, components, motion, imagery, signature element, do/don't) |
| media, docs, fonts, icons | `assets.md` (inventory + sourcing policy + licences) and the `assets/` folder (see Phase 4) |
| pages / screens / navigation | `structure.md` (sitemap or screen map, per-page sections, CTAs, forms, embeds) |
| an API / integrations | `api.md` (endpoints/contracts, auth, errors, rate limits, external services) |
| a database | `data-model.md` (entities, columns holding personal data, ownership, migrations workflow) |
| personal data, cookies, payments, regulated sector | `compliance-and-data.md` (data touchpoints, storage, processors, consent, retention, regions — facts only, never a compliance claim) |
| revenue | `monetization.md` (model, plans, prices, trials, payment provider, promises made to customers) |
| analytics / KPIs | `analytics.md` (events, funnels, tools, privacy-safe properties) |
| SEO / content marketing | `seo.md` (keywords, locales, metadata rules, content plan) |
| multiple languages | `i18n.md` (locales, default, URL scheme, translation workflow) |
| infra / ops | `operations.md` (environments, deploy steps, monitoring, backups, runbooks) |

Write order matters: brief → audience/brand → requirements → structure → technologies →
design-references → design → assets → compliance → the rest → README last (it indexes what exists).

## Phase 4 — Assets

Create `assets/` at the repo root (or where the stack expects static files — record the choice).

- Subfolders by kind: `brand/` (logos, colors, fonts), `images/`, `documents/`, `references/`
  (screenshots used for research — **never shipped** in the product).
- Name files so the name says what they are (`logo-horizontal-dark.svg`, not `IMG_2231.png`).
- Every asset gets a row in `assets.md`: file, what it is, source, **licence / rights holder**,
  where it may be used, quality notes (e.g. "low-res, needs a better original").
- Write the **sourcing policy**: which sources are allowed (client-provided, scraped from their own
  old site, generated by AI, licensed stock, placeholders), which are not, and who decides.
- Fonts and icon sets: record the licence (OFL, Apache, MIT, commercial) and keep the licence file
  next to the font. If a licence can't be verified, it doesn't go in.

## Phase 5 — Verify and hand off

1. **Lint the wiki** yourself: contradictions between pages, facts without a source, placeholders
   (`TODO`, `TBD`, `lorem`), dead links between pages, questions already answered elsewhere. Fix
   trivial drift; list the rest in `open-questions.md`.
2. **Route it from `CLAUDE.md`** (create one if absent): a short section pointing at
   `.claude/project-info/README.md` and naming the 3-5 pages most tasks need. Use plain paths
   rather than `@imports` — imports inline the whole wiki into every session and waste context;
   plain paths let a session read only what the task needs.
3. Append the session to `log.md`.
4. Report back to the user, briefly:
   - the pages written (one line each) and the assets collected;
   - the decisions you made on their behalf (`[assumption]` items) so they can overrule them;
   - the top open questions, ordered by what they block;
   - the suggested next step (usually: answer the blocking questions, then start building from
     `requirements.md`).

## Quality check (run before reporting)

- [ ] Every page has a clear owner topic; no fact appears in two pages.
- [ ] Every non-obvious fact has a source tag; every guess is marked `[assumption]`.
- [ ] No invented numbers, quotes, reviews, prices, legal bases or retention periods.
- [ ] No secret values anywhere; env vars named only.
- [ ] Research files cite URLs and dates; inspirations say what to steal AND what to skip.
- [ ] Every asset has a licence/rights line or is flagged in `open-questions.md`.
- [ ] Pages that don't apply were not created; `README.md` lists exactly the pages that exist.
- [ ] `CLAUDE.md` routes to the wiki with plain paths.
- [ ] `log.md` has today's entry.
