import PixelArt from "~/components/ui/PixelArt";
import { BOSS_BY_ID } from "~/lib/game/content/bosses";
import type { BlindKind } from "~/lib/game/types";
import { cn } from "~/lib/utils";

export const BLIND_COLOR: Record<Exclude<BlindKind, "boss">, string> = { small: "#2a55b8", big: "#b07a12" };

export function blindColor(kind: BlindKind, bossId: string | null): string {
  if (kind === "boss") return BOSS_BY_ID[bossId ?? ""]?.color ?? "#b44430";
  return BLIND_COLOR[kind];
}

type BlindChipProps = { kind: BlindKind; bossId: string | null; size?: number; className?: string };

/** Rotating poker-chip disc for a blind (boss chips carry the boss glyph). */
export default function BlindChip({ kind, bossId, size = 110, className }: BlindChipProps) {
  const color = blindColor(kind, bossId);
  const glyph = kind === "boss" ? (BOSS_BY_ID[bossId ?? ""]?.glyph ?? "☠") : kind === "small" ? "S" : "B";
  return (
    <div
      className={cn("relative grid shrink-0 animate-bob place-items-center rounded-full shadow-hard", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${color}ff 0%, ${color}cc 55%, ${color}88 100%)`,
      }}
    >
      <div
        className="absolute inset-[6%] rounded-full"
        style={{ background: `repeating-conic-gradient(#ffffff55 0 12deg, transparent 12deg 45deg)` }}
      />
      <div className="absolute inset-[18%] rounded-full border-4 border-white/50" style={{ backgroundColor: color }} />
      <PixelArt glyph={glyph} size={size * 0.5} res={20} color="#ffffff" className="relative" />
    </div>
  );
}
