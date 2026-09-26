# Project brief — Malatro

## One-liner
Balatro-style roguelike deckbuilder in the browser where every card is a real Polish matura
math task (CKE exam); a card's hidden chip value is the task's final numeric answer. [user]

## Problem and why now
- Personal fun project: make matura math practice feel like Balatro — solve tasks to know which
  cards are worth playing, dodge negative answers, build joker synergies. [user]
- Not commercial, private use; grabbing third-party assets is acceptable to the owner. [user]

## Goal and success metrics
| metric | target | source |
| --- | --- | --- |
| Look & feel | "pretty much exactly like Balatro" (layout, CRT/swirl bg, pixel font, juicy scoring) | [user] |
| Task pool | all CKE matura math tasks (P + R; main, dodatkowa, poprawkowa, próbne) with a numeric answer | [user] |
| Answer accuracy | every card value traced to the official key (zasady oceniania) + cross-solved | [assumption] |
| Friction | login = short slug + short password/PIN, auto-register, straight into the game | [user] |

## Scope
- In (v1): 5 difficulty modes (TRYWIALNE / TRYWIALNE+ / CIEKAWE / CIEKAWE+ / CIEKAWE++), ante 1–8 with Small/Big/Boss
  blinds, boss debuffs, chips × mult scoring, hand types, jokers, consumables, planet-like
  hand leveling, booster packs, vouchers, shop with task cards, money/interest, fullscreen task
  viewer with persistent freehand drawing, drag-reorder hand, PL/EN switch, Supabase
  auth + leaderboard, sound + music, run save/continue. [user + assumption]
- Later: endless mode, seeded runs/daily challenge, collection screen stats, mobile polish.
- Out of scope: grading user work (drawings are scratch only), Next.js, multiplayer. [user]

## Constraints
- Stack: Vite + React SPA (no Next.js); three.js/OGL optional; Supabase for auth/leaderboard. [user]
- Coding patterns follow the sample repo in `context/` (gitignored). [user] → `research/context-analysis.md`
- Language: Polish first; English toggle must use accurate math terminology. [user]

## Stakeholders and decision rights
- Owner / sole player & approver: the user (mateusz). [user]

## Risks
| risk | mitigation |
| --- | --- |
| Wrong card values (bad answer extraction) | official key + independent solve per task, confidence flag, validator script |
| Card values unbounded (e.g. 1024, −500) break balance | chip clamp per card (see game-design.md) |
| PDF layout variance across 2010–2026 | crop by header regex + raster content detection; manual spot checks |
| Long solve time per card makes runs slow | save/continue runs; balance so ~40–60% of cards need solving |
| Asset licences (Balatro look-alike) | private use only; CC0 audio preferred; never ship Balatro's own files |
