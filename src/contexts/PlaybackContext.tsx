/**
 * Scoring playback: when the engine has a `pending` hand, walk its event timeline with
 * Balatro-like pacing (pitch rising per event), drive the sidebar numbers and per-card/joker
 * juice, then count the total into the round score and call `resolvePlay`.
 */
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

import { useGame } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { audio } from "~/lib/audio";
import { emitJiggle, emitPopup } from "~/lib/fx";
import { formatValue } from "~/lib/game/answer";
import type { HandTypeId } from "~/lib/game/types";
import { formatNumber, sleep } from "~/lib/utils";

type Display = {
  handType: HandTypeId | null;
  level: number;
  chips: number;
  mult: number;
  /** score shown in the sidebar while a total counts up */
  roundScore: number | null;
  /** set when the hand's total is being revealed */
  total: number | null;
  isPlaying: boolean;
};

type PlaybackValue = Display & { shake: number };

const PlaybackContext = createContext<PlaybackValue | null>(null);

const IDLE: Display = { handType: null, level: 1, chips: 0, mult: 0, roundScore: null, total: null, isPlaying: false };

export default function PlaybackProvider({ children }: { children: ReactNode }) {
  const { engine, run } = useGame();
  const { settings } = useSettings();
  const [display, setDisplay] = useState<Display>(IDLE);
  const [shake, setShake] = useState(0);
  const runningRef = useRef<string | null>(null);
  const pending = run?.round?.pending ?? null;
  const pendingKey = pending ? pending.played.map((c) => c.uid).join(",") : null;

  useEffect(() => {
    if (!pending || !run?.round || runningRef.current === pendingKey) return;
    runningRef.current = pendingKey;
    const speed = Math.max(0.25, settings.speed);
    const beat = (ms: number) => sleep(ms / speed);
    const startScore = run.round.score;
    const target = run.round.target;
    let isCancelled = false;

    (async () => {
      const { result, played } = pending;
      let chips = 0;
      let mult = 0;
      let step = 0;
      setDisplay({ ...IDLE, handType: result.handType, level: result.handLevel, isPlaying: true });
      audio.play("place");
      await beat(450);
      for (const ev of result.events) {
        if (isCancelled) return;
        switch (ev.kind) {
          case "hand":
            chips = ev.chips;
            mult = ev.mult;
            setDisplay((d) => ({ ...d, chips, mult }));
            audio.play("tick");
            await beat(320);
            break;
          case "card": {
            chips += ev.chips;
            setDisplay((d) => ({ ...d, chips }));
            emitJiggle(ev.cardUid, 0.7);
            if (ev.isWrong) {
              emitPopup(ev.cardUid, "0", "bad");
              audio.play("thud", { volume: 0.5 });
            } else if (ev.isDebuffed) {
              emitPopup(ev.cardUid, "✕", "bad");
              audio.play("thud", { volume: 0.5 });
            } else {
              const txt = `${ev.chips >= 0 ? "+" : ""}${formatValue(ev.chips)}`;
              emitPopup(ev.cardUid, txt, ev.chips < 0 ? "bad" : "chips");
              audio.play(ev.chips < 0 ? "chipsCollide" : "chips", { step: step++ });
            }
            await beat(ev.isRetrigger ? 330 : 400);
            break;
          }
          case "card-chips":
            chips += ev.chips;
            setDisplay((d) => ({ ...d, chips }));
            emitJiggle(ev.cardUid, 0.5);
            emitPopup(ev.cardUid, `+${ev.chips}`, "chips");
            audio.play("chips", { step: step++ });
            await beat(300);
            break;
          case "card-mult":
            mult += ev.mult;
            setDisplay((d) => ({ ...d, mult }));
            emitJiggle(ev.cardUid, 0.5);
            emitPopup(ev.cardUid, `+${formatValue(ev.mult)}`, "mult");
            audio.play("mult", { step: step++ });
            await beat(300);
            break;
          case "card-xmult":
            mult *= ev.xmult;
            setDisplay((d) => ({ ...d, mult }));
            emitJiggle(ev.cardUid, 0.8);
            emitPopup(ev.cardUid, `×${ev.xmult}`, "xmult");
            audio.play("xmult", { step: step++, volume: 0.6 });
            await beat(380);
            break;
          case "card-money":
            emitPopup(ev.cardUid, `+$${ev.money}`, "money");
            audio.play("coin");
            await beat(260);
            break;
          case "card-note":
            emitJiggle(ev.cardUid, ev.isCorrect ? 0.5 : 1.2);
            emitPopup(ev.cardUid, ev.isCorrect ? "✓" : "✗", ev.isCorrect ? "good" : "bad");
            audio.play(ev.isCorrect ? "select" : "error");
            await beat(ev.isCorrect ? 220 : 380);
            break;
          case "joker-chips":
            chips += ev.chips;
            setDisplay((d) => ({ ...d, chips }));
            emitJiggle(ev.jokerUid, 1);
            emitPopup(ev.jokerUid, `+${ev.chips}`, "chips");
            audio.play("joker");
            audio.play("chips", { step: step++ });
            await beat(420);
            break;
          case "joker-mult":
            mult += ev.mult;
            setDisplay((d) => ({ ...d, mult }));
            emitJiggle(ev.jokerUid, 1);
            emitPopup(ev.jokerUid, `+${formatValue(ev.mult)} ${settings.locale === "pl" ? "Mnoż." : "Mult"}`, "mult");
            audio.play("joker");
            audio.play("mult", { step: step++ });
            await beat(420);
            break;
          case "joker-xmult":
            mult *= ev.xmult;
            setDisplay((d) => ({ ...d, mult }));
            emitJiggle(ev.jokerUid, 1.3);
            emitPopup(ev.jokerUid, `×${formatValue(ev.xmult)} ${settings.locale === "pl" ? "Mnoż." : "Mult"}`, "xmult");
            audio.play("xmult", { step: step++, volume: 0.6 });
            await beat(480);
            break;
          case "joker-money":
            emitJiggle(ev.jokerUid, 1);
            emitPopup(ev.jokerUid, `+$${ev.money}`, "money");
            audio.play("coin");
            await beat(300);
            break;
          case "joker-text":
            emitJiggle(ev.jokerUid, 1);
            emitPopup(ev.jokerUid, settings.locale === "pl" ? ev.text.pl : ev.text.en, "text");
            audio.play("joker");
            await beat(420);
            break;
          case "boss":
            emitPopup("sidebar-hand", settings.locale === "pl" ? ev.text.pl : ev.text.en, "text");
            audio.play("thud", { volume: 0.5 });
            await beat(420);
            break;
        }
      }
      if (isCancelled) return;
      // reveal the total
      const total = result.total;
      setDisplay((d) => ({ ...d, chips: result.chips, mult: result.mult, total }));
      emitJiggle("sidebar-hand", 1);
      audio.play(total >= 0 ? "stack" : "thud");
      const isBig = startScore + total >= target;
      if (Math.abs(total) > 0) setShake((s) => s + (isBig ? 2 : 1));
      await beat(650);
      // count into round score
      const frames = 18;
      for (let i = 1; i <= frames; i++) {
        if (isCancelled) return;
        setDisplay((d) => ({ ...d, roundScore: Math.round(startScore + (total * i) / frames) }));
        if (i % 3 === 0) audio.play("tick", { volume: 0.4, step: i / 3 });
        await beat(28);
      }
      emitJiggle("sidebar-score", 1);
      await beat(380);
      void played;
      setDisplay(IDLE);
      runningRef.current = null;
      engine.resolvePlay();
    })();

    return () => {
      isCancelled = true;
      runningRef.current = null;
    };
    // pendingKey identifies the hand; re-running for the same hand would double-play it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey]);

  return <PlaybackContext.Provider value={{ ...display, shake }}>{children}</PlaybackContext.Provider>;
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback was used outside of PlaybackProvider!");
  return ctx;
}

export function formatScore(n: number) {
  return formatNumber(n);
}
