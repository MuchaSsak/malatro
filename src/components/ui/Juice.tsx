import { AnimatePresence, motion, useAnimate } from "motion/react";
import { type ReactNode, useEffect } from "react";

import { type Popup, useFx } from "~/lib/fx";
import { cn } from "~/lib/utils";

type JuiceProps = {
  target?: string;
  children: ReactNode;
  className?: string;
  /** where score pop-ups appear relative to the element */
  popupSide?: "top" | "bottom" | "center";
};

/** Balatro "juice_up": damped scale/rotation wobble on every trigger, plus floating pop-ups. */
export default function Juice({ target, children, className, popupSide = "top" }: JuiceProps) {
  const { jiggle, popups } = useFx(target);
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (jiggle.n === 0 || !scope.current) return;
    const s = 0.12 * jiggle.strength;
    void animate(
      scope.current,
      { scale: [1, 1 + s, 1 - s * 0.5, 1 + s * 0.25, 1], rotate: [0, -5 * jiggle.strength, 4 * jiggle.strength, -1.5, 0] },
      { duration: 0.4, ease: "easeOut" },
    );
  }, [jiggle, animate, scope]);

  return (
    <div className={cn("relative", className)}>
      <div ref={scope} className="h-full w-full">
        {children}
      </div>
      <PopupLayer popups={popups} side={popupSide} />
    </div>
  );
}

const TONE: Record<Popup["tone"], string> = {
  chips: "bg-blue",
  mult: "bg-red",
  xmult: "bg-red ring-4 ring-white/80",
  money: "bg-money",
  text: "bg-panel",
  bad: "bg-inactive",
  good: "bg-green",
};

function PopupLayer({ popups, side }: { popups: Popup[]; side: "top" | "bottom" | "center" }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 z-50 flex -translate-x-1/2 flex-col items-center",
        side === "top" && "-top-4 -translate-y-full",
        side === "bottom" && "-bottom-4 translate-y-full",
        side === "center" && "top-1/2 -translate-y-1/2",
      )}
    >
      <AnimatePresence>
        {popups.map((p) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0, y: 10, opacity: 0 }}
            animate={{ scale: [0, 1.25, 1], y: -8, opacity: 1 }}
            exit={{ opacity: 0, y: -28, scale: 0.8 }}
            transition={{ duration: 0.28 }}
            className={cn(
              "tx whitespace-nowrap rounded-lg px-3 py-1 font-pixel text-4xl leading-none text-white shadow-hard-sm",
              TONE[p.tone],
            )}
          >
            {p.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
