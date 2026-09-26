# Balatro look, sound & feel: research notes and asset inventory (Malatro)

Researched 2026-09-26. Personal, non-commercial fan project. Files in `assets/references/` are **research-only** screenshots of a copyrighted game. Never ship them or trace them.
Measurements are in **1920x1080 px** unless noted. "src" = hex from Balatro's `G.C` colour table (mirrored at balatrowiki `Module:Localization/loadL10n`). "screen" = hex sampled from screenshots. The in-game CRT pass adds contrast and saturation, so the screen value is always darker or more saturated than src (e.g. RED `FE5F55` shows as `FC4C40`). Use src tokens plus a global `filter: contrast(1.08) saturate(1.15)` (or the CRT shader) to get the screen look.

## 1. Colour tokens

| token | src hex | screen hex | used for |
|---|---|---|---|
| `--c-red` (MULT, XMULT, RED) | `#FE5F55` | `#FC4C40` | mult box, Discard, Run Info, Next Round, Skip Blind, New Run, target score number, boss "X" |
| `--c-blue` (CHIPS, BLUE) | `#009DFF` | `#0090FC` | chips box, Play Hand, PLAY (menu), Hands count, Copy seed, Endless Mode |
| `--c-green` (GREEN, CHANCE) | `#4BC292` | `#34BC84` / `#409C78` | Reroll, COLLECTION, Uncommon pill, probability text |
| `--c-pale-green` | `#56A887` | n/a | secondary green |
| `--c-orange` (ORANGE) | `#FDA200` | `#FC9400` | Options, Select, Sort Hand Rank/Suit, Back, Cash Out banner |
| `--c-important` (IMPORTANT, FILTER) | `#FF9A00` | `#FC8C00` | Ante/Round numbers, highlighted keywords in tooltips (ranks) |
| `--c-money` (MONEY) | `#F3B958` | `#F4B044` | `$22`, `$$$$` reward text, price tags |
| `--c-gold` (GOLD) | `#EAC058` | `#FCCC70` | SHOP marquee letters, gold seal/card |
| `--c-yellow` | `#FFFF00` | n/a | rare pure-yellow flash |
| `--c-purple` (PURPLE) | `#8867A5` | n/a | purple seal, misc |
| `--c-panel` (BLACK, DYN_UI.MAIN) | `#374244` | `#2C383C` | sidebar body, all main panels, tooltip frame |
| `--c-panel-light` (L_BLACK, TEXT_DARK, BLIND.won) | `#4F6367` | `#385054` | menu button tray, game-over panel, dark text on white |
| `--c-grey` (GREY) | `#5F7377` | `#708084` | Profile/Language buttons |
| `--c-inset` (panel darkened ~30%) | ~`#26302F` | `#1C282C` | inset value boxes (score, hands, money) |
| `--c-inset-deep` | n/a | `#182024` | hand-type panel |
| `--c-inactive` (UI.BACKGROUND_INACTIVE) | `#666666` | `#545454` | disabled Play/Discard/Upcoming |
| `--c-text-inactive` | `#88888899` | `#686868` | disabled label |
| `--c-outline-light` (UI.OUTLINE_LIGHT) | `#D8D8D8` | `#ECF0F4` | tooltip outer rim, Sort Hand frame |
| `--c-ui-bg-light` / `--c-ui-bg-dark` | `#B8D8D8` / `#7A9E9F` | n/a | light UI variants |
| `--c-joker-grey` | `#BFC7D5` | `#A0ACB8` | game-over stat pills |
| `--c-white` | `#FFFFFF` | `#FCFCFC` | card faces, text |
| Suits, standard (SO_1) | H `#F03464` D `#F06B3F` S `#403995` C `#235955` | H `#F01850` D `#F05824` S `#242854` C `#044440` | pips and indices on cards |
| Suits, high contrast (SO_2) | H `#F83B2F` D `#E29000` S `#4F31B9` C `#008EE6` | n/a | accessibility toggle |
| Rarity | Common `#009DFF` Uncommon `#4BC292` Rare `#FE5F55` Legendary `#B26CBB` | n/a | rarity pill under joker tooltip |
| Set badges (SECONDARY_SET) | Tarot `#A782D1` Planet `#13AFCE` Spectral `#4584FA` Voucher `#FD682B` Enhanced `#8389DD` Edition `#4CA893` Joker `#708B91` Default `#9BB6BD` | n/a | pills under consumable tooltips |
| Stickers | Eternal `#C75985` Perishable `#4F5DA1` Rental `#B18F43` | n/a | |
| Booster / Voucher | `#646EB7` / `#CB724C` | n/a | |
| Blind | Small/Big `#50846E`, Boss default `#B44430` | Big Blind header `#A46C00`, Small chip `#2040A0`, Big chip `#8C7438`, The Eye `#3460E0`, The Goad `#B04488` | sidebar header and right-edge strip are tinted by the current blind |
| Hand levels (lvl 1 to 7+) | `#EFEFEF #95ACFF #65EFAF #FAE37E #FFC052 #F87D75 #CAA0EF` | `lvl.2` shows as `#6C8CE8`, `lvl.3` as `#40D890` | level badge in Run Info > Poker Hands |

**Background swirl variants** (props for `reactbits-balatro.tsx`; the in-run values are eyeballed from screenshots):
- Main menu, red/blue: `color1 #DE443B`, `color2 #006BB4`, `color3 #162325`. These are the react-bits defaults and match the menu screenshot (reds `#A43C34`, deep blue `#083C58`, dark `#142024`).
- Small/Big blind, green marble (screen `#346C54`, `#2C5C48`, shadow `#1C4434`): try `#3F7A60 / #2A5745 / #1B3A2F`, `contrast 1.6`, `spinSpeed 2.5`, `lighting 0.25`. In a run the swirl is softer and slower than on the menu.
- Boss: tint from the boss colour. The Eye is blue (`#2D4FA8 / #18284C / #0F1A33`). The Goad is magenta (`#8A3D73 / #482C40 / #2A1A26`). The Psychic is ochre (`#B8962E / #6E5A1E / #3A3010`).
- Tarot pack: purple (`#7A58A8 / #4A3470 / #2A1D40`). Celestial pack: near-black blue with star particles. Game over: flat red wash (`#E85450`) over everything, with UI alpha lowered to about 50%.

## 2. Typography

- **Font: m6x11 by Daniel Linssen (managore).** Balatro ships the extended **m6x11plus**: the modded wiki hosts `M6x11plus.woff`, and fontsinuse lists m6x11 in use in Balatro. Official source: https://managore.itch.io/m6x11 (free download, no pay-what-you-want gate). **Licence: "free to use with attribution"**, also embedded in m6x11plus name-ID 13. Credit it as "m6x11 font by Daniel Linssen".
  - `assets/fonts/m6x11.ttf`: 124 glyphs, basic Latin, upm 1024. Crisp at **16/32/48/64 px**.
  - `assets/fonts/m6x11plus.ttf`: 226 glyphs (Latin-1, accents, µ), upm 1152. Crisp at **18/36/54/72 px**.
  - Recommended CSS: `font-family: 'm6x11plus', 'Pixelify Sans', monospace; -webkit-font-smoothing: none; text-rendering: optimizeSpeed;`. Snap sizes with `--u: calc(100vh / 1080)` and `font-size: round(calc(36 * var(--u)), 1px)`.
- **Fallback:** Google Fonts **Pixelify Sans** (OFL 1.1, variable 400 to 700). Saved as `assets/fonts/PixelifySans-Variable.ttf` plus `OFL-PixelifySans.txt`. Alternatives: *Jersey 10* (condensed and chunky, closest silhouette), *Tiny5*, *Silkscreen*, *VT323*.
- **Sizes seen at 1080p (m6x11plus):**
  - Sidebar labels "Hands", "Round score", "Ante": about 28 to 32 px.
  - Blind name and hand name ("Two Pair"): about 48 px, with a small "lvl.1" at about 24 px.
  - Big numbers (chips/mult, Hands 3, $22, target 1,200): about 60 to 72 px.
  - Screen titles ("Must play 5 cards", "GAME OVER"): about 96 to 110 px.
- **Text shadow:** every UI string has a hard, unblurred drop shadow down-right: about `0.04em 0.07em 0 rgba(0,0,0,.35-.45)`. Measured on the 110 px title: about 4 px right, 6 px down, shade = background darkened about 40%. Coloured numbers keep the same black shadow.
- **Text motion (DynaText):** letters pop in one by one (scale 0 to 1.2 to 1, about 30 ms stagger). Floating titles do a slow per-letter sine bob (about 2 px, phase offset per letter). Score pop-ups rise about 20 px and fade over about 0.6 s.

## 3. Screen layouts (from the reference screenshots)

**Round screen** (`round-screen-big-blind-green-bg.jpg`, `round-screen-flaming-score-blue-bg.jpg`):
- **Left sidebar** is `x 0 to 485` (**25.3 % of the width**) and full height. Body `--c-panel`, with a **6 px strip on the right edge in the blind colour** (gold for Big Blind; boss-tinted for bosses). On boss rounds the whole sidebar body is tinted with the boss colour (blue `#243450` for The Eye). Inner blocks sit about 12 px apart, radius about 10 px, each with a 4 to 5 px hard bottom shadow. Top to bottom:
  1. **Blind header** (`y 15 to 85`): blind-coloured bar, white 48 px name.
  2. **Blind info** (`y 90 to 315`): background is the blind colour darkened (`#544418`). Contains an animated **blind chip** (about 130 px disc, pixel art, slowly rotating/bobbing) and an inset box reading "Score at least" / chip-icon + **red** target (64 px) / "to earn **$$$$**" in yellow. Boss variant adds a description line ("No repeat hand types this round").
  3. **Round score** (`y 335 to 415`): "Round / score" label on 2 lines, inset box with a white chip icon and white number.
  4. **Hand panel** (`y 435 to 660`, deepest inset `#182024`): hand name + level, then **chips box (blue, `x 25 to 212`) + red "X" + mult box (red, `x 270 to 455`)**, each about 185x95 px, radius 10, number right-aligned (chips) or left-aligned (mult). **Flames:** blue flame on chips and orange-red flame on mult when the hand's score will beat the blind. See the Eye screenshot, "340 X 21,600".
  5. **Bottom grid:**
     - Left column: **Run Info** (red, 140x160) and **Options** (orange, 140x165).
     - Right column (2 sub-columns): Hands (blue number) / Discards (red number); a full-width money box ("$22" yellow, 72 px); Ante "2/8" (orange, with a small "/8") / Round "4" (orange).
- **Jokers row:** `x 510 to 1440`, `y 15 to 260`, in a translucent darker rounded tray. Cards are about **175x240 px (9 % W x 22 % H)** and spread evenly; they overlap when there are many. Counter "4/5" under the bottom-left, 28 px.
- **Consumables tray:** `x 1460 to 1905`, `y 25 to 265`, counter "0/2" under the bottom-right.
- **Play area:** centre row `y 415 to 655`. Played cards are the same size as the joker cards, laid flat, each with a dark rectangular shadow. The hand name / "+10" / "X1.5 Mult" pop-up floats above at `y ~300 to 380`.
- **Hand:** a translucent tray at `x 530 to 1655`, `y 790 to 1035`. 8 cards fan and overlap about 15 %. Counter "4/8" is centred below.
- **Buttons** (visible while choosing, see `hand-closeup-sort-buttons.jpg`) sit centred under the hand:
  - **Play Hand = BLUE** (not orange), about 330x190 at close-up scale.
  - **Sort Hand**: a panel with a light outline, holding orange **Rank** and **Suit** buttons.
  - **Discard = RED**.
  - Disabled buttons are flat `#666` with grey text. A setting swaps Play/Discard sides.
- **Deck:** bottom-right, `x 1720 to 1905`, `y 780 to 1035`. The card back (Red Deck: red lattice on white) is drawn with 3 to 5 stacked offset copies for thickness. Counter "41/52" below. Skip-tags stack as small icons to the left (`x ~1815, y ~715`).

**Blind select** (`blind-select.png`): the sidebar top shows "Choose your next Blind". Three tall columns rise from the bottom edge, each about 260 px wide and about 60 % of the height:
- Each column has a coloured 4 px outline: blue (Small), gold (Big), boss colour.
- The active column is raised and brighter, with an orange **Select** button. Inactive columns show a grey "Upcoming".
- Contents, top to bottom: name pill in the blind colour; blind chip; inset "Score at least / ⊛ 300 (red) / Reward: $$$+"; "or"; a tag icon with a red **Skip Blind** button.
- The boss column adds a description and a gold footer: "Up the Ante / Raise all Blinds / Refresh Blinds".

**Cash out** (`cash-out.png`, `cash-out-settlement.jpg`): a panel slides up from the bottom centre (`x 670 to 1450`, dark `--c-panel`).
- Banner: big orange button **"Cash Out: $5"** (white 64 px).
- Row 1: blind chip + "Score at least ⊛300" + "$$$" on the right in yellow.
- A dotted white separator.
- Row 2: "**2** (blue) Remaining Hands ($1 each)" + "$$". Further rows: interest, then joker payouts.
- Rows reveal one by one, with a coin sound per `$`.

**Shop** (`shop-desktop.png`, `shop-celestial-pack.jpg`):
- The sidebar top becomes an animated **"SHOP" marquee**: gold chunky letters, a red frame with blinking bulbs, and the subtitle "Improve your run!" in gold.
- Main panel at the bottom centre with a **4 px red outline**. Top-left: **Next Round** (red) and **Reroll $5** (green) stacked. Top-right: a tray of 2 for-sale cards, each with a dark tab on top holding a yellow price ("$5").
- Bottom row: a voucher slot (label "ANTE 1 VOUCHER", vertical, faint) and 2 booster packs with price tabs.
- Hovering an item shows **Buy** / **Buy and Use** buttons beside it.
- Opening a pack hides the hand and shows the choices in the centre, with "Skip" below and a pack title panel ("Celestial Pack"). The background swaps to the pack's colour (purple for tarot, starfield for celestial).

**Main menu** (`main-menu.png`):
- Full-screen red/blue swirl. Huge **BALATRO** logo (off-white letters, dark teal outline, blue/red paint streaks) with a real **Ace of Spades card as the "A"**, plus a serpent/dagger ornament through it.
- Bottom bar: a dark `#385054` tray holding **PLAY** (blue, widest, 72 px text), **OPTIONS** (orange), **QUIT** (red), **COLLECTION** (green).
- Profile "P1" panel bottom-left. Language + Discord/X bottom-right. Version string top-right.
- The swirl keeps spinning. On PLAY, the new-run modal (`new-run-deck-select.png`) opens:
  - Tabs New Run / Continue / Challenges.
  - A deck carousel with big red arrow buttons.
  - A stake selector, a blue PLAY button, an orange Back bar.

**Game over / win** (`game-over.jpg`, `game-won.jpg`):
- The whole scene is washed red (background plus UI at about 50 % alpha). **Jimbo** (the default Joker) pops in with confetti and a white speech bubble ("I'm literally a fool, what's your excuse?").
- Centre panel with a light rim: title **GAME OVER** in chunky red about 110 px, with a dark shadow.
- Stat rows: light-grey pill label + dark value box with coloured number (Best Hand, Most Played Hand, Cards Played blue, Discarded red, Purchased yellow, Rerolled green, New Discoveries, Seed + blue "Copy"). Also Ante/Round and "Defeated By" + boss chip.
- Two stacked red buttons, New Run and Main Menu.
- Win: "YOU WIN!" in lavender-white and a blue **Endless Mode** button.
- Music slows to about 50 % (see §7).

**Panels in general:** these are *smooth* rounded rectangles (radius about 8 to 12 px at 1080p). Only the sprites and the font are pixel art, so a stepped pixel border is wrong. Each has a hard offset shadow (0 blur, about 4 to 6 px down, about 1 to 2 px sideways, black at 30 to 45 %). Balatro shifts shadows horizontally with **parallax** from the screen centre: shadow x ∝ (elementCenterX - screenCenterX). Buttons have no border. On press the button drops onto its shadow and plays `button`. Tooltips (see crop of Fibonacci/Ouija):
- light outer rim (`#D8D8D8`, 3 px) around a `--c-panel` body;
- white 48 px title;
- a white rounded inner box with dark `#4F6367` 32 px text, where keywords are coloured (`+4` red, ranks orange);
- a bottom **pill**: rarity for jokers, set colour for consumables ("Spectral").

## 4. Motion and feel (targets for motion/CSS)

Values marked (g) come from the widely circulated decompiled Balatro Lua (CardArea:align_cards, Moveable:juice_up). Treat them as approximate. 1 game unit ≈ card height / 2.75 ≈ 87 px at 1080p.

- **Hand fan (g):** for card k of n, `rot = 0.2*(k-(n+1)/2)/n` rad (about ±5.7° at the ends). Idle sway `+0.02*sin(2t + x)` rad (±1.15°, about 3 s period). Idle bob `0.03*sin(0.666t + x)` units (±2.6 px). Arc: end cards drop by `|0.5*(k-(n+1)/2)/n|` units (about 22 px). Jokers use about half the spread (`0.1`). The deck and play area have no sway. All idle motion turns off with "Reduced motion".
- **Selected card (g):** raised by `G.HIGHLIGHT_H = 0.2 * CARD_H` (about 48 px, 20 % of card height), no scale. `card1` click sound; deselect drops back.
- **Hover:** `juice_up(0.05, 0.03)`, a 5 % scale pop plus a small rotation wobble that decays, and `paper1` at random pitch 0.9 to 1.1. The card also tilts in 3D toward the cursor. Balatro fakes this in the vertex shader by pushing `w` per vertex from the mouse offset, which gives perspective skew; the equivalent is about 8 to 12° max. The tooltip appears beside it. The shadow grows and offsets further (lift).
- **Movement:** every object springs toward a target transform (visible T eases to target T, with slight overshoot). Suggested motion spring: `{type:'spring', stiffness: 450, damping: 30, mass: 0.8}`. Dragging a card makes it follow with lag and rotate by horizontal velocity (`rotate = clamp(vx*0.05, -15°, 15°)`).
- **Juice / jiggle (g):** `juice_up(s, r)` runs for 0.4 s. `scale = 1 + s*sin(50.8·t)*decay³` and `rot = r*sin(40.8·t)*decay²`, where decay = remaining/0.4. That is about 8 Hz and damped. Jokers trigger with `s ≈ 0.5-0.7`, cards with `s ≈ 0.3`. Use it for every trigger, purchase and number change.
- **Dealing:** cards fly from the deck to their fan slots one at a time, about 0.08 to 0.1 s apart at 1x game speed. They start face-down and **flip** (scaleX 1 to 0 to 1, swapping the face at 0) on arrival. Sound: `cardSlide1/2` with random pitch.
- **Play sequence (1x speed):**
  1. Selected cards slide up to the centre row (about 0.3 s, staggered).
  2. The hand name + chips × mult appear in the sidebar.
  3. Each **scoring** card, left to right: jiggle, then a blue **"+N"** pop-up above it, and the chips box ticks and jiggles (`chips1`).
  4. Held-in-hand effects run.
  5. **Jokers**, left to right: jiggle + a pop-up under or over the joker, red "+4 Mult" (`multhit1`) or "X1.5 Mult" (`multhit2`, heavier), money in yellow "+$3" (`coin`).
  6. Each event takes about 0.35 to 0.5 s, and the **pitch rises about 5 to 10 % per successive event**.
  7. The blue and red boxes pulse, then the total **counts up** into Round score (about 0.6 to 1 s ease-out, fast tick sound).
  8. Played cards slide off to the right (discard pile) and new cards are dealt.
- **Flaming score:** when this hand's chips×mult ≥ the blind requirement (and more so as it exceeds it), fire sprites/shaders burn on top of both boxes: blue flame on chips, orange/red on mult. Intensity ∝ log of the overshoot. There is also a crackling `ambientFire` loop, and the background swirl speeds up and brightens.
- **Screen shake:** the room "jiggles" on big scores and boss triggers. The setting is 0 to 100, default 30 %. Use 2 to 8 px translate + ±0.5° rotate noise, decaying over 0.2 to 0.5 s, scaled by log(score).
- **Third-party approximations** (blakecrosley.com guide; tune by eye): hover `translateY(-12px) scale(1.05)`, selected `translateY(-24px) scale(1.08)`, shake small/medium/large 0.2/0.3/0.5 s (large with ±1°).
- **Game speed** (0.5/1/2/4) should scale every duration. Keep all timings in a `speed`-aware store.

## 5. CRT and post effects

- **Balatro settings** (balatrowiki Settings): CRT 0 to 100 % (**default 70 %** desktop), CRT Bloom on/off (default on), Shadows on/off, Pixel-art smoothing (default on), Screenshake 30 %.
- **Its CRT pass** (per decompiled `game.lua`; unverified detail):
  - barrel distortion `distortion_fac ≈ (1+0.07c, 1+0.1c)` and a slight `scale_fac` shrink, with feathered edges;
  - scanlines at about **0.75 lines per canvas pixel** row, intensity `0.16c`;
  - fine noise `0.001c`;
  - optional bloom;
  - a tiny RGB split at the edges;
  - an overall contrast/saturation boost (visible in all screenshots).
  - Here `c` = CRT%/100.
- **CSS approximation** (DOM UI, cheap):
  - `#root{filter:contrast(1.08) saturate(1.15)}`
  - overlay `::after{pointer-events:none; background:repeating-linear-gradient(to bottom, rgba(0,0,0,.12) 0 1px, transparent 1px 3px), radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,.35) 100%); mix-blend-mode:multiply}`
  - animated noise: a tiny tiled PNG or SVG `feTurbulence` at 3 to 4 % opacity, stepped every 60 ms;
  - chromatic aberration only on big titles: `text-shadow: 1px 0 rgba(255,0,60,.35), -1px 0 rgba(0,160,255,.35), <hard shadow>`;
  - bloom-ish glow: `filter: drop-shadow(0 0 6px color-mix(in srgb, currentColor 40%, transparent))` on bright buttons and flames.
  - Barrel distortion is not practical on DOM (an SVG `feDisplacementMap` is possible but slow), so skip it.
- **WebGL** (only if we render to a canvas): a `postprocessing` `EffectComposer` with a custom `Effect`:
  - `mainUv`: `uv = .5 + (uv-.5)*(1.+k*dot(uv-.5,uv-.5))`, k≈0.06 to 0.1;
  - `mainImage`: sample R/B at ±0.0015 offsets, multiply `0.9+0.1*sin(uv.y*res.y*π*0.75)`, add hash noise ±0.015, vignette `smoothstep(.85,.3,length(uv-.5))`;
  - plus `BloomEffect({mipmapBlur:true, luminanceThreshold:.6, intensity:.5})`.
  - The react-bits background already pixelates via `pixelFilter`.
  - A good hybrid: WebGL only for the background and flames, DOM for everything else with the CSS overlay on top.

## 6. Card design and editions

- **Sprites:** playing cards, jokers, tarots, planets and spectrals are **71x95 px** cells (ratio 0.747; wiki 2x = 142x190). Booster packs are 57x93 (wiki 114x186). Blind chips and tags are about 34x34 cells (32 px art). Render at an integer scale with `image-rendering: pixelated`: 2x = 142x190, 3x = 213x285. On screen at 1080p cards are about 175x240 (about 2.5x).
- **Playing card:**
  - pure-white face (`#FFF`), corners rounded about 6 % of the width, 1 px light-grey edge;
  - rank glyph + small pip in the top-left corner, rotated 180° in the bottom-right;
  - big pixel pips in the classic layout (Ace = one huge pip);
  - face cards (J/Q/K) have a framed, colourful 2-colour-suit portrait;
  - suit colours are SO_1 (pink-red hearts, orange diamonds, indigo spades, dark-teal clubs);
  - the drop shadow is a dark semi-transparent copy offset down about 4 to 6 % of card height, with parallax.
  - Enhancements replace the face background: Bonus/Mult (blue/red border motifs), Wild (rainbow), Glass (translucent streaks), Steel (grey metal), Stone (grey rock, no rank), Gold (gold), Lucky (green clover). See `enhanced-cards-collection.jpg`.
  - Seals are a small coloured wax blob in the top-right quarter.
- **Joker card:** a white card with a vertical "JOKER" pixel wordmark in the top-left and mirrored in the bottom-right (like a court index), with the art as a big central illustration. Some jokers are full-bleed (Bank card, DNA, dagger). The tooltip carries the rarity pill: **Common blue `#009DFF`**, **Uncommon green `#4BC292`**, **Rare red `#FE5F55`**, **Legendary purple `#B26CBB`**. Legendary art has floating parts animated separately.
- **Tarot:** cream/parchment card with a gold ornate frame, a Roman numeral top ("VIII") and a name plate bottom ("JUSTICE"), pixel illustration.
- **Planet:** dark teal-blue card with the planet sprite and a name plate ("MERCURY"). **Spectral:** blue/violet with an eerie symbol.
- **Booster pack:** a foil **chip-bag** shape with crimped top and bottom strips. Holographic purple/pink/cyan wrapper and a chunky outlined title ("ARCANA PACK", "JUMBO", "MEGA"). Packs **shimmer constantly** (booster shader) and bob.
- **Edition shaders** (Balatro GLSL; each is driven by time plus the card's hover/tilt, so the sheen moves as the card tilts):
  - **Foil:** desaturates and shifts to icy blue-silver. Concentric rings radiate from the card centre, with an angular sweep.
  - **Holographic:** a pink/magenta tint with a fine **hexagon/triangle grid** that sparkles as it moves.
  - **Polychrome:** a rainbow hue rotation across the card (RGB to HSL, hue += uv + time), saturation boost, strong greens and magentas.
  - **Negative:** lightness inverted and hue flipped (the face turns dark charcoal and the art gets neon-inverted colours), plus a moving diagonal **shine** band.
  - Other shaders: `dissolve` (burn-away with a coloured edge when destroyed or sold), `debuff` (desaturate + red X), `voucher` and `booster` shimmer.
- **CSS approximations** (layers on top of the card image; drive `--mx/--my` (0 to 1 pointer position) and `--rx/--ry` (tilt), as in the wavebeem MIT example):
  - *Tilt:* `transform: perspective(600px) rotateX(calc((.5 - var(--my))*16deg)) rotateY(calc((var(--mx) - .5)*16deg)) translateZ(0)`, with a `transition` only while leaving.
  - *Foil:* `repeating-radial-gradient(circle at calc(var(--mx)*100%) calc(var(--my)*100%), #bfe6ff 0 3%, #5a7fa8 5% 8%)` with `mix-blend-mode: color-dodge; opacity:.35`, plus `filter: saturate(.4) hue-rotate(180deg)` on the base.
  - *Holo:* a conic or repeating-linear gradient at 60° and 120° (`repeating-linear-gradient(60deg, #f0f 0 2px, transparent 2px 10px)` twice) masked by a radial spotlight at the pointer, `mix-blend-mode: overlay`, pink tint `#ff7ad9` at 25 %.
  - *Polychrome:* `linear-gradient(115deg, red, orange, yellow, lime, cyan, blue, magenta, red)` at `background-size:300%`. Animate `background-position` with time + `--mx`, then `mix-blend-mode: hue` (or `color`) with `opacity:.6`.
  - *Negative:* `filter: invert(1) hue-rotate(180deg) contrast(1.1)` on the art, plus a `linear-gradient(105deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%)` shine that sweeps with `background-position` every 3 s.
  - *Glare:* a white radial gradient at the pointer with `mix-blend-mode: soft-light`.
  - Pixel-crisp sprites plus smooth gradient layers look right. Clip every layer to the card's border-radius (`overflow:hidden`).
- **Small GLSL route:** render the card sprite as an OGL/three quad with a fragment shader taking `u_time`, `u_mouse` and `u_edition`. Foil = `sin(length(uv-.5)*90. + t*2.)`; poly = `hsl.x += uv.x*.5 + uv.y*.3 + t*.1`; holo = hex grid `abs(fract(uv*vec2(20.,11.5))-.5)`. Only worth it if cards live on a canvas.

## 7. Audio

- **Balatro's own sound design** (sound names from the game files, for mapping only):
  - cards: `cardSlide1/2`, `card1` (select), `paper1` (hover);
  - scoring: `chips1/2` (+chips), `multhit1` (+mult), `multhit2` (xmult), `coin1-7` (money);
  - UI: `button`, `generic1` (joker trigger), `tarot1/2`, `whoosh`, `crumple`, `cancel`;
  - editions: `foil1/2`, `holo1`, `polychrome1`, `negative`, `glass1-6`;
  - drama: `gong`, `timpani`, `explosion_buildup1`, `ambientFire1-3`, `win`, `voice1-11` (Jimbo babble).
  - Almost every sound plays with **random pitch ±10 %**, and scoring sounds **step up in pitch** through a hand.
- **Music:** 5 themes by **LouisF** (Luis Clemente), all in **7/4** and cross-faded by state (Main, Shop, Arcana pack, Celestial pack, Boss). They play at **70 % speed** in game, and **slow to 50 % with pitch drop on game over**. The OST is officially on the **Steam soundtrack DLC, Spotify** (album "Balatro (Original Game Soundtrack)"), YouTube and louisfmusic.com/balatro. It is copyrighted, so **not downloaded and not to be used**.
- **Our SFX:** 34 curated Kenney CC0 files in `assets/audio/sfx/` (mapping in the table below). Mimic Balatro in howler:
  - `sound.rate(0.9 + Math.random()*0.2)` per play;
  - for scoring chains, `rate(1 + i*0.06)`;
  - for jokers, `joker-trigger` + `mult-whoosh`;
  - for xmult, `xmult-bell` at rate 1.4 and volume 0.5.
- **Our music:** Kevin MacLeod "**Hep Cats**" (organ lounge, 90 bpm, a good main theme) and "**Chill Wave**" (synth, 100 bpm, good for the shop or packs), both CC BY 4.0 with attribution required. Play at `rate(0.85)` for the woozy Balatro feel. Crossfade between them per state, and ramp `rate` to 0.5 over 3 s on game over.
- **Other free options checked:** OpenGameArt "Music loop, strong, downtempo, seamless" by Nostromo (CC0, 12 MB WAV). FreePD.com is **offline** (archive.org mirror at archive.org/details/freepd). Also incompetech "Lobby Time", "Bossa Antigua", "Deadly Roulette" and "Airport Lounge" (all CC BY; Airport Lounge is 12 MB, so it would need re-encoding).

## 8. Libraries (npm latest, 2026-09-26)

| need | pick | version | notes |
|---|---|---|---|
| animation, springs, layout, gestures | **motion** (`motion/react`) | 13.4.4 (MIT) | `layout`/`layoutId` let cards fly hand → play area → discard. `useSpring`/`useMotionValue` drive per-pointer tilt without re-renders. `animate()` sequences the scoring timeline |
| hand drag-reorder | **motion `Reorder.Group` / `Reorder.Item`** (`axis="x"`) | same | Fine for one horizontal list with a few items, and gives spring physics for free. Its limits: one list only, weak keyboard a11y, and no drag between areas. **Use @dnd-kit** (`@dnd-kit/core` 6.3.1 + `@dnd-kit/sortable` 10.0.0, or the new `@dnd-kit/react` 0.5.0 pre-1.0) if we need jokers/consumables drag, sell-drop zones or cross-area moves. Combine it with a motion `layout` transition for the look |
| 3D card tilt | hand-rolled (motion values + CSS vars) | none | About 30 lines and full control. Otherwise `react-parallax-tilt` 1.7.345 (MIT, has a glare layer) or `vanilla-tilt` 1.8.1 |
| background shader | **ogl** | 1.0.11 (Unlicense) | react-bits Balatro component. Tiny |
| postprocessing (if canvas) | `postprocessing` 6.39.5 (Zlib) + `three` 0.186.1, or `@react-three/fiber` 9.8.1 + `@react-three/postprocessing` 3.1.2 | | Only if cards or effects move to WebGL. OGL has no bloom pipeline, so we would write the CRT pass by hand |
| 2D canvas alternative | `pixi.js` 8.21.0 + `@pixi/react` 8.0.5 (MIT) | | If DOM performance suffers with many particles/flames |
| audio | **howler** 2.2.4 (MIT) + `@types/howler` 2.2.13 | | Sprites, `rate()`, fades, Web Audio with HTML5 fallback. `use-sound` 5.0.0 is a thin React hook over howler |
| freehand drawing over image | **perfect-freehand** 1.2.3 (MIT) | | `getStroke(points,{size,thinning,smoothing,streamline})` gives an outline polygon; render it as an SVG path or `Path2D` on a canvas overlaid on the image. Use `konva` 10.7.0 / `react-konva` 19.3.0 for a full editable layer |
| math | **katex** 0.18.9 (MIT) | | Use `katex.renderToString` directly. `react-katex` 3.1.0 is old; prefer a 10-line wrapper. Import `katex/dist/katex.min.css` |
| state | zustand 5.0.15 | | Game store with a speed multiplier |
| alternatives | gsap 3.15.0 (now free, "standard no-charge" licence, not OSI), `@react-spring/web` 10.1.2 | | Motion covers everything, so no need |

## 9. React Bits Balatro component

Saved verbatim (TS + Tailwind variant, with a header comment) to `.claude/project-info/research/reactbits-balatro.tsx`. Source: `DavidHDev/react-bits`, `src/ts-tailwind/Backgrounds/Balatro/Balatro.tsx` (commit `c83b5e7`). Dependency `ogl`.

Props and defaults:
- `spinRotation = -2.0`, `spinSpeed = 7.0`, `offset = [0,0]`
- `color1 = '#DE443B'`, `color2 = '#006BB4'`, `color3 = '#162325'`
- `contrast = 3.5`, `lighting = 0.4`, `spinAmount = 0.25`, `pixelFilter = 745`, `spinEase = 1.0`
- `isRotate = false`, `mouseInteraction = true`

**Licence: "MIT + Commons Clause"** (© 2026 David Haz). It may be used inside an app, even a commercial one. It may not be sold or redistributed as a component. Caveats: every prop is in the effect deps, so changing a prop rebuilds the WebGL context. Memoise `offset`, and for animated colour changes refactor to update uniforms (`program.uniforms.uColor1.value = …`) instead.

## 10. Asset inventory

| file | what | source URL | licence |
|---|---|---|---|
| `assets/fonts/m6x11.ttf` | pixel font (Balatro family) | https://managore.itch.io/m6x11 | free with attribution (Daniel Linssen) |
| `assets/fonts/m6x11plus.ttf` | extended m6x11 (the one Balatro ships) | https://managore.itch.io/m6x11 | free with attribution |
| `assets/fonts/LICENSE-m6x11.txt` | attribution note | n/a | n/a |
| `assets/fonts/PixelifySans-Variable.ttf` + `OFL-PixelifySans.txt` | fallback pixel font | https://github.com/google/fonts/tree/main/ofl/pixelifysans | SIL OFL 1.1 |
| `assets/audio/sfx/card-deal-{1,2,3}.ogg` | card slide (deal/hover) | https://kenney.nl/assets/casino-audio (card-slide-1..3) | CC0 |
| `assets/audio/sfx/card-place-{1,2}.ogg` | card lands in play area | Kenney Casino Audio (card-place-1,2) | CC0 |
| `assets/audio/sfx/card-fan.ogg` | hand fan-out | Casino Audio card-fan-1 | CC0 |
| `assets/audio/sfx/card-discard.ogg` | discard / slide off | Casino Audio card-shove-1 | CC0 |
| `assets/audio/sfx/deck-shuffle.ogg` | deck shuffle (3 s) | Casino Audio card-shuffle | CC0 |
| `assets/audio/sfx/pack-open.ogg`, `pack-take-card.ogg` | booster open / pick | Casino Audio cards-pack-open-1, cards-pack-take-out-1 | CC0 |
| `assets/audio/sfx/chips-add-{1,2}.ogg`, `chips-collide.ogg`, `chips-stack.ogg`, `chips-tally.ogg` | +chips ticks, score tally | Casino Audio chip-lay-1/2, chips-collide-1, chips-stack-1, chips-handle-1 | CC0 |
| `assets/audio/sfx/coins-money.ogg`, `coin-single.ogg` | cash out / $ gain | https://kenney.nl/assets/rpg-audio (handleCoins, handleCoins2) | CC0 |
| `assets/audio/sfx/mult-whoosh.ogg`, `mult-whoosh-short.ogg` | +mult rising whoosh | https://kenney.nl/assets/digital-audio (phaserUp3, phaserUp7) | CC0 |
| `assets/audio/sfx/level-up.ogg` | planet level-up | Digital Audio powerUp7 | CC0 |
| `assets/audio/sfx/xmult-bell.ogg` | xmult / boss gong (pitch up) | https://kenney.nl/assets/impact-sounds (impactBell_heavy_000) | CC0 |
| `assets/audio/sfx/glass-break.ogg`, `impact-thud.ogg` | glass card break / heavy hit | Impact Sounds impactGlass_heavy_000, impactPunch_heavy_000 | CC0 |
| `assets/audio/sfx/joker-trigger.ogg` | joker jiggle pop | https://kenney.nl/assets/interface-sounds (maximize_008) | CC0 |
| `assets/audio/sfx/ui-click.ogg`, `ui-select-card.ogg`, `ui-deselect-card.ogg`, `ui-tick.ogg`, `ui-confirm.ogg`, `ui-error.ogg` | UI | Interface Sounds click_001, select_001, back_001, tick_001, confirmation_001, error_004 | CC0 |
| `assets/audio/sfx/ui-hover.ogg` | hover | https://kenney.nl/assets/ui-audio (rollover2) | CC0 |
| `assets/audio/sfx/jingle-win.ogg`, `jingle-lose.ogg` | sax jingles, rising / falling | https://kenney.nl/assets/music-jingles (jingles_SAX02, jingles_SAX07) | CC0 |
| `assets/audio/sfx/jingle-shop.ogg` | pizzicato jingle, rising | Music Jingles jingles_PIZZI12 | CC0 |
| `assets/audio/sfx/LICENSE-kenney-CC0.txt` | full name mapping + Kenney licence | n/a | CC0 |
| `assets/audio/music/hep-cats_kevin-macleod.mp3` | organ lounge loop, 4:11, 6.0 MB (re-encoded 192 kbps) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hep%20Cats.mp3 | **CC BY 4.0**, credit "Hep Cats" Kevin MacLeod (incompetech.com) |
| `assets/audio/music/chill-wave_kevin-macleod.mp3` | synth chillwave, 4:00, 7.3 MB | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Chill%20Wave.mp3 | **CC BY 4.0**, credit "Chill Wave" Kevin MacLeod |
| `assets/audio/music/ATTRIBUTION.txt` | required credit lines | n/a | n/a |
| `.claude/project-info/research/reactbits-balatro.tsx` | background shader component | https://github.com/DavidHDev/react-bits | MIT + Commons Clause |
| `assets/references/round-screen-big-blind-green-bg.jpg` | full round HUD, +10 pop-up | Steam store ss_96208723… | © LocalThunk/Playstack, research-only |
| `assets/references/round-screen-flaming-score-blue-bg.jpg` | boss The Eye, flames, X1.5 Mult | Steam ss_3be65a7d… | research-only |
| `assets/references/round-screen-boss-blind-magenta-bg.jpg` | The Goad, Ouija tooltip | Steam ss_d8bca9a6… | research-only |
| `assets/references/hand-closeup-sort-buttons.jpg` | hand fan, Play/Sort/Discard | Steam ss_075cb45c… | research-only |
| `assets/references/jokers-row-tooltip-red-bg.jpg` | joker row, Fibonacci tooltip, selected cards | Steam ss_20435035… | research-only |
| `assets/references/tarot-pack-open-purple-bg.jpg` | Arcana pack opening | Steam ss_4862112e… | research-only |
| `assets/references/shop-celestial-pack.jpg` | SHOP sidebar + Celestial pack | Steam ss_ddee1303… | research-only |
| `assets/references/booster-packs-art.jpg` | 8 booster pack arts | Steam ss_b8455573… | research-only |
| `assets/references/joker-collection.jpg` | 15 joker designs | Steam ss_e32ac94d… | research-only |
| `assets/references/deck-view-overlay.jpg` | deck overview modal | Steam ss_ae055e0e… | research-only |
| `assets/references/run-info-poker-hands.jpg` | Run Info, hand levels | Steam ss_e52b658e… | research-only |
| `assets/references/challenges-menu.jpg` | challenge list modal | Steam ss_5ab29592… | research-only |
| `assets/references/main-menu.png` | title screen 2560x1440 | https://balatrowiki.org/images/Main_menu_(desktop).png | research-only |
| `assets/references/blind-select.png` | blind select | https://balatrowiki.org/images/BlindSelect.png | research-only |
| `assets/references/cash-out.png`, `cash-out-settlement.jpg` | cash-out panel | balatrowiki CashOut.png, End-of-Round_Settlement.jpg | research-only |
| `assets/references/shop-desktop.png` | shop 2560x1440 | balatrowiki Screenshot_in_shop.png | research-only |
| `assets/references/game-over.jpg`, `game-won.jpg` | lose / win screens | balatrowiki Player_losing_the_game.jpg, Player_winning_the_game.jpg | research-only |
| `assets/references/new-run-deck-select.png` | new-run modal | balatrowiki NewRun.png | research-only |
| `assets/references/editions-collection.jpg` | base/foil/holo/poly/negative joker | balatrowiki Editions_collection.jpg | research-only |
| `assets/references/enhanced-cards-collection.jpg` | 8 enhancements | balatrowiki Enhanced_card_collection.jpg | research-only |
| `assets/references/playing-cards-spades.png` | full spade suit (card layout, scanlines visible) | balatrowiki Balatro_Playing_Cards_Spades.png | research-only |

Steam screenshot base URL: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2379780/ss_<hash>.1920x1080.jpg`. The balatrowiki MediaWiki API (`/api.php?action=query&list=allimages&aiminsize=80000`) lists more screenshots (Combo_1-3, Decks, collections). Mobbin MCP was not used because it covers app UI, not games.
