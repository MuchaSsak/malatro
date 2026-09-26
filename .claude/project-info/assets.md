# Assets — Malatro

Owner of the shipped asset inventory, licences and sourcing policy. Full provenance (URLs, why each
file was picked) lives in `research/balatro-visuals-and-assets.md` §10; this page is what actually
shipped under `public/` (served to the browser) versus what stays research-only under the repo-root
`assets/` (not served — see `.gitignore`/build: `public/` is the only folder Vite copies as-is).

## Sourcing policy

This is a private, non-commercial fan project; the user has explicitly said grabbing third-party
assets for personal use is acceptable **[user, project-brief.md]**. Even so, nothing that is
Balatro's own shipped file (font, sprite, sound, music) is used — everything below is either an
independent asset with a compatible free licence, or generated in-repo. Reference screenshots of the
real game are kept for research only and are never copied into `public/`.

## Fonts (`public/fonts/`)

| File | What | Licence |
| --- | --- | --- |
| `m6x11plus.ttf` | Primary pixel font (the exact family Balatro ships) | Free to use with attribution — "m6x11 font by Daniel Linssen" (managore.itch.io/m6x11) |
| `m6x11.ttf` | Base m6x11 (unused in CSS today; kept alongside the Plus variant) | Same as above |
| `PixelifySans-Variable.ttf` | Fallback pixel font | SIL OFL 1.1 |

Attribution text lives at `assets/fonts/LICENSE-m6x11.txt` and `assets/fonts/OFL-PixelifySans.txt`
(repo root `assets/`, not `public/`). **Credit m6x11 by Daniel Linssen wherever in-game credits are
shown** (Options screen, per project-brief). [research: balatro-visuals-and-assets.md §2]

## Audio (`public/audio/`)

34 SFX files (`public/audio/sfx/*.ogg`), all **Kenney, CC0**, sourced from the Casino Audio, Digital
Audio, Impact Sounds, Interface Sounds, Music Jingles and RPG Audio packs — full name mapping in
`research/balatro-visuals-and-assets.md` §10 and mirrored in `assets/audio/sfx/LICENSE-kenney-CC0.txt`.
Played through `src/lib/audio.ts` (`AudioManager`), randomised pitch ±8% and stepped per scoring
chain, matching Balatro's own sound feel without reusing any of its files.

Music (`public/audio/music/`):

All tracks: Kevin MacLeod (incompetech.com), CC BY 4.0, file name `<slug>_kevin-macleod.mp3`.
Two playlists in `src/lib/audio.ts` (`PLAYLISTS`): first track opens, the rest play shuffled and
reshuffle on wrap; each playlist resumes where it left off when the mood switches back.

| Playlist | Used for | Tracks |
| --- | --- | --- |
| `main` | Menu, blind select, rounds, cash-out (`audio.playMusic("main")`) | Hep Cats, Local Forecast - Elevator, Cool Vibes, Groove Grove, Funkorama, Backbay Lounge |
| `shop` | Shop + pack opening (`audio.playMusic("shop")`) | Chill Wave, Bossa Antigua, Lobby Time, Sidewalk Shade |

Tracks never use howler `loop`: with `html5: true` howler loops on a `setTimeout` that drifts or
gets throttled, which left the music silently stopped after the first pass. Advancing on the
native `end` event fixes that. All play at `rate(0.9)` for the woozy Balatro feel and slow further
on game over (`audio.slowMusic`). The 8 newer tracks are re-encoded to 128 kbps. Required attribution text: `assets/audio/music/ATTRIBUTION.txt`.
**The Balatro OST itself is not used anywhere** (it is commercial, sold separately on Steam/Spotify).

## Cursors (`public/cursors/`)

`arrow.png`, `pointer.png`, `grab.png`, `pen.png` — generated in-repo by `scripts/make-cursors.py`
(pixel-art, no external asset, no licence question). Regenerate with `python scripts/make-cursors.py`.

## Task crops (`public/tasks/`, `public/data/`)

150 exam folders under `public/tasks/<exam>/<task>.webp` (2,505 included crops total) plus
`public/data/tasks.json` and `public/data/statements/<exam>.json` — all derived from official **CKE**
(Centralna Komisja Egzaminacyjna) matura exam and answer-key PDFs. Per the user, this is personal,
non-commercial use of publicly published exam material **[user, project-brief.md]**; raw source PDFs
themselves are gitignored (`data-pipeline/raw/`) and never committed — see `technologies.md` and
`data-model.md` for the pipeline that produces the crops.

## Third-party code with a licence condition

| Component | Source | Licence | Constraint |
| --- | --- | --- | --- |
| Background swirl shader (`src/components/layout/BalatroBackground.tsx`, adapted from `research/reactbits-balatro.tsx`) | React Bits "Balatro" (`DavidHDev/react-bits`), itself a port of LocalThunk's Balatro shader | MIT + Commons Clause v1.0 (c) David Haz | Usable inside the app (even commercially); must **not** be sold/sublicensed/redistributed as a standalone component. Keep the copyright notice in the source comment (already present). |

## Research-only (repo root `assets/references/`, never shipped)

23 Steam/balatrowiki screenshots of the real Balatro (main menu, blind select, shop, editions,
enhancements, etc.), used only to derive the colour/layout/motion research in
`research/balatro-visuals-and-assets.md`. Confirmed **not** copied into `public/` or `dist/` — do
not add them there; they are copyrighted (© LocalThunk/Playstack) and research-only.

## In-game credits

`src/components/game/OptionsPanel.tsx` shows a credits string at the bottom of Options: font
(Daniel Linssen), every music title above with "Kevin MacLeod (incompetech.com) CC BY 4.0", SFX
Kenney (CC0), background React Bits Balatro, tasks CKE. [repo: src/components/game/OptionsPanel.tsx]
This matches the table above; keep both in sync if a new asset with an attribution requirement is added.
