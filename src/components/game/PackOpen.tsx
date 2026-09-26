import { Trans } from "@lingui/react/macro";
import { motion } from "motion/react";
import { useState } from "react";

import { ConsumableInfo, JokerInfo } from "~/components/cards/cardInfo";
import ConsumableCard from "~/components/cards/ConsumableCard";
import JokerCard from "~/components/cards/JokerCard";
import TaskCard from "~/components/cards/TaskCard";
import TaskInfo from "~/components/cards/TaskInfo";
import Tilt from "~/components/cards/Tilt";
import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { useViewer } from "~/contexts/ViewerContext";
import { SCIAGA_BY_ID } from "~/lib/game/content/consumables";
import { consumableSlots, jokerSlots } from "~/lib/game/run";
import type { PackChoice } from "~/lib/game/types";

/** Booster opened: choices fanned in the centre, pick N, or Skip. */
export default function PackOpen() {
  const { engine } = useGame();
  const run = useRun();
  const pack = run.pack;
  if (!pack) return null;
  return (
    <div className="absolute left-[520px] top-[300px] flex h-[700px] w-[1160px] flex-col items-center justify-center">
      <div className="flex items-end justify-center gap-8">
        {pack.choices.map((c, i) => (
          <motion.div
            key={c.uid}
            initial={{ y: 300, opacity: 0, rotate: -10 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 220, damping: 22 }}
          >
            <Choice choice={c} />
          </motion.div>
        ))}
      </div>
      <PixelButton tone="grey" size="md" className="mt-16 w-[260px]" onClick={() => engine.skipPack()}>
        <Trans>Skip</Trans>
      </PixelButton>
    </div>
  );
}

function Choice({ choice }: { choice: PackChoice }) {
  const { engine } = useGame();
  const run = useRun();
  const { open } = useViewer();
  const [isHover, setIsHover] = useState(false);
  let card;
  let info;
  let isBlocked = false;
  if (choice.type === "task") {
    const task = engine.getPool().byId.get(choice.card.taskId)!;
    card = <TaskCard task={task} card={choice.card} note={run.notes[task.id]} difficulty={run.difficulty} />;
    info = <TaskInfo task={task} note={run.notes[task.id]} />;
  } else if (choice.type === "joker") {
    card = <JokerCard joker={choice.joker} />;
    info = <JokerInfo joker={choice.joker} run={run} />;
    isBlocked = run.jokers.length >= jokerSlots(run) && choice.joker.edition !== "negative";
  } else {
    card = <ConsumableCard item={choice.item} />;
    info = <ConsumableInfo item={choice.item} run={run} />;
    const def = choice.item.kind === "sciaga" ? SCIAGA_BY_ID[choice.item.id] : null;
    isBlocked = !!def && def.target !== null && run.consumables.length >= consumableSlots(run);
  }
  return (
    <div
      className="relative flex flex-col items-center gap-4"
      onPointerEnter={() => setIsHover(true)}
      onPointerLeave={() => setIsHover(false)}
    >
      <Tilt>{card}</Tilt>
      <div className="flex gap-2">
        <PixelButton tone="green" size="sm" disabled={isBlocked} onClick={() => engine.pickFromPack(choice.uid)}>
          {choice.type === "consumable" && choice.item.kind === "twierdzenie" ? <Trans>Use</Trans> : <Trans>Take</Trans>}
        </PixelButton>
        {choice.type === "task" && (
          <PixelButton
            tone="panel"
            size="sm"
            onClick={() => open({ taskId: choice.card.taskId, cardUid: choice.uid, source: "pack" })}
          >
            <Trans>Open</Trans>
          </PixelButton>
        )}
      </div>
      {isHover && <div className="pointer-events-none absolute bottom-full z-[80] mb-3">{info}</div>}
    </div>
  );
}
