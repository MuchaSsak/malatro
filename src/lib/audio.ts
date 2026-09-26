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

const MUSIC = {
  main: "/audio/music/hep-cats_kevin-macleod.mp3",
  shop: "/audio/music/chill-wave_kevin-macleod.mp3",
} as const;
export type MusicName = keyof typeof MUSIC;

class AudioManager {
  private cache = new Map<string, Howl>();
  private music = new Map<MusicName, Howl>();
  private current: MusicName | null = null;
  private sfxVolume = 0.7;
  private musicVolume = 0.35;
  private isUnlocked = false;

  setVolumes(sfx: number, music: number) {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    if (this.current) this.music.get(this.current)?.volume(music);
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
      const p = this.music.get(prev);
      if (p) {
        p.fade(p.volume(), 0, 800);
        setTimeout(() => p.pause(), 850);
      }
    }
    if (this.isUnlocked) this.startMusic(name);
  }

  private startMusic(name: MusicName) {
    let h = this.music.get(name);
    if (!h) {
      h = new Howl({ src: [MUSIC[name]], loop: true, html5: true, volume: 0 });
      this.music.set(name, h);
    }
    h.rate(0.9);
    if (!h.playing()) h.play();
    h.fade(0, this.musicVolume, 1200);
  }

  /** Game over: music slows down like in Balatro. */
  slowMusic(isSlow: boolean) {
    if (!this.current) return;
    this.music.get(this.current)?.rate(isSlow ? 0.6 : 0.9);
  }
}

export const audio = new AudioManager();
