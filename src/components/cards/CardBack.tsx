import type { DifficultyMode } from "~/lib/game/types";
import { cn } from "~/lib/utils";

const BACK_COLORS: Record<DifficultyMode, [string, string]> = {
  trywialne: ["#2fae78", "#1d7a52"],
  trywialne_plus: ["#009dff", "#0a5fa0"],
  ciekawe: ["#fe5f55", "#b3342c"],
  ciekawe_plus: ["#b26cbb", "#7a3f82"],
  ciekawe_plus_plus: ["#3a3f44", "#15181b"],
};

type CardBackProps = { difficulty?: DifficultyMode; className?: string; style?: React.CSSProperties };

/** Lattice card back (Red Deck style), tinted per difficulty deck. */
export default function CardBack({ difficulty = "ciekawe", className, style }: CardBackProps) {
  const [a, b] = BACK_COLORS[difficulty];
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[10px] border-[5px] border-white bg-white",
        className,
      )}
      style={style}
    >
      <div
        className="absolute inset-[4px] rounded-md"
        style={{
          backgroundColor: a,
          backgroundImage: `repeating-linear-gradient(45deg, ${b} 0 4px, transparent 4px 14px), repeating-linear-gradient(-45deg, ${b} 0 4px, transparent 4px 14px)`,
        }}
      />
      <div className="absolute inset-[18px] grid place-items-center rounded-md border-4 border-white/85">
        <span className="font-pixel text-5xl text-white/90" style={{ textShadow: `0 3px 0 ${b}` }}>
          Σ
        </span>
      </div>
    </div>
  );
}
