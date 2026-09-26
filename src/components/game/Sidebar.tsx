import { Trans, useLingui } from "@lingui/react/macro";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import BlindChip, { blindColor } from "~/components/game/BlindChip";
import Juice from "~/components/ui/Juice";
import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { usePlayback } from "~/contexts/PlaybackContext";
import { useSettings } from "~/contexts/SettingsContext";
import { FINAL_ANTE } from "~/lib/game/constants";
import { BOSS_BY_ID } from "~/lib/game/content/bosses";
import { HAND_BY_ID } from "~/lib/game/hands";
import { previewHand } from "~/lib/game/scoring";
import { cn, formatNumber } from "~/lib/utils";

type SidebarProps = { onRunInfo: () => void; onOptions: () => void };

export default function Sidebar({ onRunInfo, onOptions }: SidebarProps) {
  const run = useRun();
  const round = run.round;
  const accent =
    run.phase === "shop"
      ? "#fe5f55"
      : round
        ? blindColor(round.blind, round.bossId)
        : run.phase === "blind-select"
          ? "#4f6367"
          : "#4f6367";
  const isBoss = round?.blind === "boss";
  return (
    <aside
      className="absolute left-[18px] top-0 flex h-full w-[460px] flex-col gap-3 px-3 py-3"
      style={{
        background: isBoss ? `linear-gradient(180deg, ${accent}55, #374244 40%)` : "#374244",
        boxShadow: `inset -8px 0 0 ${accent}, 6px 0 0 rgba(0,0,0,0.25)`,
      }}
    >
      <TopBlock />
      <RoundScore />
      <HandPanel />
      <BottomGrid onRunInfo={onRunInfo} onOptions={onOptions} />
    </aside>
  );
}

function TopBlock() {
  const run = useRun();
  const { l } = useSettings();
  const { t } = useLingui();
  const round = run.round;

  if (run.phase === "shop") return <ShopMarquee />;
  if (run.phase === "pack" && run.pack) {
    const names = {
      zadania: t`Task Pack`,
      sciagi: t`Cheat Sheet Pack`,
      twierdzenia: t`Theorem Pack`,
      jokery: t`Joker Pack`,
    };
    return (
      <div className="flex h-[290px] flex-col items-center justify-center rounded-panel bg-inset-deep px-4 shadow-hard">
        <div className="tx font-pixel text-5xl text-white">{names[run.pack.kind]}</div>
        <div className="tx mt-3 font-pixel text-3xl text-important">
          <Trans>Choose {run.pack.picksLeft}</Trans>
        </div>
      </div>
    );
  }
  if (!round || run.phase === "blind-select") {
    return (
      <div className="flex h-[290px] flex-col items-center justify-center rounded-panel bg-inset-deep px-6 text-center shadow-hard">
        <div className="tx font-pixel text-5xl leading-tight text-white">
          <Trans>Choose your next Blind</Trans>
        </div>
      </div>
    );
  }
  const color = blindColor(round.blind, round.bossId);
  const boss = round.bossId ? BOSS_BY_ID[round.bossId] : null;
  const name = boss ? l(boss.name) : round.blind === "small" ? t`Small Blind` : t`Big Blind`;
  const reward = boss?.reward ?? (round.blind === "small" ? 3 : round.blind === "big" ? 4 : 5);
  return (
    <div className="flex h-[290px] flex-col gap-2">
      <div className="rounded-panel py-2 text-center shadow-hard" style={{ backgroundColor: color }}>
        <span className="tx font-pixel text-[44px] leading-none text-white">{name}</span>
      </div>
      <div
        className="flex flex-1 items-center gap-4 rounded-panel px-4 shadow-hard"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 35%, #1c282c)` }}
      >
        <BlindChip kind={round.blind} bossId={round.bossId} size={104} />
        <div className="flex flex-1 flex-col items-center rounded-panel bg-inset px-3 py-2">
          <span className="tx font-pixel text-[26px] text-white">
            <Trans>Score at least</Trans>
          </span>
          <span className="tx font-pixel text-[58px] leading-none text-red">{formatNumber(round.target)}</span>
          <span className="tx font-pixel text-[24px] text-white">
            <Trans>to earn</Trans> <span className="text-money">{"$".repeat(reward)}</span>
          </span>
        </div>
      </div>
      {boss && (
        <div className="tx line-clamp-2 rounded-panel bg-inset-deep px-3 py-1 text-center font-pixel text-[22px] leading-tight text-white">
          {l(boss.desc)}
        </div>
      )}
    </div>
  );
}

function ShopMarquee() {
  return (
    <div className="flex h-[290px] flex-col items-center justify-center rounded-panel border-4 border-red bg-inset-deep shadow-hard">
      <div className="relative rounded-[22px] bg-red px-8 py-3 shadow-hard">
        <div className="pointer-events-none absolute inset-1 rounded-[18px] border-[6px] border-dotted border-[#fff3c4] animate-blink" />
        <span
          className="font-pixel text-[96px] leading-none text-gold"
          style={{ textShadow: "0 6px 0 #9a5a10, 0 0 18px rgba(255,210,120,.5)" }}
        >
          <Trans>SHOP</Trans>
        </span>
      </div>
      <span className="tx mt-4 font-pixel text-[34px] text-gold">
        <Trans>Improve your run!</Trans>
      </span>
    </div>
  );
}

function RoundScore() {
  const run = useRun();
  const pb = usePlayback();
  const score = pb.roundScore ?? run.round?.score ?? 0;
  return (
    <div className="flex h-[84px] items-center gap-3 rounded-panel bg-panel-light/40 px-3 shadow-hard">
      <span className="tx w-[120px] font-pixel text-[28px] leading-[0.95] text-white">
        <Trans>Round score</Trans>
      </span>
      <Juice target="sidebar-score" className="flex-1">
        <div className="flex h-[62px] items-center justify-center gap-3 rounded-panel bg-inset">
          <span className="text-3xl">⛁</span>
          <span className={cn("tx font-pixel text-[54px] leading-none", score < 0 ? "text-red" : "text-white")}>
            {formatNumber(score)}
          </span>
        </div>
      </Juice>
    </div>
  );
}

function HandPanel() {
  const { run, pool } = useGame();
  const pb = usePlayback();
  const { l } = useSettings();
  const round = run?.round ?? null;
  let handType = pb.handType;
  let level = pb.level;
  let chips = pb.chips;
  let mult = pb.mult;
  if (!pb.isPlaying && run && round && round.selected.length && run.phase === "round") {
    const cards = round.selected.map((u) => round.hand.find((c) => c.uid === u)).filter((c) => !!c);
    const p = previewHand(run, round, cards, pool);
    handType = p.handType;
    level = p.level;
    chips = p.chips;
    mult = p.mult;
  }
  const total = pb.total;
  const isFlaming = total !== null && round && (pb.roundScore ?? round.score) + total >= round.target && total > 0;
  return (
    <Juice target="sidebar-hand" popupSide="center">
      <div className="flex h-[200px] flex-col justify-center gap-3 rounded-panel bg-inset-deep px-4 shadow-hard">
        <div className="flex h-[52px] items-end justify-center gap-2">
          {handType ? (
            <>
              <span className="tx font-pixel text-[46px] leading-none text-white">{l(HAND_BY_ID[handType].name)}</span>
              <span className="tx font-pixel text-[24px] text-white/80">lvl.{level}</span>
            </>
          ) : (
            <span className="font-pixel text-[30px] text-white/30">&nbsp;</span>
          )}
        </div>
        {total !== null ? (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [1.3, 1], opacity: 1 }}
            className={cn(
              "tx flex h-[92px] items-center justify-center rounded-panel font-pixel text-[72px] leading-none",
              total < 0 ? "bg-red/30 text-red" : "bg-white/10 text-white",
              isFlaming && "shadow-[0_0_40px_rgba(255,120,40,.8)]",
            )}
          >
            {formatNumber(total)}
          </motion.div>
        ) : (
          <div className="flex items-center gap-2">
            <NumberBox tone="blue" value={chips} isFlaming={!!isFlaming} align="right" />
            <span className="tx font-pixel text-[44px] text-red">×</span>
            <NumberBox tone="red" value={mult} isFlaming={!!isFlaming} align="left" />
          </div>
        )}
      </div>
    </Juice>
  );
}

function NumberBox({
  tone,
  value,
  isFlaming,
  align,
}: {
  tone: "blue" | "red";
  value: number;
  isFlaming: boolean;
  align: "left" | "right";
}) {
  return (
    <motion.div
      key={Math.round(value * 100)}
      initial={{ scale: 1.12 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex h-[92px] flex-1 items-center rounded-panel px-4 shadow-hard",
        tone === "blue" ? "bg-blue" : "bg-red",
        align === "right" ? "justify-end" : "justify-start",
        isFlaming && (tone === "blue" ? "shadow-[0_-8px_30px_#4fb8ff]" : "shadow-[0_-8px_30px_#ff8a3a]"),
      )}
    >
      <span className={cn("tx font-pixel text-[64px] leading-none", value < 0 ? "text-[#ffd0cc]" : "text-white")}>
        {formatNumber(value)}
      </span>
    </motion.div>
  );
}

function BottomGrid({ onRunInfo, onOptions }: SidebarProps) {
  const run = useRun();
  const round = run.round;
  return (
    <div className="flex flex-1 gap-3">
      <div className="flex w-[140px] flex-col gap-3">
        <PixelButton tone="red" className="flex-1 text-[34px] leading-[0.95]" onClick={onRunInfo}>
          <span className="whitespace-pre-line text-center">
            <Trans>Run Info</Trans>
          </span>
        </PixelButton>
        <PixelButton tone="orange" className="flex-1 text-[32px]" onClick={onOptions}>
          <Trans>Options</Trans>
        </PixelButton>
      </div>
      <div className="grid flex-1 grid-cols-2 grid-rows-[1fr_1fr_1fr] gap-3">
        <Stat label={<Trans>Hands</Trans>} value={round?.handsLeft ?? "-"} tone="text-blue" />
        <Stat label={<Trans>Discards</Trans>} value={round?.discardsLeft ?? "-"} tone="text-red" />
        <div className="col-span-2 flex items-center justify-center rounded-panel bg-inset shadow-hard">
          <Juice target="sidebar-money">
            <span className={cn("tx font-pixel text-[64px] leading-none", run.money < 0 ? "text-red" : "text-money")}>
              {run.money < 0 ? `-$${Math.abs(run.money)}` : `$${run.money}`}
            </span>
          </Juice>
        </div>
        <Stat
          label={<Trans>Ante</Trans>}
          value={
            <>
              {run.ante}
              <span className="text-[30px] text-white">/{FINAL_ANTE}</span>
            </>
          }
          tone="text-important"
        />
        <Stat label={<Trans>Round</Trans>} value={run.blindCounter} tone="text-important" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: ReactNode; value: ReactNode; tone: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-panel bg-panel-light/30 pt-1 shadow-hard">
      <span className="tx font-pixel text-[26px] leading-none text-white">{label}</span>
      <div className="mx-2 mb-2 mt-1 flex w-[calc(100%-16px)] justify-center rounded-lg bg-inset py-1">
        <span className={cn("tx font-pixel text-[48px] leading-none", tone)}>{value}</span>
      </div>
    </div>
  );
}
