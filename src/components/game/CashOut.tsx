import { Trans } from "@lingui/react/macro";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { audio } from "~/lib/audio";
import { cn } from "~/lib/utils";

/** End-of-round settlement: rows reveal one by one with a coin per $, then "Cash Out: $N". */
export default function CashOut() {
  const { engine } = useGame();
  const run = useRun();
  const { l, settings } = useSettings();
  const cash = run.cashout;
  const [shown, setShown] = useState(0);
  const lines = cash?.lines ?? [];

  useEffect(() => {
    if (shown >= lines.length) return;
    const id = setTimeout(
      () => {
        setShown((s) => s + 1);
        audio.play("coin", { step: shown });
      },
      (shown === 0 ? 500 : 380) / settings.speed,
    );
    return () => clearTimeout(id);
  }, [shown, lines.length, settings.speed]);

  if (!cash) return null;
  return (
    <motion.div
      initial={{ y: 700 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 22 }}
      className="absolute bottom-0 left-[640px] w-[860px] rounded-t-[20px] bg-panel p-5 shadow-hard"
      style={{ boxShadow: "inset 0 0 0 4px #FDA200" }}
    >
      <PixelButton
        tone="orange"
        size="xl"
        className="mb-5 w-full"
        disabled={shown < lines.length}
        onClick={() => {
          audio.play("coins");
          engine.cashOut();
        }}
      >
        <Trans>Cash Out: ${cash.total}</Trans>
      </PixelButton>
      <div className="flex flex-col gap-2 pb-8">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={i < shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            className={cn(
              "flex items-center justify-between rounded-panel px-5 py-3",
              i === 0 ? "bg-inset" : "border-t-4 border-dotted border-white/20",
            )}
          >
            <span className="tx font-pixel text-[34px] text-white">{l(line.label)}</span>
            <span className="tx font-pixel text-[40px] text-money">
              {line.money > 8 ? `$${line.money}` : "$".repeat(Math.max(1, line.money))}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
