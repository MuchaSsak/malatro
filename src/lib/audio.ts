/**
 * Sound manager over howler. Balatro plays nearly every sound at a random +-10% pitch and
 * steps pitch up through a scoring chain; `play(name, { step })` mimics that.
 */
import { Howl, Howler } from "howler";

const SFX = {
  deal: ["card-deal-1", "card-deal-2", "card-deal-3"],
  place: ["card-place-1", "card-place-2"],
  fan: ["card-fan"],
  discard: ["card-discard"],
  shuffle: ["deck-shuffle"],
  pack: ["pack-open"],
  pick: ["pack-take-card"],
  chips: ["chips-add-1", "chips-add-2"],
  chipsCollide: ["chips-collide"],
  tally: ["chips-tally"],
  stack: ["chips-stack"],
  coin: ["coin-single"],
  coins: ["coins-money"],
  mult: ["mult-whoosh-short"],
  multBig: ["mult-whoosh"],
  xmult: ["xmult-bell"],
  levelup: ["level-up"],
  glass: ["glass-break"],
  thud: ["impact-thud"],
  joker: ["joker-trigger"],
  click: ["ui-click"],
  hover: ["ui-hover"],
  select: ["ui-select-card"],
  deselect: ["ui-deselect-card"],
  tick: ["ui-tick"],
  confirm: ["ui-confirm"],
  error: ["ui-error"],
  win: ["jingle-win"],
  lose: ["jingle-lose"],
  shop: ["jingle-shop"],
} as const;

export type SfxName = keyof typeof SFX;

/**
 * Soundtrack: each mood is a playlist (files in /audio/music/<slug>_kevin-macleod.mp3). The first
 * track opens, the rest play shuffled, reshuffling on wrap. Tracks never use howler's `loop` —
 * with html5 audio that loops on a setTimeout that drifts/gets throttled and leaves the music
 * stopped; advancing on the native `end` event is reliable.
 */
const PLAYLISTS = {
  main: [
    "hep-cats",
    "local-forecast-elevator",
    "cool-vibes",
    "groove-grove",
    "funkorama",
    "backbay-lounge",
    "airport-lounge",
    "sneaky-snitch",
    "investigations",
    "smooth-lovin",
    "night-on-the-docks-sax",
  ],
  shop: [
    "chill-wave",
    "bossa-antigua",
    "lobby-time",
    "sidewalk-shade",
    "casa-bossa-nova",
    "easy-lemon",
    "wallpaper",
    "carefree",
    "deliberate-thought",
  ],
} as const;
export type MusicName = keyof typeof PLAYLISTS;

type Channel = { order: string[]; index: number; howl: Howl | null; pauseTimer?: number; failures: number };

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class AudioManager {
  private cache = new Map<string, Howl>();
  private channels = new Map<MusicName, Channel>();
  private current: MusicName | null = null;
  private sfxVolume = 0.7;
  private musicVolume = 0.35;
  private musicRate = 0.9;
  private isUnlocked = false;

  setVolumes(sfx: number, music: number) {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    if (this.current) this.channels.get(this.current)?.howl?.volume(music);
  }

  private howl(file: string): Howl {
    let h = this.cache.get(file);
    if (!h) {
      h = new Howl({ src: [`/audio/sfx/${file}.ogg`], preload: true, volume: 1 });
      this.cache.set(file, h);
    }
    return h;
  }

  play(name: SfxName, opts: { step?: number; volume?: number; rate?: number } = {}) {
    if (this.sfxVolume <= 0) return;
    const files = SFX[name];
    const file = files[Math.floor(Math.random() * files.length)];
    const h = this.howl(file);
    const id = h.play();
    const rate = (opts.rate ?? 0.92 + Math.random() * 0.16) * (1 + (opts.step ?? 0) * 0.06);
    h.rate(Math.min(3, rate), id);
    h.volume(this.sfxVolume * (opts.volume ?? 1), id);
  }

  /** Browsers block audio until a user gesture; the first click unlocks and starts music. */
  unlock() {
    if (this.isUnlocked) return;
    this.isUnlocked = true;
    Howler.autoUnlock = true;
    if (this.current) this.startMusic(this.current);
  }

  playMusic(name: MusicName) {
    if (this.current === name) return;
    const prev = this.current;
    this.current = name;
    if (prev) {
      const ch = this.channels.get(prev);
      const p = ch?.howl;
      if (ch && p) {
        p.fade(p.volume(), 0, 800);
        window.clearTimeout(ch.pauseTimer);
        ch.pauseTimer = window.setTimeout(() => p.pause(), 850);
      }
    }
    if (this.isUnlocked) this.startMusic(name);
  }

  private channel(name: MusicName): Channel {
    let ch = this.channels.get(name);
    if (!ch) {
      const [first, ...rest] = PLAYLISTS[name];
      ch = { order: [first, ...shuffle(rest)], index: 0, howl: null, failures: 0 };
      this.channels.set(name, ch);
    }
    return ch;
  }

  private load(name: MusicName, ch: Channel): Howl {
    const h = new Howl({
      src: [`/audio/music/${ch.order[ch.index]}_kevin-macleod.mp3`],
      html5: true,
      volume: 0,
      onplay: () => (ch.failures = 0),
      onend: () => this.nextTrack(name, ch),
      onloaderror: () => this.nextTrack(name, ch, true),
      onplayerror: () => this.nextTrack(name, ch, true),
    });
    ch.howl = h;
    return h;
  }

  private nextTrack(name: MusicName, ch: Channel, isFailure = false) {
    ch.howl?.unload();
    ch.howl = null;
    if (isFailure && ++ch.failures >= ch.order.length) return; // every file broken: stay silent
    ch.index += 1;
    if (ch.index >= ch.order.length) {
      const last = ch.order[ch.order.length - 1];
      let next = shuffle(ch.order);
      if (next[0] === last) next = [...next.slice(1), last];
      ch.order = next;
      ch.index = 0;
    }
    if (this.current === name && this.isUnlocked) this.startMusic(name);
  }

  private startMusic(name: MusicName) {
    const ch = this.channel(name);
    window.clearTimeout(ch.pauseTimer);
    const h = ch.howl ?? this.load(name, ch);
    h.rate(this.musicRate);
    if (!h.playing()) h.play();
    h.fade(h.volume(), this.musicVolume, 1200);
  }

  /** Game over: music slows down like in Balatro. */
  slowMusic(isSlow: boolean) {
    this.musicRate = isSlow ? 0.6 : 0.9;
    if (this.current) this.channels.get(this.current)?.howl?.rate(this.musicRate);
  }
}

export const audio = new AudioManager();
