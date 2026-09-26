import type { HTMLAttributes } from "react";

import { cn } from "~/lib/utils";

type PanelProps = HTMLAttributes<HTMLDivElement> & { tone?: "panel" | "inset" | "deep" | "light" };

/** Smooth rounded panel with a hard drop shadow (Balatro panels are not stepped-pixel). */
export default function Panel({ className, tone = "panel", ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-panel",
        tone === "panel" && "bg-panel shadow-hard",
        tone === "inset" && "bg-inset",
        tone === "deep" && "bg-inset-deep",
        tone === "light" && "bg-panel-light shadow-hard",
        className,
      )}
      {...props}
    />
  );
}
