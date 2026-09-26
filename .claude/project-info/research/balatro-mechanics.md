# Balatro (LocalThunk, 2024): mechanics reference for Malatro

Researched 2026-09-26. Numbers come from balatrowiki.org and were cross-checked against the decompiled Lua source (mirror: github.com/GladdonT/balatro-source-code, v1.0.1-era). Where the two disagree, the source wins, and the conflict is noted. `[src:file]` means the value was read directly from code. See the Sources section at the end.

---

## 1. Core loop

- **Run** = pick a Deck and a Stake, then play **Antes 1-8**. Each ante has **3 blinds**: Small, then Big, then Boss. You can't change the order.
- **Win**: beat the Ante 8 Boss (`win_ante = 8` [src:game.lua]). "YOU WIN!" then offers **Endless Mode** (ante 9+). There's no cap after that; the run ends at the first loss.
- **Lose**: on your last hand, round score is still below the target → **GAME OVER**. The one exception is the Mr. Bones joker, which saves you if you scored ≥25% of the target and then destroys itself.
- **A round ends as soon as score ≥ target**, even if hands remain. Leftover hands pay $1 each.
- **Per blind**: Blind Select → play the round → Cash Out → Shop → back to Blind Select. After the Boss, the ante goes up, the voucher restocks and new tags are rolled.
- **Skipping**: Small and Big can be skipped. You get that blind's **Tag**, but no money and no shop for it. The Boss can't be skipped, only rerolled (Director's Cut/Retcon, $10) or disabled (Luchador, Chicot, Boss Tag rerolls it).
- The **Boss is revealed at the start of the ante** on the Blind Select screen. You can plan around it, and skipping trades money and shop visits for tags.
- A **round counter** goes up by 1 per blind played or skipped. A normal win is Round 24.
- **Deck handling**: when a blind is selected the full deck is shuffled and 8 cards are drawn. After each play or discard you draw back up to hand size. Played and discarded cards stay out until the next round. The deck counter at bottom right shows remaining/total (e.g. 44/52).

## 2. Scoring

**Score of a hand = floor(Chips × Mult)**, added to the round score. Chips start at the hand's base chips and Mult at its base mult. Then everything is applied **strictly in order**: `+Chips` adds to chips, `+Mult` adds to mult, `XMult` multiplies the current mult. Because of that ordering, +Mult placed before XMult is worth more.

### Exact activation order [src:state_events.lua `evaluate_play`, wiki Activation Sequence]
0. Work out the poker hand from the selected cards (the best matching hand wins). The **scoring cards** are the cards that form the hand: a Pair scores 2 cards, High Card scores 1, and kickers don't score. Exceptions: **Stone cards always score**, and **Splash** makes every played card score.
1. **Boss check**: Psychic/Eye/Mouth can reject the hand ("Not allowed!"). It still uses a hand and scores 0. The Arm lowers the hand's level here.
2. **"Before" jokers** (on played, before scoring): Green Joker +1, Ride the Bus, Runner, Square, Spare Trousers scaling, Space Joker level-up, Midas Mask, Vampire, DNA.
3. Read the hand's base Chips and Mult from its current level. **The Flint** halves both (rounded; mult minimum 1).
4. **Each scoring card, left to right** (the order the player arranged):
   - a. card chips: rank value (**A=11, K/Q/J=10, 10…2 = face value**), plus Bonus +30 or Stone +50, plus permanent bonus (Hiker)
   - b. card +Mult (Mult card +4, Lucky 1-in-5 +20)
   - c. card $ (Gold Seal +$3, Lucky 1-in-15 +$20)
   - d. card XMult (Glass ×2)
   - e. card **edition** (Foil +50 chips, Holo +10 mult, Polychrome ×1.5 mult)
   - f. **"on scored" jokers**, left to right (Greedy +3, Fibonacci +8, Photograph ×2, Scholar…)
   - g. **retriggers**: steps a-f run again once per retrigger. The Red Seal's retrigger comes first, then joker retriggers left to right (Hack, Sock & Buskin, Hanging Chad, Dusk, Seltzer). Retriggers add together.
5. **Cards held in hand, left to right**: Steel ×1.5 mult, then "held" jokers (Baron ×1.5 per King, Shoot the Moon +13 per Queen, Raised Fist). Retriggered by Red Seal and Mime.
6. **Jokers, left to right**. For each joker: its Foil/Holo edition, then its **independent ability** (Joker +4, Duo ×2, Cavendish ×3…), then joker-on-joker effects (Baseball Card ×1.5 per Uncommon), then its **Polychrome ×1.5** last. Consumables come after the jokers (Observatory: Planet card in slot gives ×1.5).
7. Deck final step (Plasma Deck averages chips and mult). Then score = chips × mult.
8. **"After"** effects: Glass cards break 1 in 4 (destroyed, Glass Joker scales), Ice Cream −5, Seltzer counts down. Played cards go to the discard pile and you draw.
- A **debuffed card** scores nothing (no chips, no effects) and shows "Debuffed!".
- **Joker order is a skill expression**: chips and +mult jokers go left, XMult jokers go right, and copy jokers (Blueprint copies the joker to its right, Brainstorm copies the leftmost) need planning. Jokers can be dragged to reorder.

## 3. Poker hands [src:game.lua `hands`, wiki Poker Hands]

| # | Hand | Base Chips | Base Mult | +Chips/lvl | +Mult/lvl | Planet |
|---|---|---|---|---|---|---|
| 1 | High Card | 5 | 1 | +10 | +1 | Pluto |
| 2 | Pair | 10 | 2 | +15 | +1 | Mercury |
| 3 | Two Pair | 20 | 2 | +20 | +1 | Uranus |
| 4 | Three of a Kind | 30 | 3 | +20 | +2 | Venus |
| 5 | Straight | 30 | 4 | +30 | +3 | Saturn |
| 6 | Flush | 35 | 4 | +15 | +2 | Jupiter |
| 7 | Full House | 40 | 4 | +25 | +2 | Earth |
| 8 | Four of a Kind | 60 | 7 | +30 | +3 | Mars |
| 9 | Straight Flush (incl. Royal) | 100 | 8 | +40 | +4 | Neptune |
| S | Five of a Kind (secret) | 120 | 12 | +35 | +3 | Planet X |
| S | Flush House (secret) | 140 | 14 | +40 | +4 | Ceres |
| S | Flush Five (secret) | 160 | 16 | +50 | +3 | Eris |

- Priority follows the table: a higher hand beats a lower one **whatever the levels**.
- Secret hands only show up after you've played them once, and their planets only spawn after that too (`softlock`). They need duplicate cards (Cryptid, DNA) or Wild cards.
- Aces count high or low in a straight (A-2-3-4-5), but not both at once. Four Fingers allows 4-card flushes and straights. Shortcut allows straights with 1-rank gaps.
- The Run Info screen lists every hand with its level, current chips × mult, and times played.

## 4. Round resources (defaults) [src:misc_functions.lua `get_starting_params`]

| Param | Value | Notes |
|---|---|---|
| Hands per round | **4** | Blue Deck +1, Black Deck −1, Grabber/Nacho Tong +1 each |
| Discards per round | **3** | Red Deck +1, Blue Stake −1, Wasteful/Recyclomancy +1 each |
| Hand size | **8** | Paint Brush/Palette +1, Juggler +1, Manacle −1 |
| Max cards played or discarded at once | **5** | The Psychic forces exactly 5 |
| Deck | **52** (13 ranks × 4 suits) | Abandoned: 40 (no faces); Checkered: 26♠ + 26♥ |
| Joker slots | **5** | Negative edition +1; Black Deck +1; Antimatter +1 |
| Consumable slots | **2** | Crystal Ball +1; Negative consumables +1 |
| Starting money | **$4** | Yellow Deck $14 |
| Base reroll | **$5** | |

## 5. Blind targets [src:misc_functions.lua `get_blind_amount`, wiki Blinds and Antes]

Base amount per ante (chips). **Target = base × blind multiplier** (× ante_scaling, which is 2 for the Plasma Deck).

| Ante | White/Red (scaling 1) | Green–Blue (scaling 2) | Purple+ (scaling 3) |
|---|---|---|---|
| 0 | 100 | 100 | 100 |
| 1 | **300** | 300 | 300 |
| 2 | **800** | 900 | 1,000 |
| 3 | **2,000** | 2,600 | 3,200 |
| 4 | **5,000** | 8,000 | 9,000 |
| 5 | **11,000** | 20,000 | 25,000 |
| 6 | **20,000** | 36,000 | 60,000 |
| 7 | **35,000** | 60,000 | 110,000 |
| 8 | **50,000** | 100,000 | 200,000 |

| Blind | Mult | Reward | Ante 1 target (White) | Ante 8 target |
|---|---|---|---|---|
| Small | ×1 | $3 (Red Stake+: $0) | 300 | 50,000 |
| Big | ×1.5 | $4 | 450 | 75,000 |
| Boss (normal) | ×2 | $5 | 600 | 100,000 |
| The Wall | ×4 | $5 | — (min ante 2) | — |
| The Needle | ×1 (but only 1 hand) | $5 | — (min ante 2) | — |
| Showdown boss (ante 8, 16…) | ×2 | **$8** | — | 100,000 |
| Violet Vessel (showdown) | **×6** | $8 | — | 300,000 |

- **Endless** (ante > 8): `amt = floor(A8 · (1.6 + (0.75·c)^(1+0.2c))^c)` with c = ante − 8, then truncated to 2 significant digits. White values: ante 9 ≈ 110k, 10 ≈ 560k, 11 ≈ 7.2M, 12 ≈ 300M, 13 ≈ 47B, 16 ≈ 8.6e20.
- The **base goes up ×2.5-2.7 per ante early and ×1.4-1.8 late**, which is ×167 from ante 1 to ante 8. Player power has to compound to keep up.
- Anchor with no jokers at level 1: Pair of Aces is (10+22)×2 = 64. A typical Flush is about (35+40)×4 = 300, enough to clear Ante 1 Small alone. Four of a Kind is about (60+40)×7 = 700. Ante 1 asks for about 75-150 per hand. Ante 8 needs 25k+ per hand, which only comes from jokers, levels and ×Mult.

## 6. Economy [src:state_events.lua `evaluate_round`, card.lua `set_cost`, wiki Money/Shop]

**Cash Out (end of each won blind), in this order, each row appearing with a rising coin pitch:**
1. Blind reward: $3 / $4 / $5 / $8 (showdown), drawn as "$$$" icons.
2. "Remaining Hands ($1 each)": $1 × hands left. Green Deck pays $2 per hand and $1 per discard, but gives no interest.
3. Joker payouts: Golden Joker $4, Rocket $1 (+$2 per boss beaten), Cloud 9 $1 per 9, Satellite, Delayed Gratification $2 per discard if none were used.
4. Tag payouts (Investment +$25 after the boss).
5. **Interest: $1 per $5 held, capped at $5** (`interest_cap = 25`). Holding $25 or more gives +$5. Seed Money raises the cap to $10 ($50 held), Money Tree to $20 ($100 held). To the Moon adds +$1 extra per $5. Interest is calculated on the money you had before this payout.
6. A **"Cash Out: $N"** button collects the total.

**Prices** (`cost = max(1, floor((base + edition + inflation + 0.5) × (100 − discount%)/100))`):

| Item | Cost |
|---|---|
| Common joker | $1–6 (most $4–5; Joker $2, Credit Card $1) |
| Uncommon joker | $4–8 (most $6–7) |
| Rare joker | $7–10 (Blueprint/Brainstorm $10) |
| Legendary joker | $20 (only from The Soul, never in shop) |
| Tarot / Planet | $3 |
| Spectral | $4 |
| Playing card (Magic Trick) | $1 + enhancement surcharges |
| Booster Normal / Jumbo / Mega | $4 / $6 / $8 |
| Voucher | $10 |
| Edition surcharge | Foil +$2, Holo +$3, Polychrome +$5, Negative +$5 |
| Reroll | **$5, +$1 per reroll**, back to $5 in each new shop (Reroll Surplus −$2, Glut −$2 more) |
| Boss reroll (Director's Cut/Retcon) | $10 |

- **Sell value = max(1, floor(cost/2))** plus any added value (Egg +$3 per round, Gift Card +$1 per round to everything). Rental jokers cost $1 to buy and **$3 per round**.
- **Debt**: money can't go below $0, except to −$20 with Credit Card.
- Discounts: Clearance Sale 25%, Liquidation 50%.
- Typical income is about $10–20 per blind. The standard play is to keep $25 for full interest and spend only what's above it (see §16).

## 7. Shop [wiki Shop, src:game.lua]

- Layout: **2 card slots** (Overstock +1, Overstock Plus +1 → max 4), **2 booster pack slots**, **1 voucher slot**. Buttons: **Next Round** and **Reroll $N**.
- Reroll refreshes only the card slots. Packs and vouchers stay. The voucher changes only once per ante (after the boss). Voucher Tag adds a second one.
- Card slot type weights [src:`joker_rate=20, tarot_rate=4, planet_rate=4`]: **Joker 20 (71.4%)**, Tarot 4 (14.3%), Planet 4 (14.3%). Magic Trick adds Playing cards at weight 4. Tarot/Planet Merchant raise their weight to 9.6, Tycoon to 32. The Ghost Deck adds Spectral at weight 2.
- **Joker rarity roll**: Common **70%** (roll ≤ 0.7), Uncommon **25%**, Rare **5%** (> 0.95), Legendary 0% in shop.
- **Jokers you already own don't appear again** unless you have Showman.
- **First shop of a run always offers a Normal Buffoon Pack** in pack slot 1.
- Consumables can be BUY, or BUY & USE right away. Jokers go straight into the joker row, and a purchase is blocked if slots are full (unless the joker is Negative).
- Stake stickers on shop jokers (30% rolls): Black+ Eternal (can't be sold or destroyed), Orange+ Perishable (debuffed after 5 rounds), Gold+ Rental ($1 buy, −$3 per round).

### Vouchers ($10 each; 16 pairs, the upgrade needs the base) [wiki Vouchers]

| Base | Effect | Upgrade | Effect |
|---|---|---|---|
| Overstock | +1 shop card slot | Overstock Plus | +1 more |
| Clearance Sale | 25% off | Liquidation | 50% off |
| Hone | Foil/Holo/Poly ×2 as often | Glow Up | ×4 |
| Reroll Surplus | rerolls −$2 | Reroll Glut | −$2 more |
| Crystal Ball | +1 consumable slot | Omen Globe | Spectrals can appear in Arcana (20%/card) |
| Telescope | Celestial packs always include the planet for your most played hand | Observatory | Planets in slots give ×1.5 mult when their hand is played |
| Grabber | +1 hand per round | Nacho Tong | +1 more |
| Wasteful | +1 discard per round | Recyclomancy | +1 more |
| Tarot Merchant | Tarots ×2 in shop | Tarot Tycoon | ×4 |
| Planet Merchant | Planets ×2 in shop | Planet Tycoon | ×4 |
| Seed Money | interest cap $10 | Money Tree | cap $20 |
| Blank | nothing | Antimatter | +1 joker slot |
| Magic Trick | playing cards sold in shop | Illusion | those cards can have enhancement, edition or seal |
| Hieroglyph | −1 ante, −1 hand per round | Petroglyph | −1 ante, −1 discard per round |
| Director's Cut | reroll boss once per ante ($10) | Retcon | unlimited boss rerolls ($10 each) |
| Paint Brush | +1 hand size | Palette | +1 more |

## 8. Booster packs [src:game.lua P_CENTERS, wiki Booster Packs]

| Type | Normal ($4) | Jumbo ($6) | Mega ($8) | Contents | Weight N/J/M |
|---|---|---|---|---|---|
| Standard | choose 1 of 3 | 1 of 5 | 2 of 5 | playing cards added to deck | 4 / 2 / 0.5 |
| Arcana | 1 of 3 | 1 of 5 | 2 of 5 | Tarots (+0.3% The Soul) | 4 / 2 / 0.5 |
| Celestial | 1 of 3 | 1 of 5 | 2 of 5 | Planets (+0.3% Black Hole) | 4 / 2 / 0.5 |
| Buffoon | 1 of 2 | 1 of 4 | 2 of 4 | Jokers (same rarity odds as shop) | 1.2 / 0.6 / 0.15 |
| Spectral | 1 of 2 | 1 of 4 | 2 of 4 | Spectrals | 0.6 / 0.3 / 0.07 |

- Total weight is 22.42. Normal Standard/Arcana/Celestial are 17.8% each and Normal Buffoon is 5.4%. Weights are summed from the multiple art variants.
- Opening a pack puts you on a pack screen with the cards fanned out and a **Skip** button. Picks go straight into use, the deck or slots, so pack cards don't take consumable slots. **Arcana and Spectral packs deal a hand of cards** (current hand size) so you can target playing cards right away.
- Standard pack cards [src:card.lua]: 40% enhanced, editions polled at ×2 rate (never Negative), **20% seal** (Red/Blue/Gold/Purple, equal 25% odds).
- Skipping a pack makes Red Card grow by +3 mult.

## 9. Jokers [wiki Jokers, src:game.lua]

- **150 jokers**: Common 61, Uncommon 64, Rare 20, Legendary 5. **5 slots.**
- Rarity odds 70 / 25 / 5 / 0. Legendaries come only from The Soul (0.3% per Arcana or Spectral pack card).
- **Editions** on shop and pack jokers [src:`poll_edition`]: Negative **0.3%**, Polychrome **0.3%**, Holographic **1.4%**, Foil **2%** (about 4% total). Hone multiplies all except Negative by 2, Glow Up by 4. Foil **+50 chips**, Holo **+10 mult**, Polychrome **×1.5 mult**, Negative **+1 joker slot** (lets a joker "not take space").
- Rough design ladder: **Commons are simple flat or conditional adds, Uncommons scale or bend a rule, Rares give ×Mult or copy other jokers.**

Representative jokers (cost, rarity C/U/R/L):

**Flat +Mult**
- Joker $2 C: +4 Mult · Jolly $3 C: +8 if Pair · Zany $4 C: +12 if Trips · Mad $4 C: +10 if Two Pair · Crazy $4 C: +12 if Straight · Droll $4 C: +10 if Flush
- Half Joker $5 C: +20 if ≤3 cards played · Mystic Summit $5 C: +15 when 0 discards left
- Misprint $4 C: random +0-23 · Abstract $4 C: +3 per joker owned · Gros Michel $5 C: +15, 1 in 6 chance to go extinct at round end, which unlocks Cavendish
- Popcorn $5 C: +20, −4 per round · Swashbuckler $4 C: + the sell value of other jokers · Bootstraps $7 U: +2 per $5 held

**+Chips**
- Sly $3 C: +50 if Pair · Wily $4 C: +100 if Trips · Clever $4 C: +80 if Two Pair · Devious $4 C: +100 if Straight · Crafty $4 C: +80 if Flush
- Banner $5 C: +30 per discard left · Blue Joker $5 C: +2 per card left in deck · Ice Cream $5 C: +100, −5 per hand played
- Stuntman $7 R: +250 chips, −2 hand size · Bull $6 U: +2 per $1 held · Stone Joker $6 U: +25 per Stone card in deck

**×Mult**
- Cavendish $4 C: ×3, 1 in 1000 destroy · Photograph $5 C: first scored face card ×2
- Card Sharp $6 U: ×3 if this hand type was already played this round · Blackboard $6 U: ×3 if every held card is ♠/♣ · Acrobat $6 U: ×3 on the final hand · Flower Pot $6 U: ×3 if the hand has all 4 suits · Loyalty Card $5 U: ×4 every 6th hand · Seeing Double $6 U: ×2 if the hand has a ♣ plus another suit · Ramen $6 U: ×2, −0.01 per card discarded · Joker Stencil $8 U: ×1 per empty joker slot
- The Duo ×2 Pair / Trio ×3 Trips / Family ×4 Quads / Order ×3 Straight / Tribe ×2 Flush ($8 R each) · Baron $8 R: ×1.5 per King held in hand

**Card-conditional (suit/rank, "on scored")**
- Greedy/Lusty/Wrathful/Gluttonous $5 C: +3 Mult per ♦/♥/♠/♣ scored
- Arrowhead $7 U: ♠ +50 chips · Onyx Agate $7 U: ♣ +7 mult · Bloodstone $7 U: ♥ 1 in 2 ×1.5 · Rough Gem $7 U: ♦ +$1
- Fibonacci $8 U: A/2/3/5/8 +8 mult · Even Steven $4 C: even ranks +4 mult · Odd Todd $4 C: odd ranks +31 chips · Scholar $4 C: Ace +20 chips +4 mult · Walkie Talkie $4 C: 10 or 4 gives +10 chips +4 mult · Scary Face $4 C: face +30 chips · Smiley Face $4 C: face +5 mult
- The Idol $6 U: ×2 for a specific rank+suit (changes each round) · Ancient Joker $8 R: ×1.5 per card of a rotating suit · Triboulet L: ×2 per K or Q

**Scaling (grow over the run)**
- Green Joker $4 C: +1 mult per hand, −1 per discard · Ride the Bus $6 C: +1 per consecutive hand with no face card (resets) · Runner $5 C: +15 chips per Straight · Square $4 C: +4 chips per 4-card hand · Supernova $5 C: + times this hand has been played · Fortune Teller $6 C: +1 per Tarot used · Red Card $5 C: +3 per pack skipped
- Spare Trousers $6 U: +2 mult per Two Pair · Hiker $5 U: each scored card permanently gains +5 chips · Castle $6 U: +3 chips per discarded card of a rotating suit · Flash Card $5 U: +2 per reroll · Constellation $6 U: ×0.1 per Planet used · Hologram $7 U: ×0.25 per card added to deck · Vampire $7 U: ×0.1 per enhanced card eaten · Lucky Cat $6 U: ×0.25 per Lucky trigger · Glass Joker $6 U: ×0.75 per Glass broken · Throwback $6 U: ×0.25 per blind skipped · Madness $7 U: ×0.5 per blind, destroys a joker
- Obelisk $8 R: ×0.2 per hand that isn't your most played · Campfire $9 R: ×0.25 per card sold (resets on boss) · Wee Joker $8 R: +8 chips per 2 scored · Hit the Road $8 R: ×0.5 per Jack discarded · Canio L: ×1 per face destroyed · Yorick L: ×1 per 23 discards

**Economy**
- Golden Joker $6 C: $4 per round · Egg $4 C: +$3 sell value per round · Credit Card $1 C: debt to −$20 · Delayed Gratification $4 C: $2 per discard if none used · Business Card $4 C: face 1 in 2 for $2 · To Do List $4 C: $4 for a listed hand · Faceless $4 C: $5 for 3+ faces discarded at once · Mail-In Rebate $4 C: $5 per discarded card of a rotating rank · Reserved Parking $6 C: held face 1 in 2 for $1 · Golden Ticket $5 C: Gold cards scored +$4
- Rocket $6 U · Cloud 9 $7 U · To the Moon $5 U: +$1 interest per $5 · Gift Card $6 U · Trading Card $6 U: first single-card discard is destroyed for $3 · Matador $7 U: $8 when the boss ability triggers · Satellite $6 U · Chaos the Clown $4 C: 1 free reroll per shop · Astronomer $8 U: Planets and Celestial packs free

**Retrigger**
- Hanging Chad $4 C: first scored card retriggers 2× · Hack $6 U: retrigger 2-5 · Sock and Buskin $6 U: retrigger faces · Dusk $5 U: retrigger all on the final hand · Seltzer $6 U: retrigger all for 10 hands · Mime $5 U: retrigger held-in-hand effects

**Hand size / hands / discards**
- Juggler $4 C: +1 hand size · Drunkard $4 C: +1 discard · Turtle Bean $6 U: +5 hand size, −1 per round · Troubadour $6 U: +2 hand size, −1 hand · Merry Andy $7 U: +3 discards, −1 hand size · Burglar $6 U: +3 hands, lose all discards

**Rule-bending**
- Four Fingers $7 U (4-card flush/straight) · Shortcut $7 U (straight gaps) · Smeared $7 U (♥=♦, ♠=♣) · Pareidolia $5 U (all cards count as face) · Splash $3 C (all played cards score)
- Oops! All 6s $4 U (doubles probabilities) · Showman $5 U (duplicates allowed) · Mr. Bones $5 U (survive at ≥25%) · Luchador $5 U (sell to disable boss) · Chicot L (bosses disabled)
- Blueprint $10 R (copies the joker to its right) · Brainstorm $10 R (copies the leftmost)
- Midas Mask $7 U (scored faces become Gold) · DNA $8 R (first single-card hand is duplicated into the deck) · Certificate $6 U · Marble $6 U · Riff-Raff $6 C (2 Commons per blind) · Cartomancer $6 U (Tarot per blind) · Space Joker $5 U (1 in 4 to level up the hand) · Burnt Joker $8 R (levels the first discarded hand) · Invisible $8 R (duplicates a joker after 2 rounds) · Perkeo L (Negative copy of a consumable at shop end)

## 10. Consumables (2 slots)

**Tarot ($3)** [wiki Tarot Cards]

| # | Card | Effect |
|---|---|---|
| 0 | The Fool | copies the last Tarot or Planet used |
| I | Magician | 2 cards → Lucky |
| II | High Priestess | 2 random Planets |
| III | Empress | 2 cards → Mult |
| IV | Emperor | 2 random Tarots |
| V | Hierophant | 2 cards → Bonus |
| VI | Lovers | 1 card → Wild |
| VII | Chariot | 1 card → Steel |
| VIII | Justice | 1 card → Glass |
| IX | Hermit | doubles money (max +$20) |
| X | Wheel of Fortune | 1 in 4: random joker gets Foil/Holo/Poly |
| XI | Strength | up to 2 cards +1 rank |
| XII | Hanged Man | destroys up to 2 cards |
| XIII | Death | 2 cards: the left one becomes a copy of the right |
| XIV | Temperance | $ equal to total joker sell value (max $50) |
| XV | Devil | 1 card → Gold |
| XVI | Tower | 1 card → Stone |
| XVII | Star | up to 3 cards → ♦ |
| XVIII | Moon | up to 3 cards → ♣ |
| XIX | Sun | up to 3 cards → ♥ |
| XX | Judgement | random joker (needs a free slot) |
| XXI | World | up to 3 cards → ♠ |

**Planet ($3)**: +1 level to its hand (see the §3 table). The sidebar plays a "Level Up!"
animation: hand name, then chips and mult tick up with sounds. Black Hole (Spectral) levels up every hand by 1.

**Spectral ($4, 18 cards; source: Spectral packs, Ghost Deck shop, Omen Globe, Séance, Sixth
Sense)**
- Familiar / Grim / Incantation: destroy 1 card in hand, add 3 enhanced faces / 2 enhanced Aces / 4 enhanced number cards.
- Talisman / Deja Vu / Trance / Medium: add a Gold / Red / Blue / Purple seal to 1 card.
- Aura: Foil/Holo/Poly on 1 card. Cryptid: 2 copies of 1 card. Sigil: whole hand → one suit. Ouija: whole hand → one rank, −1 hand size.
- Wraith: a Rare joker, money set to $0. Ectoplasm: Negative on a random joker, −1 hand size. Hex: Polychrome on one joker, destroys the rest. Ankh: copies one joker, destroys the rest.
- Immolate: destroy 5 cards, +$20. The Soul: a Legendary joker. Black Hole: every hand +1 level.

## 11. Card modifiers (at most 1 enhancement, 1 seal and 1 edition per card)

| Enhancement | Effect | When | Source |
|---|---|---|---|
| Bonus | +30 chips | scored | Hierophant |
| Mult | +4 mult | scored | Empress |
| Wild | counts as every suit | always | Lovers |
| Glass | ×2 mult, 1 in 4 destroyed after scoring | scored | Justice |
| Steel | ×1.5 mult | **held in hand** | Chariot |
| Stone | +50 chips, no rank or suit, **always scores** | scored | Tower |
| Gold | +$3 | **held in hand at end of round** | Devil |
| Lucky | 1 in 5 +20 mult; 1 in 15 +$20 | scored | Magician |

| Seal | Effect | Source |
|---|---|---|
| Gold | +$3 when played and scored | Talisman |
| Red | retrigger the card once (also its held effects) | Deja Vu |
| Blue | creates the Planet for your last hand if held at round end | Trance |
| Purple | creates a Tarot when discarded | Medium |

- Playing card editions: Foil +50 chips, Holo +10 mult, Polychrome ×1.5, applied when the card scores (step 4e). Negative doesn't occur on playing cards in the base game.

## 12. Boss blinds [src:game.lua P_BLINDS `boss.min`]

Normal bosses (×2, $5) can appear from their minimum ante onward. They **never appear on ante 8, 16…**, where a Showdown boss is always used instead. The pick favors the **least-used** boss among those eligible, so you don't see repeats until the pool cycles.

| Boss | Effect | Min ante |
|---|---|---|
| The Hook | discards 2 random held cards after each hand played | 1 |
| The Club / Goad / Window / Head | all ♣ / ♠ / ♦ / ♥ cards debuffed | 1 |
| The Psychic | must play exactly 5 cards | 1 |
| The Manacle | −1 hand size | 1 |
| The Pillar | cards already played this ante are debuffed | 1 |
| The House | first hand is drawn face down | 2 |
| The Wall | extra large blind (×4) | 2 |
| The Wheel | 1 in 7 cards drawn face down | 2 |
| The Arm | lowers the level of the played hand by 1 | 2 |
| The Fish | cards drawn face down after each hand played | 2 |
| The Water | start with 0 discards | 2 |
| The Mouth | only one hand type allowed this round | 2 |
| The Needle | only 1 hand (blind ×1) | 2 |
| The Flint | base chips and mult halved | 2 |
| The Mark | all face cards drawn face down | 2 |
| The Eye | no repeated hand types this round | 3 |
| The Tooth | −$1 per card played | 3 |
| The Plant | all face cards debuffed | 4 |
| The Serpent | after every play or discard, always draw exactly 3 | 5 |
| The Ox | playing your most-played hand sets money to $0 | 6 |
| **Amber Acorn** (showdown) | flips and shuffles all jokers | 8 |
| **Verdant Leaf** (showdown) | all cards debuffed until you sell 1 joker | 8 |
| **Violet Vessel** (showdown) | very large blind (×6) | 8 |
| **Crimson Heart** (showdown) | a random joker is disabled each hand | 8 |
| **Cerulean Bell** (showdown) | 1 card is always force-selected | 8 |

- Showdown rewards are $8. Every boss has its own color; the swirling background takes it on during the fight. Small and Big blinds use a green-teal blind color (#50846e); the boss color is `#b44430` by default, and each boss has its own.

## 13. Decks and Stakes (brief)

**Decks**: Red (+1 discard) · Blue (+1 hand) · Yellow (+$10) · Green ($2 per hand and $1 per
discard left, no interest) · Black (+1 joker slot, −1 hand) · Magic (Crystal Ball + 2 Fools) · Nebula (Telescope, −1 consumable slot) · Ghost (Spectrals in shop, starts with Hex) · Abandoned (no faces) · Checkered (26♠ 26♥) · Zodiac (Tarot and Planet Merchant + Overstock) · Painted (+2 hand size, −1 joker slot) · Anaglyph (Double Tag after each boss) · Plasma (chips and mult averaged, blinds ×2) · Erratic (random ranks and suits).

**Stakes** (each adds to the ones before) [src:game.lua `start_run`]: White (base) → Red (Small
Blind pays $0) → Green (scaling 2) → Black (Eternal jokers) → Blue (−1 discard) → Purple (scaling 3) → Orange (Perishable) → Gold (Rental).

**Tags** (from skips; 24 total). Uncommon/Rare (free joker of that rarity in the next shop) ·
Foil/Holo/Poly/Negative (next base joker is free with that edition) · Investment (+$25 after the boss) · Voucher (+1 voucher next shop) · Boss (reroll the boss) · Standard/Charm/Meteor/ Buffoon (free Mega pack) · Ethereal (free Spectral pack) · Handy ($1 per hand played this run) · Garbage ($1 per unused discard) · Coupon (next shop's first cards and packs free) · Double (copies the next tag) · Juggle (+3 hand size next round) · D6 (rerolls start at $0) · Top-up (2 Commons) · Speed ($5 per blind skipped) · Orbital (a hand +3 levels) · Economy (doubles money, max +$40). Several need ante 2+. Tags trigger oldest first.

## 14. UI/UX flow

**Main menu**: logo over an animated swirl background, a spinning card, and buttons **PLAY**
(blue), **OPTIONS** (orange), **QUIT** (red), **COLLECTION** (green). PLAY opens tabs **New Run / Continue / Challenges**. New Run has a deck carousel with arrows showing the deck back and its effect text, a stake selector (colored chips), a "Seeded run" toggle, and PLAY.

**Blind Select** (sidebar header "Choose your next Blind"): 3 tall panels rise from the bottom.
Each panel has, from the top:
- state button: **Select** (orange, active), "Upcoming" (grey), "Defeated", "Skipped"
- blind name and animated blind chip sprite
- "Score at least **N**" with a red chip icon, and "Reward: $$$"
- Small/Big only: "or", then a **Skip Blind** button with the tag icon and its tooltip
- Boss: the effect text, plus a "Reroll Boss $10" button if you own Director's Cut

The deck, jokers and consumables stay visible.

**Round screen layout**
- Jokers in a row at top center with a "n/5" counter. Consumables at top right with "n/2".
- Deck at bottom right: remaining/total counter; click to view it.
- The hand fans along the bottom. Clicking raises a card (max 5); dragging reorders.
- Under the hand: **Play Hand** (blue), a **Sort Hand [Rank] [Suit]** pill, and **Discard** (red).
- As soon as cards are selected, the sidebar **previews the hand type, its level and base Chips × Mult** (e.g. "Flush lvl.2 · 50 × 6"). Card contributions show only during scoring.

**Left sidebar (always present during a run)**, top to bottom:
1. **Blind panel**, in the blind's color: blind name, blind chip, "Score at least" + target, "Reward: $$$". A boss also shows its effect text.
2. **Round score**: current total for this blind.
3. **Hand box**: hand name + "lvl.N", then a **blue Chips box × red Mult box**, which updates live while scoring. Flames appear when one hand ≥ target: `intensity = log5(score) − 2`.
4. **Run Info** (red) and **Options** (orange) buttons.
5. Stat grid: **Hands** (blue number), **Discards** (red number), **$ money** (gold, large), **Ante x/8** (orange), **Round N** (orange).

**Scoring sequence on Play**: selected cards slide to the center. Scoring cards lift slightly
and non-scoring ones stay low. Then:
- cards pop left to right: blue "+11" chip text, card jiggle, the sidebar chips number rises
- then held-card effects, then jokers wobble left to right with red "+4 Mult" or red boxed "X2 Mult" labels
- then chips × mult collapses into a total that counts up into Round score
- then cards fly to the discard and new ones deal in from the deck

**Cash Out**: a panel slides up over the play area with a big orange **Cash Out: $N** button
on top. Rows ("$$$" icons with labels): blind reward, "N Remaining Hands ($1 each)", joker rows, tag rows, and "N interest per $5 (5 max)". Rows appear one at a time.

**Shop**: a panel slides up. At left: **Next Round** (red) and **Reroll $5** (green). Card slots
have price tags above and BUY on the side. Below them sit the voucher (labelled "ANTE N VOUCHER", REDEEM) and 2 packs (OPEN). Selling works from the joker or consumable row (SELL $N button on the card). Opening a pack moves to the pack screen (the background tints by pack type: purple for Arcana, blue for Spectral).

**Run Info** overlay: tabs **Poker Hands** (level, chips × mult, times played), **Blinds**
(this ante's blinds and their states), **Vouchers** (redeemed this run).

**Game over / win**: "GAME OVER" (or "YOU WIN!") with the Jimbo mascot and a speech bubble, and
stats: Best Hand, Most Played Hand, Cards Played / Discarded / Purchased, Times Rerolled, New Discoveries, Ante, Round, Seed (Copy Seed), and "Defeated By" [blind]. Buttons: **New Run**, **Main Menu**; the win screen adds **Endless Mode**.

## 15. Game feel [src:common_events.lua `card_eval_status_text`, `draw_card`; wiki Settings]

- Every scoring event is an event-queue step. At 1× speed, a chips pop holds about 0.75 s, a mult pop about 0.8 s, and a joker pop about 0.94 s (base delay 0.6–0.75 × 1.25). Game speed 0.5 / **1 (default)** / 2 / 4 divides the timings; players commonly use 2–4×.
- Each pop does three things:
  - floating text on the card: blue for chips, red for mult, red box for ×mult, gold for $
  - `card:juice_up(0.6, 0.1)` (a quick scale bounce plus wobble)
  - a small **screen jiggle** (+0.7), with Screenshake defaulting to 30%
- **Sounds**:
  - chips `chips1`, +mult `multhit1`, ×mult `multhit2`, $ `coin3`, editions `foil2`, debuff `cancel`
  - the **pitch rises across the hand**: `0.8 + 0.2 × position%`, so left-to-right cards climb in pitch
  - draw `card1` and select `cardSlide1` also pitch by position
  - cash-out rows go up in pitch +0.06 per row
- **Cards** lean toward the mouse, lift on hover with a tooltip, cast shadows, and spring back when dragged. Drawing deals cards one by one from the deck with a flip. Selected cards pop up out of the hand fan.
- **Visual stack**: pixel art, a CRT shader (default 70%, bloom on), and a slow **swirling paint background** tinted per state (blind green, boss color, shop, pack types). Chips blue `#009dff`, Mult red `#FE5F55`, money `#f3b958`, attention orange `#ff9a00`, green `#4BC292`, UI dark slate `#374244`, panel `#4f6367`.
- Reduced Motion setting: turns off animations and shake. Settings also cover a Play/Discard button swap and high-contrast cards.

## 16. Design lessons and principles for Malatro

Why Balatro works:
1. **Two numbers, one multiplication.** Chips × Mult is easy to read, but order-dependent stacking of +chips, +mult and ×mult gives depth. Additive sources grow linearly and ×Mult compounds, so late antes (×167 target growth) force you toward ×Mult.
2. **Scaling targets outpace linear power.** Blinds grow about ×2.5 per ante early, which forces a build to *compound* (levels, scaling jokers, ×mult, retriggers). A run is a race between your engine and the curve.
3. **Economy tension.** Interest (+$1 per $5, cap $5) pays for saving, escalating rerolls (+$1 each) tax fishing, and hands left become money. Every purchase is "power now vs compounding later". Keep these numbers; they're tuned to about $10–20 per blind.
4. **Hands and discards are a shared budget** for information (discards dig) and points (hands). Leftover hands pay out, which rewards over-performing.
5. **Visible counters.** The Boss is shown at ante start and hits a specific build (suit, face, hand type). Skips and tags let you trade tempo. Every boss has counterplay.
6. **Rarity = complexity + power.** Commons are simple flat or conditional; Uncommons scale or bend a rule; Rares are ×mult or copies. The 70/25/5 odds keep build-around pieces exciting.
7. **Archetypes emerge from tags on cards** (suit, rank parity, face, hand type). One joker gives a direction, and the shop and packs let you commit.
8. **Juice sells the math.** Every increment is animated, sounded, pitch-climbed and shaken, so arithmetic feels like a slot machine.

Principles for **math-answer chip values** (unknown until solved, often small, can be negative):
- **The hand's base chips stay the main floor early.** Card values should adjust a hand, not dominate it. Balatro's average card is about 7.3 chips (A = 11, faces 10) against hand bases of 5–160. Clamp card chips to roughly −20…+30 (or map them through something like a signed log), so one outlier answer (e.g. 1024) can't one-shot a blind and −500 can't zero a run.
- **Floor the result.** Clamp total chips at ≥ 0 before multiplying (optionally ≥ 1). Mult never goes below 1 (the Flint minimum). This makes negative cards a *cost*, not a poison pill. Show negatives in their own color (e.g. purple "−7").
- **Discards are the answer to bad values.** Negatives create "dodge" decisions only if the player can learn or estimate the value, so solving a task *is* the information purchase. Keep 3 discards, and consider showing solved values on the card.
- **Hand type should outweigh card sums at ante ≥ 3.** Keep Balatro's base table and level increments. Planet leveling must remain the reliable chip source regardless of answer distributions.
- **Calibrate ante 1.** A no-joker good hand should hit about ⅓–1× of the Small Blind (300). If the mean answer is about 3–5 instead of Balatro's 7.3, lower ante 1–2 targets proportionally (or add a flat "task solved" bonus per scored card) instead of changing the late curve, which is joker-driven anyway.
- **Put variance in jokers, not base values.** Add math-flavored rule-benders that turn value distributions into strategy, analogous to Even Steven, Odd Todd, Fibonacci and Pareidolia: "negative answers count as positive", "+mult per prime answer", "×2 if the sum is 0", "fractions round up".
- **Protect ×Mult's role.** Keep most ×mult on Rares and conditions so the endgame still needs an engine. Card values should feed +chips; never let them feed ×mult directly.
- **Keep the preview honest.** Show hand type + base chips × mult before playing (as Balatro does), and show solved per-card values. Unsolved cards read "?".
- **Keep the event-queue scoring** and the pitch-climbing pops. With unknown values, the reveal moment during scoring *is* the payoff.

---

## Sources (all accessed 2026-09-26)
- https://balatrowiki.org/w/Poker_Hands
- https://balatrowiki.org/w/Blinds_and_Antes
- https://balatrowiki.org/w/Money
- https://balatrowiki.org/w/Shop
- https://balatrowiki.org/w/Booster_Packs
- https://balatrowiki.org/w/Vouchers
- https://balatrowiki.org/w/Jokers
- https://balatrowiki.org/w/Editions
- https://balatrowiki.org/w/Enhancements
- https://balatrowiki.org/w/Seals
- https://balatrowiki.org/w/Tarot_Cards
- https://balatrowiki.org/w/Spectral_Cards
- https://balatrowiki.org/w/Tags
- https://balatrowiki.org/w/Decks
- https://balatrowiki.org/w/Stakes
- https://balatrowiki.org/w/Guide:_Activation_Sequence
- https://balatrowiki.org/w/Settings
- https://balatrowiki.org/w/Gameplay
- https://github.com/GladdonT/balatro-source-code: `game.lua` (hands table, P_BLINDS, P_CENTERS packs/jokers, init_game_object rates, start_run stakes), `functions/misc_functions.lua` (get_starting_params, get_blind_amount), `functions/state_events.lua` (evaluate_play, evaluate_round), `functions/common_events.lua` (eval_card, card_eval_status_text, get_new_boss, get_pack, poll_edition, calculate_reroll_cost), `functions/button_callbacks.lua` (flame_handler), `card.lua` (set_cost, Standard pack odds), `globals.lua` (colors), `localization/en-us.lua` (UI strings)
- https://rogueliker.com/balatro-interview/ (LocalThunk on balancing "by feel", jokers added later, "possibly too much" randomness)
- https://balatrowiki.org/w/Guide:_General_strategy and https://games.gg/balatro/guides/balatro-economy-guide/ (strategy consensus: $25 interest floor, ×mult jokers rightmost; via search summary)
