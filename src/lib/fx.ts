/**
 * Tiny event bus for per-element juice: the scoring playback emits jiggles and pop-ups at
 * card/joker uids; components subscribe to their own uid only.
 */
import { useEffect, useState } from "react";

export type PopupTone = "chips" | "mult" | "xmult" | "money" | "text" | "bad" | "good";
export type Popup = { id: number; text: string; tone: PopupTone };
type FxEvent = { kind: "jiggle"; target: string; strength?: number } | { kind: "popup"; target: string; popup: Popup };

type Listener = (e: FxEvent) => void;
const listeners = new Map<string, Set<Listener>>();
let nextId = 1;

export function emitJiggle(target: string, strength = 1) {
  listeners.get(target)?.forEach((fn) => fn({ kind: "jiggle", target, strength }));
}

export function emitPopup(target: string, text: string, tone: PopupTone) {
  const popup = { id: nextId++, text, tone };
  listeners.get(target)?.forEach((fn) => fn({ kind: "popup", target, popup }));
}

export function subscribeFx(target: string, fn: Listener) {
  let set = listeners.get(target);
  if (!set) listeners.set(target, (set = new Set()));
  set.add(fn);
  return () => {
    set!.delete(fn);
  };
}

/** Returns a counter that bumps on every jiggle + the live pop-ups for one element. */
export function useFx(target: string | undefined, popupMs = 900) {
  const [jiggle, setJiggle] = useState({ n: 0, strength: 1 });
  const [popups, setPopups] = useState<Popup[]>([]);
  useEffect(() => {
    if (!target) return;
    return subscribeFx(target, (e) => {
      if (e.kind === "jiggle") setJiggle((j) => ({ n: j.n + 1, strength: e.strength ?? 1 }));
      else {
        setPopups((p) => [...p.slice(-2), e.popup]);
        setTimeout(() => setPopups((p) => p.filter((x) => x.id !== e.popup.id)), popupMs);
      }
    });
  }, [target, popupMs]);
  return { jiggle, popups };
}
