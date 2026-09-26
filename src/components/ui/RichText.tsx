import { Fragment } from "react";

import { SUITS } from "~/lib/game/categories";
import type { SuitId } from "~/lib/game/types";
import { cn } from "~/lib/utils";

const TOKEN_REGEX = /\[(c|m|x|\$|g|a|alg|fun|geo|rac):([^\]]+)\]/g;

type RichTextProps = { text: string; vars?: Record<string, string | number>; className?: string };

/**
 * Renders Balatro tooltip markup: [c:+30] chips, [m:+4] mult, [x:×2] xmult pill, [$:$3] money,
 * [g:1 in 4] chance, [a:word] highlight, [geo:Geometria] branch colour; {name} = runtime var.
 */
export default function RichText({ text, vars, className }: RichTextProps) {
  const filled = vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : text;
  const parts: { kind: string; text: string }[] = [];
  let last = 0;
  for (const m of filled.matchAll(TOKEN_REGEX)) {
    if (m.index! > last) parts.push({ kind: "plain", text: filled.slice(last, m.index) });
    parts.push({ kind: m[1], text: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < filled.length) parts.push({ kind: "plain", text: filled.slice(last) });

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.kind === "plain") return <Fragment key={i}>{p.text}</Fragment>;
        if (p.kind === "x")
          return (
            <span key={i} className="mx-0.5 rounded bg-red px-1 text-white">
              {p.text}
            </span>
          );
        if (p.kind in SUITS)
          return (
            <span key={i} style={{ color: SUITS[p.kind as SuitId].color }}>
              {p.text}
            </span>
          );
        return (
          <span
            key={i}
            className={cn(
              p.kind === "c" && "text-blue",
              p.kind === "m" && "text-red",
              p.kind === "$" && "text-[#d49a2a]",
              p.kind === "g" && "text-green",
              p.kind === "a" && "text-important",
            )}
          >
            {p.text}
          </span>
        );
      })}
    </span>
  );
}
