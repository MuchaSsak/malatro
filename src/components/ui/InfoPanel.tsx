import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export type InfoPill = { text: string; color: string };

type InfoPanelProps = {
  title: ReactNode;
  children?: ReactNode;
  pills?: InfoPill[];
  className?: string;
  width?: number;
};

/** Balatro tooltip: light rim, dark body, white title, white inner box with dark text, bottom pills. */
export default function InfoPanel({ title, children, pills, className, width = 300 }: InfoPanelProps) {
  return (
    <div
      className={cn("rounded-[14px] bg-outline p-[4px] shadow-hard", className)}
      style={{ width }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="rounded-[11px] bg-panel px-3 pb-3 pt-2">
        <div className="tx mb-2 text-center font-pixel text-[30px] leading-[1] text-white">{title}</div>
        {children && (
          <div className="rounded-lg bg-white px-3 py-2 text-center font-pixel text-[22px] leading-[1.15] text-ink">
            {children}
          </div>
        )}
        {pills && pills.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {pills.map((p) => (
              <span
                key={p.text}
                className="tx rounded-lg px-3 py-1 font-pixel text-[20px] leading-none text-white shadow-hard-sm"
                style={{ backgroundColor: p.color }}
              >
                {p.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
