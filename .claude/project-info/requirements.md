# Requirements — Malatro

Turns the scope in `project-brief.md` and the rules in `game-design.md` into flows, acceptance
criteria and priorities. Owner of MoSCoW + non-functional requirements; owns no game numbers.

## User flows

| Flow | Steps | Acceptance | Source |
| --- | --- | --- | --- |
| Sign in | Auth screen: slug (3-20 chars, `a-z0-9_-`) + PIN (4-32 chars) → auto-registers unknown slugs; "play as guest" skips auth entirely | Wrong PIN on an existing slug is rejected, not silently re-registered; guest mode has no leaderboard | [repo: src/services/auth/signInWithPin.ts] |
| New run | Main menu → PLAY → New Run tab → pick difficulty (carousel of 3) → optional seed → PLAY | Blocked if the mode's eligible pool < 50 tasks; seed reused deterministically if given | [repo: src/screens/MainMenu.tsx] |
| Continue run | Main menu → PLAY → Continue tab (only if a run is saved) | Resumes exact `RunState` from localStorage, including a `pending` scoring animation | [repo: src/lib/game/engine.ts] |
| Blind select | Choose Small/Big (or skip for a tag) or face the Boss | Boss cannot be skipped | [repo: src/components/game/BlindSelect.tsx] |
| Round | View hand (fan), open a card (LMB) to read + solve + type the answer (required to play), select cards (RMB / "+" tab / keys 1-9), reorder by drag, Play (Enter) or Discard (Backspace) | Hand/discard counters never go below 0; a played hand animates fully before the round can advance | [repo: src/components/game/HandArea.tsx], [repo: src/lib/game/run.ts] |
| Cash out | After beating the blind: reward breakdown line by line → continue | Total matches blind reward + unused hands + interest + joker payouts | [repo: src/components/game/CashOut.tsx] |
| Shop | Buy/sell jokers, ściągi, twierdzenia, task cards; buy packs/vouchers; reroll | Cannot buy below required price; sell value = floor(cost/2), min $1 | [repo: src/lib/game/run.ts] |
| Pack open | Pick `picksLeft` choices from a revealed set, or skip | Returns to shop or blind-select per `PackState.returnTo` | [repo: src/components/game/PackOpen.tsx] |
| Game over / win | Ante 8 boss beaten = win (offer Endless); losing a blind = game over | Result auto-submits to the leaderboard once per run (`isSubmitted` flag) if signed in | [repo: src/components/game/GameOver.tsx] |
| Leaderboard | Main menu → RANKING → per-difficulty table | Shows "needs Supabase" message when `IS_SUPABASE_CONFIGURED` is false, not a blank/broken table | [repo: src/screens/MainMenu.tsx] |
| Settings | Options modal (accessible from main menu and in-run): locale, volumes, speed, CRT %, graphics preset, pixel cursor, fullscreen, abandon run | Every toggle persists via `malatro_settings_v1` immediately | [repo: src/lib/settings.ts] |
| How to play | First run auto-opens tutorial modal; replayable from main menu | `hasSeenTutorial` gates the auto-open, not a hard block | [repo: src/screens/MainMenu.tsx] |

## Priorities (MoSCoW)

- **Must** (already implemented, see code): full round/shop/pack loop, task viewer with drawing +
  answers (required to play; symbol buttons √ π ^ / ( ) - , ° %), one language per run chosen on
  the New Run panel (English runs read typeset English statements instead of the Polish crops, plus
  the original figure when the statement mentions one), guest mode, localStorage run persistence,
  graphics presets, fullscreen, code-split bundle.
- **Should**: Supabase leaderboard + auth (code complete; needs a deployed project — see
  `open-questions.md`), sound/music with reduced-motion and volume controls.
- **Could** (from `project-brief.md`, not yet built): endless-mode polish beyond the base loop,
  seeded daily challenge UI, a dedicated collection/stats screen, mobile layout.
- **Won't** (v1): grading player drawings/notes as "correct answers" beyond the note-vs-key check,
  multiplayer, a server backend beyond Supabase auth/leaderboard. [user, project-brief.md]

## Non-functional requirements

| Concern | Requirement | Source |
| --- | --- | --- |
| Performance | 3 graphics presets trade shader resolution/fps for GPU cost; see `design.md` for the exact table | [repo: src/lib/graphics.ts] |
| Reduced motion | OS `prefers-reduced-motion` or the in-game toggle stops every decorative loop (sway, CRT noise, edition shimmer, pack foil) | [repo: src/styles.css] |
| Resilience | Every localStorage read/write is try/catch; a blocked or full store degrades to in-memory, never crashes | [repo: src/lib/storage.ts] |
| Offline / no backend | The game is fully playable with `VITE_SUPABASE_*` unset: guest mode, no login, no leaderboard, no crash | [repo: src/lib/env.ts] |
| i18n | Every UI string ships in PL and EN; strict Lingui compile fails the build on a missing translation | [repo: package.json `i18n:compile`] |
| Data integrity | A saved run referencing a task id no longer in the dataset is dropped rather than loaded broken | [repo: src/lib/game/engine.ts `loadRun`] |
| Bundle size | Code-split: GameScreen/TaskViewer lazy + vendor chunks; startup ~295 KB gzip | [repo: vite.config.ts], [repo: src/screens/lazy.ts] |
| Browser support | Requires WebGL (swirl background) and the Fullscreen API; no documented fallback if either is missing | Unknown — see `open-questions.md` |
| Accessibility beyond motion | No documented a11y pass (contrast, screen reader, keyboard-only shop) | Unknown — see `open-questions.md` |
| Licensing | Personal, non-commercial project; no compliance requirements (GDPR etc.) apply | [user, project-brief.md] |

## Out of scope reminders

Proof/true-false/interval/set/matching/symbolic-expression tasks are excluded from the card pool by
design (`data-pipeline/ANNOTATE.md`), not a bug — the game only works with tasks that reduce to a
number. See `data-model.md` for the full include/exclude rules.
