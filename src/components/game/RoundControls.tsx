import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";

import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { validatePlay } from "~/lib/game/run";

/** Play / Sort / Discard row under the hand (Balatro: Play = blue, Discard = red, Sort = orange). */
export default function RoundControls() {
  const { engine, pool } = useGame();
  const run = useRun();
  const { l } = useSettings();
  const round = run.round!;
  const isLocked = !!round.pending;
  const playError = validatePlay(run, pool);
  const hasSelection = round.selected.length > 0;
  const canDiscard = !isLocked && hasSelection && round.discardsLeft > 0;

  return (
    <div className="absolute bottom-[26px] left-[525px] flex w-[1160px] items-center justify-center gap-6">
      {hasSelection && playError && !isLocked && (
        <div className="tx pointer-events-none absolute -top-[46px] left-1/2 z-[100] -translate-x-1/2 whitespace-nowrap rounded-lg bg-red px-4 py-1 font-pixel text-2xl text-white shadow-hard-sm">
          {l(playError)}
        </div>
      )}
      <PixelButton
        tone="blue"
        size="lg"
        className="w-[300px]"
        disabled={isLocked || !!playError}
        title={playError ? l(playError) : undefined}
        onClick={() => engine.playHand()}
      >
        <Trans>Play Hand</Trans>
      </PixelButton>
      <div className="flex flex-col items-center gap-1 rounded-panel border-4 border-outline/80 px-3 pb-2 pt-1">
        <span className="tx font-pixel text-2xl text-white">
          <Trans>Sort Hand</Trans>
        </span>
        <div className="flex gap-2">
          <PixelButton size="sm" tone="orange" disabled={isLocked} onClick={() => engine.sortHand("suit")}>
            <Trans>Branch</Trans>
          </PixelButton>
          <PixelButton size="sm" tone="orange" disabled={isLocked} onClick={() => engine.sortHand("note")}>
            <Trans>Notes</Trans>
          </PixelButton>
        </div>
      </div>
      <PixelButton tone="red" size="lg" className="w-[300px]" disabled={!canDiscard} onClick={() => engine.discard()}>
        <Trans>Discard</Trans>
      </PixelButton>
      {round.deadline && <ClockBadge deadline={round.deadline} />}
    </div>
  );
}

function ClockBadge({ deadline }: { deadline: number }) {
  const { engine } = useGame();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, deadline - now);
  useEffect(() => {
    if (left <= 0) engine.timeUp();
  }, [left, engine]);
  const s = Math.ceil(left / 1000);
  return (
    <div className="tx absolute -top-[90px] right-0 rounded-panel bg-[#d9a13b] px-4 py-2 font-pixel text-4xl text-white shadow-hard">
      ⏰ {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </div>
  );
}
