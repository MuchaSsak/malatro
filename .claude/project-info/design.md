# Design — Malatro

Owner of art direction, tokens, motion and the graphics-quality system as actually implemented.
Full research (colour sampling, screen layouts, edition shaders, audio design) lives in
`research/balatro-visuals-and-assets.md`; this page is what the code does with it. See `assets.md`
for licences and file inventory.

## Palette tokens

Defined as RGB-channel CSS vars on `:root` in `src/styles.css`, exposed to Tailwind via
`channel(name) => rgb(var(--m-${name}) / <alpha-value>)` in `tailwind.config.ts`, so opacity
modifiers (`bg-red/50`) work. [repo: src/styles.css], [repo: tailwind.config.ts]

| Token | Value | Tailwind class |
| --- | --- | --- |
| `--m-red` | `254 95 85` | `text-red` / `bg-red` |
| `--m-blue` | `0 157 255` | `bg-blue` |
| `--m-green` | `75 194 146` | `bg-green` |
| `--m-orange` | `253 162 0` | `bg-orange` |
| `--m-important` | `255 154 0` | `text-important` |
| `--m-money` | `243 185 88` | `text-money` |
| `--m-gold` | `234 192 88` | `bg-gold` |
| `--m-purple` | `136 103 165` | `bg-purple` |
| `--m-panel` / `--m-panel-light` | `55 66 68` / `79 99 103` | `bg-panel`, `bg-panel-light` |
| `--m-grey` | `95 115 119` | `bg-grey` |
| `--m-inset` / `--m-inset-deep` | `30 43 46` / `24 32 36` | `bg-inset`, `bg-inset-deep` |
| `--m-inactive` | `102 102 102` | `bg-inactive` |
| `--m-outline` | `216 216 216` | `border-outline` |
| `--m-tarot` / `--m-planet` / `--m-voucher` / `--m-booster` | consumable/set accent colours | `bg-tarot` etc. |
| `--m-ink` / `--m-paper` | dark text on white / card white | `text-ink`, `bg-paper` |

These match the "screen" hex values sampled in `research/balatro-visuals-and-assets.md` §1, not the
raw `G.C` source hexes (the CRT grade darkens/saturates them — see Post effects below).

## Typography

- Primary: **m6x11plus** (`public/fonts/m6x11plus.ttf`), `@font-face` with `font-display: block` so
  no fallback flash happens before the pixel font is ready. `index.html` preloads it.
- Fallback: **Pixelify Sans** (variable, `public/fonts/PixelifySans-Variable.ttf`), `font-display: swap`.
- `font-family: pixel` in Tailwind resolves to `m6x11plus, Pixelify Sans, monospace`.
- `-webkit-font-smoothing: none` globally — keeps the pixel font crisp instead of anti-aliased.
- Hard drop-shadow utility classes `.tx` / `.tx-lg` (`text-shadow: .05em .08em 0 rgba(0,0,0,.4)`)
  approximate Balatro's unblurred down-right text shadow. [repo: src/styles.css]
- KaTeX text inside cards uses `.card-tex` (`Pixelify Sans` — proportional, more legible for math
  than the pixel font at small sizes). [repo: src/styles.css]

## Stage (fixed-resolution, letterboxed)

`src/components/layout/Stage.tsx` lays the whole game out on a **fixed 1920x1080** coordinate space
(`STAGE_W`/`STAGE_H`), then scales it to fit the window:

- `scale = min(innerWidth/1920, innerHeight/1080)`, recomputed on `resize`.
- Outer wrapper: `absolute inset-0 flex items-center justify-center overflow-hidden` — centers the
  scaled box regardless of aspect ratio (this is the fix for the centering bug noted in `log.md`;
  the current implementation centers with flexbox, not CSS grid `place-items`, but achieves the same
  result — letterboxing without content bleeding into the bars).
  [repo: src/components/layout/Stage.tsx]
- Inner layer is the real 1920x1080 box, `transform: scale(...)`, `transformOrigin: "0 0"`.
- `useStageScale()` exposes the current scale to anything that needs pixel-accurate math (rare;
  most components use the fixed 1920x1080 coordinates directly via absolute positioning).

## Background swirl shader

`src/components/layout/BalatroBackground.tsx`, adapted from React Bits' MIT+Commons-Clause
"Balatro" component (`research/reactbits-balatro.tsx`), itself a port of LocalThunk's paint-swirl
shader. Changes from upstream:

- The WebGL context (via `ogl`) is created **once**; colour/speed/contrast/lighting ease toward new
  target values every frame instead of tearing down and rebuilding the renderer on every prop
  change (upstream's effect-deps array would do that).
- **Grading moved into the shader**: the CRT-style contrast/saturation boost (`+6%`/`+12%`) is
  computed per-pixel at the end of the fragment shader, not as a CSS `filter` on the whole scene —
  cheaper, since a CSS filter would force the browser to recomposite every layer every frame.
- Named `PALETTES` per game state (`menu`, `blind`, `shop`, `sciagi`, `twierdzenia`, `jokery`,
  `zadania`, `gameover`, `won`) plus `bossPalette(color)` which derives two darker shades from the
  boss's colour. `App.tsx`'s `backgroundFor()` picks the palette from `run.phase`.
  [repo: src/components/layout/BalatroBackground.tsx], [repo: src/App.tsx]

## CRT overlay

`.crt::before`/`.crt::after` pseudo-elements on the app root (`src/styles.css`): scanline gradient +
vignette, and an animated SVG `feTurbulence` noise layer, both scaled by the `--crt` CSS variable
(0-1, from `settings.crt`, default `0.6`, set live in `SettingsContext`). Chromatic aberration and
barrel distortion from the research notes were **not** implemented (DOM-only approach).

## Pixel cursors

Generated by `scripts/make-cursors.py` → `public/cursors/{arrow,pointer,grab,pen}.png` (16x16 sprite,
2x nearest-neighbour scaled to 32x32, hotspot baked into the CSS `url(...) x y` value). Swapped at
runtime via `:root[data-cursor="pixel"]` vs. the system default, controlled by `settings.isPixelCursor`.
[repo: src/styles.css], [repo: scripts/make-cursors.py]

## Cards, jokers, editions

Components: `src/components/cards/{TaskCard,JokerCard,ConsumableCard,PackCard,VoucherCard,CardBack,Tilt,TaskInfo,cardInfo}.tsx`.

- **Tilt** (`Tilt.tsx`): pointer-driven 3D tilt via `motion` springs (`rotateX`/`rotateY`, stiffness
  300/damping 20) plus a hover lift spring; also writes `--mx`/`--my` CSS vars so edition sheen
  layers track the pointer. Idle cards additionally get a CSS-only `.sway` class (transform-only
  keyframes, so a whole hand swaying doesn't tick JS every frame).
- **Editions** (`Edition = "foil" | "holo" | "poly" | "negative"`, `types.ts`): pure CSS `::after`
  layers (`.ed-foil`, `.ed-holo`, `.ed-poly`, `.ed-negative` in `styles.css`) — radial/linear
  gradients with `mix-blend-mode`, matching the research's CSS-approximation recipes rather than a
  GLSL-per-card approach.
- **Juice** (`src/components/ui/Juice.tsx`): Balatro's `juice_up` damped scale/rotation wobble on any
  scoring trigger, plus floating `+N` pop-ups (`fx.ts` event bus), colour-coded by `Popup["tone"]`
  (chips=blue, mult/xmult=red, money=gold, good=green, bad=grey).

## Graphics presets

`src/lib/graphics.ts` — trades off the two expensive parts of a frame (the full-screen shader and
backdrop-blur/repaint-heavy CSS), while transform-only animation (tilt, jiggle) stays on always.

| Preset | Swirl downscale | Swirl fps (normal / covered by viewer) | Task-viewer blur | Sheen / noise / idle sway |
| --- | --- | --- | --- | --- |
| `high` | 1/2 resolution | 60 / 30 | `backdrop-filter: blur(3px)` on the viewer scrim | on |
| `medium` | 1/3 resolution | 30 / 15 | none | on |
| `low` | 1/5 resolution | 20 / 0 (paused when covered) | none | **off** (`.crt::after`, `.ed-poly`, `.ed-negative`, `.pack-foil`, `.sway`, `.sheen` all set `animation: none`) |

`detectGraphics()` defaults new users to `medium` when `navigator.hardwareConcurrency <= 4` or
`deviceMemory <= 4`, else `high`. The preset is applied via `data-gfx` on `<html>`, read by both
`styles.css` selectors and `BalatroBackground`'s `profile` prop — no component re-renders for a
preset change. [repo: src/lib/graphics.ts], [repo: src/contexts/SettingsContext.tsx]

**Reduced motion** (`data-motion="reduced"`, from the settings toggle, independent of graphics
preset) stops the same decorative loop classes, plus `.logo-bob`/`.logo-card`; a bare CSS
`@media (prefers-reduced-motion: reduce)` query also covers users who never opened Settings.

## Motion rules

- Card/hand physics: `motion/react` springs, typically `stiffness: 420, damping: 32` for dealing,
  lighter for hover/tilt (`stiffness: 300, damping: 20`). Hand reordering uses `Reorder.Group`/`Item`
  (`axis="x"`).
- Played-hand scoring events, screen shake on big scores, and joker "on scored" pop-ups run through
  `PlaybackContext`/`fx.ts`, mirroring Balatro's staggered reveal timeline documented in
  `research/balatro-visuals-and-assets.md` §4.
- Sounds are pitched per event via `audio.play(name, { step })` (rate `0.92-1.08` base, `+6%` per
  step in a chain) — see `assets.md`.

## Do / don't

- Do keep decorative CSS animations on the `background-position`/`transform` properties only, so the
  `low` preset and reduced-motion can cut them with a single `animation: none`.
- Do drive card tilt/jiggle with `motion` values, not React state, to avoid re-renders per pointer move.
- Don't reintroduce a whole-scene CSS `filter` for CRT grading — it was deliberately moved into the
  shader for performance (see Background swirl shader above).
- Don't ship any Balatro-original asset (font, sprite, sound, OST) — see `assets.md` for what is and
  isn't licensed for this project.
