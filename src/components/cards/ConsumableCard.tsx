import { CARD_H, CARD_W } from "~/components/cards/TaskCard";
import PixelArt from "~/components/ui/PixelArt";
import { useSettings } from "~/contexts/SettingsContext";
import { SCIAGA_BY_ID, TWIERDZENIE_BY_ID } from "~/lib/game/content/consumables";
import { HAND_BY_ID } from "~/lib/game/hands";
import type { ConsumableInstance } from "~/lib/game/types";
import { cn } from "~/lib/utils";

type ConsumableCardProps = { item: ConsumableInstance; scale?: number; className?: string };

/** Ściąga = parchment tarot with gold frame; Twierdzenie = dark-teal planet card. */
export default function ConsumableCard({ item, scale = 1, className }: ConsumableCardProps) {
  const { l } = useSettings();
  const w = CARD_W * scale;
  const h = CARD_H * scale;
  if (item.kind === "twierdzenie") {
    const def = TWIERDZENIE_BY_ID[item.id];
    return (
      <div
        style={{ width: w, height: h, fontSize: 16 * scale }}
        className={cn(
          "relative overflow-hidden rounded-[10px] border-[3px] border-[#9fd9e6] shadow-card",
          item.isNegative && "ed-negative",
          className,
        )}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, #3aa6c4 0, transparent 35%), radial-gradient(circle at 75% 80%, #13afce55, transparent 40%), linear-gradient(160deg, #123447, #081a26)",
          }}
        />
        {/* stars */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(#fff 1px, transparent 1.5px), radial-gradient(#9fd9e6 1px, transparent 1.5px)",
            backgroundSize: "37px 41px, 23px 29px",
            backgroundPosition: "3px 7px, 11px 2px",
          }}
        />
        <div className="absolute inset-x-0 top-[2.2em] grid place-items-center">
          <div className="grid h-[5.6em] w-[5.6em] place-items-center rounded-full bg-gradient-to-br from-[#7fe0f0] to-[#0f6b86] shadow-[0_0_24px_#13afce]">
            <span className="tx font-pixel text-[2.2em] leading-none text-white">{def?.art}</span>
          </div>
        </div>
        <div className="absolute inset-x-[0.5em] bottom-[0.5em] rounded-[0.4em] bg-[#0b2230]/85 px-1 py-[0.25em] text-center">
          <div className="tx font-pixel text-[0.9em] leading-[1] text-white">{l(def?.name)}</div>
          <div className="font-pixel text-[0.75em] leading-[1.1] text-planet">
            {l(HAND_BY_ID[def?.hand ?? "high"].name)}
          </div>
        </div>
      </div>
    );
  }
  const def = SCIAGA_BY_ID[item.id];
  const isSoul = item.id === "natchnienie";
  return (
    <div
      style={{ width: w, height: h, fontSize: 16 * scale }}
      className={cn(
        "relative overflow-hidden rounded-[10px] border-[3px] border-[#d8b24a] bg-[#f3e6c4] shadow-card",
        item.isNegative && "ed-negative",
        className,
      )}
    >
      <div className="absolute inset-[0.35em] rounded-[0.45em] border-2 border-[#b88a2c]" />
      <div className="absolute inset-x-0 top-[0.5em] text-center font-pixel text-[0.8em] tracking-widest text-[#8a6420]">
        {isSoul ? "✦ ✦ ✦" : "ŚCIĄGA"}
      </div>
      <div
        className="absolute inset-x-[0.9em] top-[1.7em] grid h-[8.2em] place-items-center rounded-[0.4em]"
        style={{
          background: isSoul
            ? "radial-gradient(circle, #fff7c2, #f3b958 55%, #a782d1)"
            : "radial-gradient(circle at 50% 40%, #fffaf0, #e5c98a 70%, #c9a45a)",
        }}
      >
        <PixelArt glyph={def?.art ?? "?"} size={84 * scale} res={28} color="#5a3d0c" />
      </div>
      <div className="absolute inset-x-[0.5em] bottom-[0.55em] rounded-[0.35em] bg-[#8a6420] px-1 py-[0.2em] text-center">
        <span className="tx line-clamp-2 font-pixel text-[0.85em] leading-[1] text-white">{l(def?.name)}</span>
      </div>
    </div>
  );
}
