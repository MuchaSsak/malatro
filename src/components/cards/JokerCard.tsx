import { CARD_H, CARD_W } from "~/components/cards/TaskCard";
import PixelArt from "~/components/ui/PixelArt";
import { useSettings } from "~/contexts/SettingsContext";
import { JOKER_BY_ID, RARITY_COLOR } from "~/lib/game/content/jokers";
import type { JokerInstance } from "~/lib/game/types";
import { cn } from "~/lib/utils";

type JokerCardProps = { joker: JokerInstance; scale?: number; isFaceDown?: boolean; className?: string };

/** White card, vertical "JOKER" wordmark in two corners, pixel art centre, rarity-tinted frame. */
export default function JokerCard({ joker, scale = 1, isFaceDown, className }: JokerCardProps) {
  const { l } = useSettings();
  const def = JOKER_BY_ID[joker.id];
  const color = RARITY_COLOR[def?.rarity ?? "common"];
  const w = CARD_W * scale;
  const h = CARD_H * scale;
  if (isFaceDown) {
    return (
      <div
        style={{ width: w, height: h }}
        className={cn("grid place-items-center rounded-[10px] border-4 border-white bg-panel-light shadow-card", className)}
      >
        <span className="font-pixel text-6xl text-white/60">?</span>
      </div>
    );
  }
  const isLegend = def?.rarity === "legendary";
  return (
    <div
      style={{ width: w, height: h, fontSize: 16 * scale }}
      className={cn(
        "relative overflow-hidden rounded-[10px] border-2 border-[#cfd6d8] bg-paper shadow-card",
        joker.edition && `ed-${joker.edition}`,
        joker.isDisabled && "grayscale",
        className,
      )}
    >
      <Wordmark className="left-[0.35em] top-[0.4em]" />
      <Wordmark className="bottom-[0.4em] right-[0.35em] rotate-180" />
      <div
        className="absolute inset-x-[1.9em] inset-y-[0.9em] grid place-items-center overflow-hidden rounded-[0.5em]"
        style={{
          background: isLegend
            ? "radial-gradient(circle at 50% 40%, #f7e7ff, #b26cbb 70%, #6d3a73)"
            : `radial-gradient(circle at 50% 38%, #ffffff 0%, ${color}33 55%, ${color}88 100%)`,
        }}
      >
        <PixelArt glyph={def?.art ?? "?"} size={92 * scale} res={30} color="#2c383c" className={isLegend ? "animate-bob" : undefined} />
      </div>
      <div className="absolute inset-x-[1.6em] bottom-[1.2em] text-center">
        <span className="tx line-clamp-2 font-pixel text-[0.95em] leading-[1] text-white" style={{ WebkitTextStroke: "0" }}>
          <span className="rounded bg-panel/80 px-1">{l(def?.name)}</span>
        </span>
      </div>
      {joker.isDisabled && (
        <div className="absolute inset-0 grid place-items-center bg-black/25">
          <span className="font-pixel text-[5em] text-red">✕</span>
        </div>
      )}
    </div>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("absolute font-pixel text-[0.95em] leading-[0.82] text-[#374244]", className)}
      style={{ writingMode: "vertical-rl", textOrientation: "upright", letterSpacing: "-0.05em" }}
    >
      JOKER
    </span>
  );
}
