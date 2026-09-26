import { Trans, useLingui } from "@lingui/react/macro";
import { motion } from "motion/react";

import { TagInfo } from "~/components/cards/cardInfo";
import BlindChip, { blindColor } from "~/components/game/BlindChip";
import PixelArt from "~/components/ui/PixelArt";
import PixelButton from "~/components/ui/PixelButton";
import RichText from "~/components/ui/RichText";
import { useGame, useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { BOSS_BY_ID } from "~/lib/game/content/bosses";
import { TAG_BY_ID } from "~/lib/game/content/tags";
import { blindTarget } from "~/lib/game/run";
import type { BlindKind } from "~/lib/game/types";
import { cn, formatNumber } from "~/lib/utils";

const KINDS: BlindKind[] = ["small", "big", "boss"];

/** Three blind columns rising from the bottom; the current one is raised with Select / Skip. */
export default function BlindSelect() {
  const run = useRun();
  return (
    <div className="absolute bottom-0 left-[560px] flex h-[760px] w-[1080px] items-end justify-center gap-8">
      {KINDS.map((kind, i) => (
        <BlindColumn key={kind} kind={kind} index={i} state={i < run.blindIndex ? "done" : i === run.blindIndex ? "current" : "upcoming"} />
      ))}
    </div>
  );
}

function BlindColumn({ kind, index, state }: { kind: BlindKind; index: number; state: "done" | "current" | "upcoming" }) {
  const { engine } = useGame();
  const run = useRun();
  const { l } = useSettings();
  const { t } = useLingui();
  const bossId = kind === "boss" ? run.plan.boss.bossId : null;
  const boss = bossId ? BOSS_BY_ID[bossId] : null;
  const color = blindColor(kind, bossId);
  const target = blindTarget(run, kind, bossId);
  const name = boss ? l(boss.name) : kind === "small" ? t`Small Blind` : t`Big Blind`;
  const reward = boss?.reward ?? (kind === "small" ? 3 : kind === "big" ? 4 : 5);
  const tagId = kind === "small" ? run.plan.small.tag : kind === "big" ? run.plan.big.tag : null;
  const isCurrent = state === "current";

  return (
    <motion.div
      initial={{ y: 500 }}
      animate={{ y: isCurrent ? 0 : 70 }}
      transition={{ type: "spring", stiffness: 200, damping: 24, delay: index * 0.08 }}
      className={cn("flex h-[700px] w-[320px] flex-col rounded-t-[18px] bg-panel p-3 shadow-hard", !isCurrent && "brightness-75")}
      style={{ boxShadow: `inset 0 0 0 5px ${color}, 0 6px 0 rgba(0,0,0,.35)` }}
    >
      <div className="mb-3 flex h-[70px] items-center justify-center rounded-panel">
        {isCurrent ? (
          <PixelButton tone="orange" size="md" className="w-full" onClick={() => engine.selectBlind()}>
            <Trans>Select</Trans>
          </PixelButton>
        ) : (
          <div className="tx w-full rounded-panel bg-inactive py-3 text-center font-pixel text-3xl text-white/70">
            {state === "done" ? <Trans>Defeated / Skipped</Trans> : <Trans>Upcoming</Trans>}
          </div>
        )}
      </div>
      <div className="rounded-panel py-2 text-center shadow-hard-sm" style={{ backgroundColor: color }}>
        <span className="tx font-pixel text-[38px] leading-none text-white">{name}</span>
      </div>
      <div className="my-4 flex justify-center">
        <BlindChip kind={kind} bossId={bossId} size={120} />
      </div>
      <div className="flex flex-col items-center rounded-panel bg-inset px-3 py-3">
        <span className="tx font-pixel text-[26px] text-white">
          <Trans>Score at least</Trans>
        </span>
        <span className="tx font-pixel text-[56px] leading-none text-red">{formatNumber(target)}</span>
        <span className="tx font-pixel text-[26px] text-white">
          <Trans>Reward:</Trans> <span className="text-money">{"$".repeat(reward)}+</span>
        </span>
      </div>
      {boss && (
        <div className="mt-3 rounded-panel bg-inset-deep px-3 py-3 text-center font-pixel text-[24px] leading-tight text-white">
          <RichText text={l(boss.desc)} />
        </div>
      )}
      {tagId && (
        <div className="mt-auto flex flex-col items-center gap-2">
          <span className="tx font-pixel text-2xl text-white/80">
            <Trans>or</Trans>
          </span>
          <div className="group relative flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-booster shadow-hard-sm">
              <PixelArt glyph={TAG_BY_ID[tagId]?.art ?? "?"} size={40} res={18} />
            </div>
            <PixelButton tone="red" size="md" disabled={!isCurrent} onClick={() => engine.skipBlind()}>
              <Trans>Skip Blind</Trans>
            </PixelButton>
            <div className="pointer-events-none absolute bottom-20 left-0 z-50 hidden group-hover:block">
              <TagInfo id={tagId} />
            </div>
          </div>
        </div>
      )}
      {kind === "boss" && (
        <div className="tx mt-auto rounded-panel bg-gold/90 px-2 py-2 text-center font-pixel text-[22px] leading-tight text-[#5a3d0c]">
          <Trans>Beat the Boss to raise the Ante</Trans>
        </div>
      )}
    </motion.div>
  );
}
