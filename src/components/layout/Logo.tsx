import { cn } from "~/lib/utils";

type LogoProps = { size?: number; className?: string; onCardClick?: () => void };

/** "M[card]LATRO" wordmark: chunky off-white pixel letters, teal outline, a task card as the first A. */
export default function Logo({ size = 190, className, onCardClick }: LogoProps) {
  const letters = ["M", "card", "L", "A", "T", "R", "O"];
  return (
    <div className={cn("flex items-end justify-center", className)} style={{ gap: size * 0.02 }}>
      {letters.map((ch, i) =>
        ch === "card" ? (
          <button
            key={i}
            type="button"
            aria-label="Malatro"
            onClick={onCardClick}
            className="logo-card relative grid place-items-center rounded-[10px] border-4 border-[#1e3b40] bg-paper shadow-hard active:brightness-90"
            style={{ width: size * 0.62, height: size * 0.86, marginBottom: size * 0.04 }}
          >
            <span className="absolute left-2 top-1 font-pixel text-[#fe5f55]" style={{ fontSize: size * 0.16 }}>
              Σ
            </span>
            <span className="font-pixel leading-none text-[#fe5f55]" style={{ fontSize: size * 0.5 }}>
              A
            </span>
            <span
              className="absolute bottom-1 right-2 rotate-180 font-pixel text-[#fe5f55]"
              style={{ fontSize: size * 0.16 }}
            >
              Σ
            </span>
          </button>
        ) : (
          <span
            key={i}
            className="logo-bob inline-block font-pixel leading-[0.8]"
            style={{
              ["--bob" as string]: `${-size * 0.025}px`,
              animationDelay: `${i * 0.12}s`,
              fontSize: size,
              color: "#f4f1e8",
              WebkitTextStroke: `${size * 0.035}px #1e3b40`,
              paintOrder: "stroke fill",
              textShadow: `0 ${size * 0.05}px 0 rgba(0,0,0,.45), ${size * 0.02}px 0 #009dff, ${-size * 0.02}px 0 #fe5f55`,
            }}
          >
            {ch}
          </span>
        ),
      )}
    </div>
  );
}
