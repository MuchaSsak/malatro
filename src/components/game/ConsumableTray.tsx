import { Trans } from "@lingui/react/macro";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { ConsumableInfo } from "~/components/cards/cardInfo";
import ConsumableCard from "~/components/cards/ConsumableCard";
import Tilt from "~/components/cards/Tilt";
import Juice from "~/components/ui/Juice";
import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { canUseConsumable, consumableSellValue, consumableSlots } from "~/lib/game/run";

/** Top-right tray: ściągi and twierdzenia. Click shows Use / Sell. */
export default function ConsumableTray() {
  const { engine } = useGame();
  const run = useRun();
  const { l } = useSettings();
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [hoverUid, setHoverUid] = useState<string | null>(null);
  const n = run.consumables.length;
  return (
    <div className="absolute left-[1460px] top-[14px] h-[250px] w-[445px] rounded-panel bg-black/20">
      <div className="flex h-full items-center justify-center">
        {run.consumables.map((c, i) => {
          const err = canUseConsumable(run, c);
          return (
            <div
              key={c.uid}
              className="relative"
              style={{ marginLeft: i === 0 ? 0 : n > 2 ? -60 : 16, zIndex: hoverUid === c.uid ? 40 : i + 1 }}
              onPointerEnter={() => setHoverUid(c.uid)}
              onPointerLeave={() => setHoverUid((u) => (u === c.uid ? null : u))}
            >
              <Juice target={c.uid} popupSide="bottom">
                <button
                  type="button"
                  className="block"
                  onClick={() => setActiveUid((u) => (u === c.uid ? null : c.uid))}
                >
                  <Tilt phase={i}>
                    <ConsumableCard item={c} />
                  </Tilt>
                </button>
              </Juice>
              <AnimatePresence>
                {activeUid === c.uid && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -left-[92px] top-6 z-50 flex flex-col gap-2"
                  >
                    <PixelButton
                      tone="red"
                      size="sm"
                      className="w-[88px]"
                      disabled={!!err}
                      title={err ? l(err) : undefined}
                      onClick={() => {
                        if (engine.activateConsumable(c.uid)) setActiveUid(null);
                      }}
                    >
                      <Trans>Use</Trans>
                    </PixelButton>
                    <PixelButton
                      tone="green"
                      size="sm"
                      className="h-auto w-[88px] flex-col py-2 leading-none"
                      onClick={() => {
                        engine.sellConsumable(c.uid);
                        setActiveUid(null);
                      }}
                    >
                      <Trans>Sell</Trans>
                      <span className="text-money">${consumableSellValue()}</span>
                    </PixelButton>
                    {err && (
                      <span className="tx w-[88px] text-center font-pixel text-lg leading-tight text-white/80">
                        {l(err)}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {hoverUid === c.uid && (
                <div className="pointer-events-none absolute right-0 top-[232px] z-[70]">
                  <ConsumableInfo item={c} run={run} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="tx absolute -bottom-9 right-2 font-pixel text-3xl text-white">
        {n}/{consumableSlots(run)}
      </span>
    </div>
  );
}
