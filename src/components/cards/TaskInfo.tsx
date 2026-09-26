import { useLingui } from "@lingui/react/macro";

import InfoPanel from "~/components/ui/InfoPanel";
import MathText from "~/components/ui/MathText";
import { useSettings } from "~/contexts/SettingsContext";
import { CATEGORIES, SUITS } from "~/lib/game/categories";
import type { TaskRecord } from "~/lib/game/types";
import { sessionName } from "~/lib/tasks";

export function examLabel(task: TaskRecord, l: (x: { pl: string; en: string }) => string, isPl: boolean) {
  const level = task.level === "P" ? (isPl ? "podstawowa" : "basic") : isPl ? "rozszerzona" : "extended";
  return `${isPl ? "Matura" : "Matura"} ${task.year} · ${l(sessionName(task.session))} · ${level} · ${isPl ? "zad." : "task"} ${task.task}`;
}

/** Hover tooltip for a task card. */
export default function TaskInfo({ task, note }: { task: TaskRecord; note?: string | null }) {
  const { l, locale } = useSettings();
  const { t } = useLingui();
  const cat = CATEGORIES[task.cat];
  const suit = SUITS[cat.suit];
  const diff = "●".repeat(task.diff) + "○".repeat(5 - task.diff);
  return (
    <InfoPanel
      title={<span style={{ color: "#fff" }}>{l(cat.name)}</span>}
      width={340}
      pills={[
        { text: `${suit.symbol} ${l(suit.name)}`, color: suit.color },
        { text: task.level === "P" ? t`Basic` : t`Extended`, color: task.level === "P" ? "#4BC292" : "#A782D1" },
        { text: diff, color: "#4F6367" },
        ...(task.sum ? [{ text: t`Σ sum of numbers`, color: "#FF9A00" }] : []),
      ]}
    >
      <MathText text={l(task.s)} className="card-tex block text-[20px] leading-snug" />
      <div className="mt-2 text-[17px] leading-tight text-ink/70">{examLabel(task, l, locale === "pl")}</div>
      {note && <div className="mt-1 text-[19px] text-[#8a6d00]">{t`Your note: ${note}`}</div>}
    </InfoPanel>
  );
}
