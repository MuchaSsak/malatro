# Game design — Malatro

Owner of all gameplay rules and numbers. Balatro reference numbers → `research/balatro-mechanics.md`.
Numbers marked _(tuned)_ come from `scripts/balance.ts` simulation on the real task pool (run
manually via `bun scripts/balance.ts`, not part of `bun test`).

## Core fantasy

Balatro loop, but every card is a real matura task. The card face shows category + a short
summary; its **chip value is the task's final numeric answer, hidden** until the card is played.
Solving tasks (in the fullscreen viewer, with scratch drawing) = knowing your cards. [user]

## Card anatomy (task card)

| field            | visible    | notes                                                                        |
| ---------------- | ---------- | ---------------------------------------------------------------------------- |
| category (13)    | yes        | "rank-like": drives Para/Trójka/Kareta…                                      |
| dział / suit (4) | yes        | ♠ Algebra · ♥ Funkcje · ♦ Geometria · ♣ Rachunek; drives Kolor               |
| level P / R      | yes        | badge                                                                        |
| points (1–6)     | yes        | from the CKE header "(0–4)"                                                  |
| summary PL/EN    | yes        | KaTeX, ≤ ~70 chars                                                           |
| value            | **hidden** | final answer; Σ badge = "sum of all numbers in the answer"                   |
| player answer    | yes        | typed in the viewer; **required** to play a face-up card (2026-09-26) [user] |

### Answer rules

- single numeric answer → that number (√2 → 1.414…, 1/6 → 0.1667, 30° → 30).
- closed ABCD task → the player may type the number **or the option letter**; the letter is
  checked against `key` (1,555 closed tasks carry one).
- several numbers asked (roots, coordinates, a) + b)) → **sum** (Σ badge on card).
- excluded from the pool: proofs, P/F, matching, intervals/sets, symbolic expressions, drawings.
- **the answer's number does not score** [user, 2026-09-26: "base it on difficulty"]. It is only
  checked, and read by jokers (even, prime, negative…) and by reveal ściągi.

### Card chips

- correct card → `taskChips = 6 + 5×difficulty + 3×points` (`src/lib/game/constants.ts`): a
  2-dot 1-point basic task gives 19, a 5-dot 4-point extended one 43; plus **+1 Mult**
  (`KNOWLEDGE_MULT`). Wrong card → 0.
- ściąga mods (round-only): `dbl` ×2 chips (Podwojenie), `rep` scores twice (Powtórka),
  `plus` +25 chips (Karta wzorów).

## Hand types (układy) — detected from played cards (1–5)

All correctly answered played cards add their chips (unlike Balatro, no "unscored" kickers).

| id        | PL             | EN              | condition                           | chips | mult | +chips/lvl | +mult/lvl |
| --------- | -------------- | --------------- | ----------------------------------- | ----- | ---- | ---------- | --------- |
| high      | Karta wysoka   | High Card       | none                                | 5     | 1    | 10         | 1         |
| pair      | Para           | Pair            | 2 same category                     | 10    | 2    | 15         | 1         |
| twopair   | Dwie pary      | Two Pair        | 2+2 same category                   | 20    | 2    | 20         | 1         |
| three     | Trójka         | Three of a Kind | 3 same category                     | 30    | 3    | 20         | 2         |
| cross     | Przekrój       | Cross-section   | 5 cards, 5 categories, all 4 działy | 30    | 4    | 30         | 3         |
| flush     | Kolor          | Flush           | 5 cards same dział                  | 35    | 4    | 15         | 2         |
| full      | Full           | Full House      | 3 + 2 same categories               | 40    | 4    | 25         | 2         |
| four      | Kareta         | Four of a Kind  | 4 same category                     | 60    | 7    | 30         | 3         |
| five      | Piątka         | Five of a Kind  | 5 same category                     | 120   | 12   | 35         | 3         |
| flushfull | Full w kolorze | Flush House     | Full, all same dział                | 140   | 14   | 40         | 4         |

Level-ups come from **Twierdzenia** (planet analog), one per hand type.

## Scoring pipeline (event timeline, animated left→right)

0. every played face-up card needs the player's answer; a **wrong answer scores 0 chips, fires no
   card effects and drops out of hand-type detection** (no guessing a flush). Face-down (boss)
   cards need no answer. [user, 2026-09-26]
1. base chips/mult of hand type (level applied); boss modifiers (e.g. halve).
2. each played card left→right: `+taskChips` (mods, boss) → **+1 Mult for a correct answer**
   (not for face-down cards, not repeated on retriggers; the Lustro boss removes it)
   → card enhancement (+chips / +mult / ×mult)
   → "on card scored" jokers (e.g. +4 Mult if the answer is even) → retriggers repeat the card.
3. jokers left→right "independent" effects (+mult, +chips, ×mult), then joker editions.
4. score = chips × mult (may be negative) → added to round score (can go down).
5. no money for correct answers (removed 2026-09-26 [user]); money comes from blinds, unused
   hands, interest and jokers, as in Balatro. Answer jokers: Notatnik +2 Mult per correct card,
   Korepetytor $3 / Prymus ×2 when every played card is right, Banach +×0.1 per correct card.
   Answer check: `isAnswerCorrect` tolerance max(0.011, 0.5%); "%" inputs and percent keys match
   both 45 and 0.45 forms.

## Run structure

- Difficulty (deck) chosen before run: **TRYWIALNE** (P only) · **TRYWIALNE+** (≈3:1 P : R with R
  difficulty ≤ 3) · **CIEKAWE** (≈1:3 P-hard(≥3) : R). [user]
- 8 antes × (Small, Big, Boss). Small/Big skippable for a tag. Win after ante 8 boss; endless later.
- Per blind a **fresh 40-card deck** is drawn from the mode pool, excluding tasks already dealt this
  run (fallback: least-recently seen). Cards bought in the shop / picked from packs are **reserved**
  and dealt first in the next blind. [user]
- Hands 4, discards 3, hand size 8, max 5 per play/discard, joker slots 5, consumable slots 2.
- Blind targets _(tuned)_: see `src/lib/game/constants.ts` `ANTE_BASE`; small ×1, big ×1.5, boss ×`targetMult` (mostly ×2; Ściana ×3, Komisja ×4).

## Economy (Balatro numbers unless noted)

- start $4; blind reward $3 / $4 / $5; +$1 per unused hand; interest $1 per $5, cap $5.
- shop: 2 card slots (jokers / ściągi / twierdzenia / task cards), 2 packs, 1 voucher.
- prices: joker common $4–5, uncommon $6–7, rare $8–10; ściąga $3; twierdzenie $3; task card $2–4;
  pack normal $4 / jumbo $6 / mega $8; voucher $10; reroll $5 (+$1 each, resets per shop).
- sell value = floor(cost / 2), min $1.

## Content lists → code owns details

- Jokers `src/lib/game/content/jokers.ts`, ściągi + twierdzenia `consumables.ts`, bosses `bosses.ts`,
  vouchers `vouchers.ts`, tags `tags.ts`. Names are math-themed PL with EN translations.
- Info mechanics unique to Malatro: jokers/ściągi that reveal the sign, range or exact answer of
  cards (the exact one literally hands you the answer); jokers keyed to answer properties
  (even, prime, Fibonacci, perfect square, negative; Nieskończoność adds |answer| ≤ 50 as chips).
- Bosses tied to chips: Zaokrąglenie floors card chips to tens, Lustro removes the +1 Mult.

## Balance principles

- A player who solves ~half the cards and avoids negatives should beat antes 1–4 without
  great jokers; antes 6–8 need ×mult jokers + leveled hands. _(tuned)_
- Random play (no solving) should usually die at ante 2–3.
- Chips track difficulty, so huge answers (10^10, combinatorics) no longer distort a hand.
