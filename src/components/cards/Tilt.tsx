import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

import { audio } from "~/lib/audio";
import { cn } from "~/lib/utils";

type TiltProps = {
  children: ReactNode;
  className?: string;
  /** idle sway phase so cards in a row don't move in lockstep */
  phase?: number;
  isIdle?: boolean;
  isHoverSound?: boolean;
};

/**
 * 3D tilt toward the cursor + hover pop, like Balatro's vertex-shader skew. Also feeds
 * --mx/--my to edition layers so foil/holo sheen follows the pointer.
 */
export default function Tilt({ children, className, phase = 0, isIdle = true, isHoverSound = true }: TiltProps) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [11, -11]), { stiffness: 300, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-13, 13]), { stiffness: 300, damping: 20 });
  const lift = useSpring(1, { stiffness: 500, damping: 25 });

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <motion.div
      className={cn("relative [transform-style:preserve-3d]", className)}
      style={{
        rotateX: rx,
        rotateY: ry,
        scale: lift,
        transformPerspective: 700,
        // CSS vars consumed by .ed-* layers
        ["--mx" as string]: mx,
        ["--my" as string]: my,
      }}
      onPointerMove={handleMove}
      onPointerEnter={() => {
        lift.set(1.06);
        if (isHoverSound) audio.play("hover", { volume: 0.35 });
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
        lift.set(1);
      }}
    >
      {/* CSS keyframes (.sway), not motion: a row of cards swaying must not tick JS every frame */}
      <div className={cn("h-full w-full", isIdle && "sway")} style={{ animationDelay: `${-phase}s` }}>
        {children}
      </div>
    </motion.div>
  );
}
