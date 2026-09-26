import { useLingui } from "@lingui/react/macro";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import TaskCard, { CARD_W } from "~/components/cards/TaskCard";
import TaskInfo from "~/components/cards/TaskInfo";
import Tilt from "~/components/cards/Tilt";
import Juice from "~/components/ui/Juice";
import { useGame, useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { useViewer } from "~/contexts/ViewerContext";
import { audio } from "~/lib/audio";
import { hasDrawing } from "~/lib/drawings";
import { isNoteReadable } from "~/lib/game/answer";
import { cardInsight, cardShownValue } from "~/lib/game/run";
import { isCardDebuffed } from "~/lib/game/scoring";
import type { CardInstance } from "~/lib/game/types";
import { cn, setDragCursor } from "~/lib/utils";

const TRAY_W = 1160;

/** The player's hand: fan layout, drag to reorder, click opens the task, right-click selects. */
export default function HandArea() {
  const { engine, pool } = useGame();
  const run = useRun();
  const round = run.round!;
  const { open, target: viewerTarget } = useViewer();
  const { t } = useLingui();
  const { settings } = useSettings();
  const [hoverUid, setHoverUid] = useState<string | null>(null);
  const draggedRef = useRef(false);
  const hand = round.hand;
  const n = hand.length;
  const spacing = n <= 1 ? CARD_W : Math.min(CARD_W + 8, (TRAY_W - CARD_W) / (n - 1));
  const isLocked = !!round.pending;

  // keyboard: 1-9 toggle cards, Enter plays, Backspace discards
  useEffect(() => {
    if (viewerTarget) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < 9 && hand[idx]) {
        engine.toggleSelect(hand[idx].uid);
        audio.play("select");
      } else if (e.key === "Enter") engine.playHand();
      else if (e.key === "Backspace" || e.key === "Delete") engine.discard();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [engine, hand, viewerTarget]);

  const toggle = (c: CardInstance) => {
    const isSelected = round.selected.includes(c.uid);
    engine.toggleSelect(c.uid);
    audio.play(isSelected ? "deselect" : "select");
  };

  const handleOpen = (c: CardInstance) => {
    if (draggedRef.current) return;
    if (c.isFaceDown) {
      toast(t`This card is face down - play it to reveal it`);
      audio.play("error");
      return;
    }
    audio.play("place", { volume: 0.5 });
    open({ taskId: c.taskId, cardUid: c.uid, source: "hand" });
  };

  return (
    <div className="absolute bottom-[150px] left-[525px] h-[260px] w-[1160px]">
      <div className="absolute inset-x-[-20px] bottom-[-14px] top-[30px] rounded-panel bg-black/20" />
      <Reorder.Group
        axis="x"
        values={hand.map((c) => c.uid)}
        onReorder={(uids) => engine.reorderHand(uids)}
        className="relative flex h-full items-end justify-center"
      >
        <AnimatePresence initial={false}>
          {hand.map((c, i) => {
            const task = pool.byId.get(c.taskId)!;
            const isSelected = round.selected.includes(c.uid);
            const mid = (n - 1) / 2;
            const rot = n > 1 ? ((i - mid) / n) * 10 : 0;
            const arc = n > 1 ? Math.abs(i - mid) ** 2 * (26 / (mid * mid || 1)) : 0;
            const insight = c.isFaceDown ? null : cardInsight(run, c);
            return (
              <Reorder.Item
                key={c.uid}
                value={c.uid}
                drag={!isLocked}
                className="relative"
                style={{ marginLeft: i === 0 ? 0 : spacing - CARD_W, zIndex: hoverUid === c.uid ? 60 : i + 1 }}
                initial={{ x: 900, y: 120, rotate: 25, opacity: 0 }}
                animate={{
                  x: 0,
                  y: (isSelected ? -52 : 0) + arc,
                  rotate: rot,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                    delay: settings.isReducedMotion ? 0 : i * 0.03,
                  },
                }}
                exit={{ y: -80, opacity: 0, transition: { duration: 0.15 } }}
                whileDrag={{ scale: 1.08, rotate: 0, zIndex: 80 }}
                onDragStart={() => {
                  draggedRef.current = true;
                  setDragCursor(true);
                }}
                onDragEnd={() => {
                  setDragCursor(false);
                  setTimeout(() => (draggedRef.current = false), 60);
                }}
                onPointerEnter={() => setHoverUid(c.uid)}
                onPointerLeave={() => setHoverUid((u) => (u === c.uid ? null : u))}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!isLocked) toggle(c);
                }}
              >
                <Juice target={c.uid}>
                  <div className="cursor-pointer" onClick={() => handleOpen(c)}>
                    <Tilt phase={i * 0.9} isIdle={!settings.isReducedMotion}>
                      <TaskCard
                        task={task}
                        card={c}
                        insight={insight}
                        shownValue={insight ? cardShownValue(run, c, pool) : null}
                        note={run.notes[c.taskId]}
                        isDebuffed={isCardDebuffed(run, round, c, task)}
                        isFaceDown={c.isFaceDown}
                        hasDrawing={hasDrawing(c.taskId)}
                        difficulty={run.difficulty}
                        className={cn(isSelected && "outline outline-4 outline-offset-2 outline-white/80")}
                      />
                    </Tilt>
                  </div>
                </Juice>
                {/* answers are required to play: flag selected cards that still need one */}
                {isSelected &&
                  !c.isFaceDown &&
                  !isNoteReadable(run.notes[c.taskId] ?? "", pool.byId.get(c.taskId) ?? {}) && (
                    <button
                      type="button"
                      onClick={() => handleOpen(c)}
                      title={t`No answer`}
                      aria-label={t`No answer`}
                      className="tx absolute -top-[66px] left-1/2 z-[85] grid h-11 w-11 -translate-x-1/2 animate-bounce place-items-center rounded-full bg-red font-pixel text-2xl leading-none text-white shadow-hard-sm"
                    >
                      ✎
                    </button>
                  )}
                {/* select toggle tab */}
                {!isLocked && (hoverUid === c.uid || isSelected) && c.uid !== round.forcedUid && (
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    className={cn(
                      "tx absolute -top-6 left-1/2 z-10 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full font-pixel text-3xl leading-none text-white shadow-hard-sm transition-colors",
                      isSelected ? "bg-blue" : "bg-panel-light hover:bg-blue",
                    )}
                    aria-label={isSelected ? t`Deselect` : t`Select`}
                  >
                    {isSelected ? "✓" : "+"}
                  </button>
                )}
                {hoverUid === c.uid && !c.isFaceDown && !isLocked && (
                  <div className="pointer-events-none absolute bottom-[270px] left-1/2 z-[90] -translate-x-1/2">
                    <TaskInfo task={task} note={run.notes[c.taskId]} />
                  </div>
                )}
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>
      <span className="tx absolute -bottom-[64px] right-2 font-pixel text-3xl text-white">
        {n}/{round.handSize}
      </span>
    </div>
  );
}

/** Centre row where played cards sit while the scoring animation runs. */
export function PlayArea() {
  const { pool } = useGame();
  const run = useRun();
  const pending = run.round?.pending;
  return (
    <div className="pointer-events-none absolute left-[525px] top-[330px] flex h-[260px] w-[1160px] items-center justify-center gap-5">
      <AnimatePresence>
        {pending?.played.map((c, i) => {
          const task = pool.byId.get(c.taskId)!;
          const isScored = pending.result.scoredUids.includes(c.uid);
          return (
            <motion.div
              key={c.uid}
              initial={{ y: 380, opacity: 0, rotate: 8 }}
              animate={{
                y: 0,
                opacity: 1,
                rotate: 0,
                transition: { delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 },
              }}
              exit={{ x: 900, opacity: 0, rotate: 20, transition: { duration: 0.35, delay: i * 0.04 } }}
            >
              <Juice target={c.uid}>
                <TaskCard
                  task={task}
                  card={c}
                  insight="value"
                  shownValue={cardShownValue(run, c, pool)}
                  note={run.notes[c.taskId]}
                  isDebuffed={!isScored}
                  difficulty={run.difficulty}
                />
              </Juice>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
