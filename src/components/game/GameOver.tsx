import { Trans, useLingui } from "@lingui/react/macro";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import PixelButton from "~/components/ui/PixelButton";
import { useAuth } from "~/contexts/AuthContext";
import { useGame, useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import useSubmitRun from "~/hooks/runs/useSubmitRun";
import { audio } from "~/lib/audio";
import { DIFFICULTIES } from "~/lib/game/constants";
import { BOSS_BY_ID } from "~/lib/game/content/bosses";
import { HAND_BY_ID } from "~/lib/game/hands";
import type { HandTypeId } from "~/lib/game/types";
import { formatDuration, formatNumber } from "~/lib/utils";

type GameOverProps = { onNewRun: () => void; onMainMenu: () => void };

/** Loss / win panel with run stats; submits the result to the leaderboard once. */
export default function GameOver({ onNewRun, onMainMenu }: GameOverProps) {
  const { engine } = useGame();
  const run = useRun();
  const { session } = useAuth();
  const { l } = useSettings();
  const { t } = useLingui();
  const submit = useSubmitRun();
  const isWon = run.phase === "won";
  const submittedRef = useRef(false);

  useEffect(() => {
    audio.play(isWon ? "win" : "lose");
    audio.slowMusic(!isWon);
    return () => audio.slowMusic(false);
  }, [isWon]);

  useEffect(() => {
    if (!session || run.isSubmitted || run.isCheated || submittedRef.current) return;
    submittedRef.current = true;
    submit.mutate({ run }, { onSuccess: () => engine.markSubmitted() });
  }, [session, run, submit, engine]);

  const mostPlayed = (Object.entries(run.handPlays) as [HandTypeId, number][]).sort((a, b) => b[1] - a[1])[0];
  const lost = run.lostTo;
  const boss = lost?.bossId ? BOSS_BY_ID[lost.bossId] : null;
  const diff = DIFFICULTIES.find((d) => d.id === run.difficulty)!;
  const rows: [string, string, string][] = [
    [t`Best hand`, formatNumber(run.stats.bestHand), "#FE5F55"],
    [
      t`Most played hand`,
      mostPlayed && mostPlayed[1] > 0 ? `${l(HAND_BY_ID[mostPlayed[0]].name)} (${mostPlayed[1]})` : "-",
      "#fff",
    ],
    [t`Total score`, formatNumber(run.stats.totalScore), "#009DFF"],
    [t`Cards played`, String(run.stats.cardsPlayed), "#009DFF"],
    [t`Correct notes`, String(run.stats.correctNotes), "#4BC292"],
    [t`Rerolls`, String(run.stats.rerolls), "#4BC292"],
    [t`Money earned`, `$${run.stats.moneyEarned}`, "#F3B958"],
    [t`Play time`, formatDuration(run.stats.playTimeMs ?? 0), "#fff"],
    [t`Seed`, run.seed, "#fff"],
  ];

  return (
    // centred by a grid wrapper: motion's `scale` writes `transform`, which would wipe Tailwind's
    // translate-based centring (Tailwind v3 composes translate into the same property)
    <div className="pointer-events-none absolute inset-0 z-[150] grid place-items-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="pointer-events-auto w-[980px] rounded-[22px] bg-outline p-[5px] shadow-hard"
      >
        <div className="rounded-[18px] bg-panel px-10 py-8">
          <h1
            className="text-center font-pixel text-[110px] leading-none"
            style={{
              color: isWon ? "#e8e6ff" : "#fe5f55",
              textShadow: "0 7px 0 rgba(0,0,0,.45), 2px 0 rgba(255,0,60,.3), -2px 0 rgba(0,160,255,.3)",
            }}
          >
            {isWon ? <Trans>YOU WIN!</Trans> : <Trans>GAME OVER</Trans>}
          </h1>
          <div className="tx mt-2 text-center font-pixel text-3xl" style={{ color: diff.tone }}>
            {diff.name} · <Trans>Ante {run.ante}</Trans>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {rows.map(([label, value, color]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-[210px] rounded-lg bg-[#BFC7D5] px-3 py-2 text-right font-pixel text-2xl text-ink">
                  {label}
                </span>
                <span
                  className="tx flex-1 truncate rounded-lg bg-inset px-3 py-2 font-pixel text-3xl"
                  style={{ color }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
          {!isWon && lost && (
            <div className="tx mt-4 rounded-panel bg-inset px-4 py-3 text-center font-pixel text-3xl text-white">
              <Trans>Defeated by</Trans>{" "}
              <span style={{ color: boss?.color ?? "#FF9A00" }}>
                {boss ? l(boss.name) : lost.blind === "small" ? t`Small Blind` : t`Big Blind`}
              </span>{" "}
              ({formatNumber(lost.score)} / {formatNumber(lost.target)})
            </div>
          )}
          <div className="tx mt-3 text-center font-pixel text-2xl text-white/70">
            {run.isCheated ? (
              <Trans>Cheats were used: not saved to the leaderboard</Trans>
            ) : session ? (
              submit.isPending ? (
                <Trans>Saving to leaderboard...</Trans>
              ) : run.isSubmitted ? (
                <Trans>Saved to the leaderboard</Trans>
              ) : null
            ) : (
              <Trans>Log in to appear on the leaderboard</Trans>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {isWon && (
              <PixelButton tone="blue" size="lg" onClick={() => engine.continueEndless()}>
                <Trans>Endless Mode</Trans>
              </PixelButton>
            )}
            <div className="flex gap-3">
              <PixelButton tone="red" size="lg" className="flex-1" onClick={onNewRun}>
                <Trans>New Run</Trans>
              </PixelButton>
              <PixelButton
                tone="green"
                size="lg"
                className="flex-1"
                onClick={() => {
                  engine.newRun(run.difficulty, run.seed, run.avoid);
                  audio.play("shuffle");
                }}
              >
                <Trans>Replay seed</Trans>
              </PixelButton>
            </div>
            <PixelButton tone="red" size="md" onClick={onMainMenu}>
              <Trans>Main Menu</Trans>
            </PixelButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
