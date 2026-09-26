import CardBack from "~/components/cards/CardBack";
import MathText from "~/components/ui/MathText";
import { useSettings } from "~/contexts/SettingsContext";
import { formatValue } from "~/lib/game/answer";
import { CATEGORIES, SUITS } from "~/lib/game/categories";
import { valueRangeLabel } from "~/lib/game/run";
import type { CardInstance, DifficultyMode, TaskRecord } from "~/lib/game/types";
import { cn } from "~/lib/utils";

export const CARD_W = 168;
export const CARD_H = 225;

type TaskCardProps = {
  task: TaskRecord;
  card?: CardInstance;
  /** what the player may see about the hidden value */
  insight?: "value" | "range" | "sign" | null;
  /** effective value (only rendered when insight allows) */
  shownValue?: number | null;
  note?: string | null;
  isDebuffed?: boolean;
  isFaceDown?: boolean;
  hasDrawing?: boolean;
  difficulty?: DifficultyMode;
  scale?: number;
  className?: string;
};

const ENH_STYLE: Record<string, { ring: string; label: string; bg: string }> = {
  bonus: { ring: "ring-blue", label: "+30", bg: "bg-blue" },
  mult: { ring: "ring-red", label: "+4", bg: "bg-red" },
  glass: { ring: "ring-sky-200", label: "×2", bg: "bg-sky-400" },
  lucky: { ring: "ring-green", label: "🍀", bg: "bg-green" },
  gold: { ring: "ring-gold", label: "$", bg: "bg-gold" },
};

export default function TaskCard({
  task,
  card,
  insight,
  shownValue,
  note,
  isDebuffed,
  isFaceDown,
  hasDrawing,
  difficulty,
  scale = 1,
  className,
}: TaskCardProps) {
  const { l } = useSettings();
  const cat = CATEGORIES[task.cat];
  const suit = SUITS[cat.suit];
  const w = CARD_W * scale;
  const h = CARD_H * scale;

  if (isFaceDown) {
    return (
      <div style={{ width: w, height: h }} className={cn("shadow-card rounded-[10px]", className)}>
        <CardBack difficulty={difficulty} />
      </div>
    );
  }

  const enh = card?.enh ? ENH_STYLE[card.enh] : null;
  const edition = card?.edition;
  const mods = card?.mods ?? [];

  return (
    <div
      style={{ width: w, height: h, fontSize: 16 * scale }}
      className={cn(
        "relative select-none overflow-hidden rounded-[10px] border-2 border-[#cfd6d8] bg-paper text-ink shadow-card",
        enh && `ring-4 ring-inset ${enh.ring}`,
        card?.enh === "glass" && "bg-gradient-to-br from-white via-sky-50 to-sky-100",
        edition && `ed-${edition}`,
        isDebuffed && "grayscale",
        className,
      )}
    >
      {/* corner index: suit + category glyph */}
      <div className="absolute left-[0.4em] top-[0.3em] flex flex-col items-center leading-none" style={{ color: suit.color }}>
        <span className="font-pixel text-[1.9em] leading-[0.9]">{cat.glyph}</span>
        <span className="text-[1.05em] leading-none">{suit.symbol}</span>
      </div>
      {/* level + points */}
      <div className="absolute right-[0.4em] top-[0.4em] flex flex-col items-end gap-[0.2em]">
        <span
          className={cn(
            "rounded-[0.3em] px-[0.35em] font-pixel text-[1.05em] leading-[1.15] text-white",
            task.level === "R" ? "bg-tarot" : "bg-green",
          )}
        >
          {task.level}
        </span>
        <span className="font-pixel text-[0.85em] leading-none text-ink/70">{task.pts} pkt</span>
        {task.sum && (
          <span className="rounded-[0.3em] bg-important px-[0.3em] font-pixel text-[0.95em] leading-[1.1] text-white">Σ</span>
        )}
      </div>

      {/* summary */}
      <div className="card-tex absolute inset-x-[0.45em] top-[3.2em] bottom-[2.3em] flex items-center justify-center overflow-hidden text-center text-[0.9em] leading-[1.2] text-[#2c383c]">
        <MathText text={l(task.s)} className="line-clamp-6 [overflow-wrap:anywhere]" />
      </div>

      {/* category pill */}
      <div className="absolute inset-x-[0.4em] bottom-[0.4em] flex justify-center">
        <span
          className="tx truncate rounded-[0.35em] px-[0.5em] py-[0.12em] font-pixel text-[0.95em] leading-none text-white"
          style={{ backgroundColor: suit.color }}
        >
          {l(cat.short)}
        </span>
      </div>

      {/* enhancement badge */}
      {enh && (
        <span
          className={cn(
            "tx absolute left-[0.35em] top-[3.1em] rounded-[0.3em] px-[0.3em] font-pixel text-[0.85em] leading-[1.1] text-white",
            enh.bg,
          )}
        >
          {enh.label}
        </span>
      )}
      {mods.length > 0 && (
        <span className="tx absolute right-[0.35em] top-[4.4em] rounded-[0.3em] bg-purple px-[0.3em] font-pixel text-[0.8em] leading-[1.1] text-white">
          {mods.map((m) => (m === "neg" ? "−x" : m === "dbl" ? "2x" : "|x|")).join(" ")}
        </span>
      )}

      {/* player's note */}
      {note && (
        <div className="absolute -right-[0.1em] bottom-[2.1em] max-w-[70%] rotate-[-4deg] truncate rounded-[0.2em] bg-[#ffe477] px-[0.35em] py-[0.1em] font-pixel text-[0.95em] leading-none text-[#5a4a00] shadow-hard-sm">
          ≈ {note}
        </div>
      )}
      {hasDrawing && <span className="absolute bottom-[2.1em] left-[0.4em] text-[0.8em] opacity-60">✏️</span>}

      {/* what the player knows about the value */}
      {insight && shownValue !== null && shownValue !== undefined && (
        <InsightBadge insight={insight} value={shownValue} />
      )}

      {isDebuffed && (
        <div className="absolute inset-0 grid place-items-center bg-black/15">
          <span className="font-pixel text-[5em] leading-none text-red/90">✕</span>
        </div>
      )}
    </div>
  );
}

function InsightBadge({ insight, value }: { insight: "value" | "range" | "sign"; value: number }) {
  if (insight === "value")
    return (
      <span className="tx absolute left-1/2 top-[2.3em] -translate-x-1/2 rounded-[0.35em] bg-blue px-[0.45em] py-[0.08em] font-pixel text-[1.15em] leading-none text-white shadow-hard-sm">
        {formatValue(value)}
      </span>
    );
  if (insight === "range")
    return (
      <span className="tx absolute left-1/2 top-[2.4em] -translate-x-1/2 whitespace-nowrap rounded-[0.35em] bg-planet px-[0.4em] py-[0.08em] font-pixel text-[0.95em] leading-none text-white shadow-hard-sm">
        {valueRangeLabel(value)}
      </span>
    );
  const sign = value > 0 ? "+" : value < 0 ? "−" : "0";
  return (
    <span
      className={cn(
        "tx absolute left-1/2 top-[2.3em] grid h-[1.5em] w-[1.5em] -translate-x-1/2 place-items-center rounded-full font-pixel text-[1.2em] leading-none text-white shadow-hard-sm",
        value > 0 ? "bg-green" : value < 0 ? "bg-red" : "bg-grey",
      )}
    >
      {sign}
    </span>
  );
}
