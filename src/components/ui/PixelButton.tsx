import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { audio } from "~/lib/audio";
import { cn } from "~/lib/utils";

/** Balatro button: flat colour, rounded, hard shadow; drops onto the shadow when pressed. */
const buttonVariants = cva(
  "tx relative inline-flex select-none items-center justify-center rounded-panel font-pixel leading-none text-white shadow-hard outline-none transition-[transform,box-shadow,filter] duration-75 focus-visible:ring-4 focus-visible:ring-white/70 active:translate-y-[4px] active:shadow-hard-sm enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:bg-inactive disabled:text-white/50 disabled:shadow-none",
  {
    variants: {
      tone: {
        blue: "bg-blue",
        red: "bg-red",
        orange: "bg-orange",
        green: "bg-green",
        grey: "bg-grey",
        panel: "bg-panel-light",
        money: "bg-money",
        purple: "bg-tarot",
        gold: "bg-gold text-ink",
      },
      size: {
        sm: "h-12 px-4 text-2xl",
        md: "h-16 px-6 text-3xl",
        lg: "h-24 px-8 text-5xl",
        xl: "h-28 px-12 text-6xl",
      },
    },
    defaultVariants: { tone: "orange", size: "md" },
  },
);

type PixelButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { isSilent?: boolean };

export default function PixelButton({ className, tone, size, isSilent, onClick, ...props }: PixelButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ tone, size }), className)}
      onClick={(e) => {
        audio.unlock();
        if (!isSilent) audio.play("click");
        onClick?.(e);
      }}
      {...props}
    />
  );
}

export { buttonVariants };
