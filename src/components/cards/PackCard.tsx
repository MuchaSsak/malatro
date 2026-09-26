import { useLingui } from "@lingui/react/macro";

import PixelArt from "~/components/ui/PixelArt";
import type { PackKind, PackSize } from "~/lib/game/types";
import { cn } from "~/lib/utils";

const PACK_LOOK: Record<PackKind, { a: string; b: string; art: string }> = {
  zadania: { a: "#8fa3a8", b: "#4f6367", art: "📄" },
  sciagi: { a: "#c9a6f0", b: "#7a58a8", art: "📜" },
  twierdzenia: { a: "#5fd3ea", b: "#0f5f7a", art: "🪐" },
  jokery: { a: "#ffb35c", b: "#c2412d", art: "🃏" },
};

type PackCardProps = { kind: PackKind; size: PackSize; className?: string };

/** Foil chip-bag booster with crimped ends and a chunky title. */
export default function PackCard({ kind, size, className }: PackCardProps) {
  const { t } = useLingui();
  const look = PACK_LOOK[kind];
  const title = {
    zadania: t`Task Pack`,
    sciagi: t`Cheat Sheet Pack`,
    twierdzenia: t`Theorem Pack`,
    jokery: t`Joker Pack`,
  }[kind];
  const sizeLabel = size === "jumbo" ? t`JUMBO` : size === "mega" ? t`MEGA` : "";
  return (
    <div
      className={cn("relative h-[200px] w-[128px] animate-bob", className)}
      style={{ ["--pack-a" as string]: look.a, ["--pack-b" as string]: look.b }}
    >
      <div className="pack-foil absolute inset-0 overflow-hidden rounded-[8px] shadow-card">
        <div
          className="absolute inset-x-0 top-0 h-[14px] opacity-80"
          style={{ background: "repeating-linear-gradient(90deg, #fff8 0 3px, transparent 3px 7px)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[14px] opacity-80"
          style={{ background: "repeating-linear-gradient(90deg, #fff8 0 3px, transparent 3px 7px)" }}
        />
        <div className="absolute inset-x-0 top-[26px] grid place-items-center">
          <PixelArt glyph={look.art} size={76} res={26} />
        </div>
        {sizeLabel && (
          <div className="tx absolute inset-x-0 top-[16px] text-center font-pixel text-2xl leading-none text-white">
            {sizeLabel}
          </div>
        )}
        <div className="tx absolute inset-x-1 bottom-[20px] text-center font-pixel text-[22px] leading-[0.95] text-white">
          {title}
        </div>
      </div>
    </div>
  );
}
