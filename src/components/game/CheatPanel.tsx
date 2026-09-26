import { Trans } from "@lingui/react/macro";
import { useState } from "react";

import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import type { CheatKind } from "~/lib/game/run";

/**
 * Testing panel under the consumable tray, right of the blind columns (unlocked by poking a blind chip 10 times). Any cheat
 * marks the run, so it never reaches the leaderboard.
 */
export default function CheatPanel() {
  const { engine } = useGame();
  const run = useRun();
  const { update } = useSettings();
  const [isOpen, setIsOpen] = useState(true);
  const isInRound = run.phase === "round" && !!run.round && !run.round.pending;
  const buttons: [CheatKind, string, boolean][] = [
    ["money5", "+$5", true],
    ["money50", "+$50", true],
    ["mult", "×10 Mult", true],
    ["hand", "+1 ✋", isInRound],
    ["discard", "+1 🗑", isInRound],
    ["reveal", "👁", isInRound],
    ["win", "WIN", isInRound],
  ];
  return (
    <div className="absolute left-[1622px] top-[292px] z-[60] w-[284px] rounded-panel bg-black/45 p-2 shadow-hard">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="tx flex-1 text-left font-pixel text-2xl text-money"
        >
          {isOpen ? "▾" : "▸"} <Trans>Cheats</Trans>
          {run.cheatMult ? <span className="ml-2 text-red">×{run.cheatMult}</span> : null}
        </button>
        {isOpen && (
          <button
            type="button"
            onClick={() => update({ isCheats: false })}
            className="tx rounded bg-panel-light px-2 font-pixel text-lg text-white/70 hover:bg-grey"
          >
            <Trans>Turn off</Trans>
          </button>
        )}
      </div>
      {isOpen && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {buttons.map(([kind, label, isEnabled]) => (
            <PixelButton
              key={kind}
              tone={kind === "win" ? "red" : kind === "mult" ? "red" : kind.startsWith("money") ? "money" : "panel"}
              size="sm"
              className="h-10 px-2 text-xl"
              disabled={!isEnabled}
              onClick={() => engine.cheat(kind)}
            >
              {label}
            </PixelButton>
          ))}
        </div>
      )}
    </div>
  );
}
