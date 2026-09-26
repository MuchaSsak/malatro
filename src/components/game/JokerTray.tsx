import { Trans } from "@lingui/react/macro";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { useState } from "react";

import { JokerInfo } from "~/components/cards/cardInfo";
import JokerCard from "~/components/cards/JokerCard";
import Tilt from "~/components/cards/Tilt";
import Juice from "~/components/ui/Juice";
import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { jokerSellValue, jokerSlots } from "~/lib/game/run";
import { cn, setDragCursor } from "~/lib/utils";

/** Top row: owned jokers, drag to reorder (order matters for scoring), click to sell. */
export default function JokerTray() {
  const { engine } = useGame();
  const run = useRun();
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [hoverUid, setHoverUid] = useState<string | null>(null);
  const isFaceDown = !!run.round?.flags.curator && run.phase === "round";
  const n = run.jokers.length;
  const spacing = n <= 5 ? 180 : Math.max(96, 900 / n);

  return (
    <div className="absolute left-[510px] top-[14px] h-[250px] w-[930px] rounded-panel bg-black/20">
      <Reorder.Group
        axis="x"
        values={run.jokers.map((j) => j.uid)}
        onReorder={(uids) => engine.reorderJokers(uids)}
        className="flex h-full items-center justify-center"
      >
        {run.jokers.map((j, i) => (
          <Reorder.Item
            key={j.uid}
            value={j.uid}
            className="relative"
            style={{ marginLeft: i === 0 ? 0 : spacing - 168, zIndex: hoverUid === j.uid ? 40 : i + 1 }}
            whileDrag={{ scale: 1.08, zIndex: 60 }}
            onDragStart={() => setDragCursor(true)}
            onDragEnd={() => setDragCursor(false)}
            onPointerEnter={() => setHoverUid(j.uid)}
            onPointerLeave={() => setHoverUid((u) => (u === j.uid ? null : u))}
          >
            <Juice target={j.uid} popupSide="bottom">
              <button
                type="button"
                className={cn("block transition-transform", activeUid === j.uid && "-translate-y-3")}
                onClick={() => setActiveUid((u) => (u === j.uid ? null : j.uid))}
              >
                <Tilt phase={i * 0.7}>
                  <JokerCard joker={j} isFaceDown={isFaceDown} />
                </Tilt>
              </button>
            </Juice>
            <AnimatePresence>
              {activeUid === j.uid && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -right-[76px] top-1/2 z-50 -translate-y-1/2"
                >
                  <PixelButton
                    tone="green"
                    size="sm"
                    className="h-auto flex-col px-3 py-2 text-2xl leading-none"
                    onClick={() => {
                      engine.sellJoker(j.uid);
                      setActiveUid(null);
                    }}
                  >
                    <Trans>Sell</Trans>
                    <span className="text-money">${jokerSellValue(j)}</span>
                  </PixelButton>
                </motion.div>
              )}
            </AnimatePresence>
            {hoverUid === j.uid && !isFaceDown && (
              <div className="pointer-events-none absolute left-1/2 top-[232px] z-[70] -translate-x-1/2">
                <JokerInfo joker={j} run={run} />
              </div>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <span className="tx absolute -bottom-9 left-2 font-pixel text-3xl text-white">
        {n}/{jokerSlots(run)}
      </span>
    </div>
  );
}
