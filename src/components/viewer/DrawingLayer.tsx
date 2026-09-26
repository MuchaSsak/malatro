import { getStroke } from "perfect-freehand";
import { type PointerEvent, useRef, useState } from "react";

import type { Stroke } from "~/lib/drawings";

export type DrawTool = { mode: "pen" | "eraser" | "none"; color: string; size: number };

type DrawingLayerProps = {
  width: number; // viewBox size: strokes are stored in these units (TaskBoard's board units)
  height: number;
  tool: DrawTool;
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
};

function pathFromStroke(points: [number, number, number][], size: number): string {
  const outline = getStroke(points, { size, thinning: 0.55, smoothing: 0.5, streamline: 0.45, simulatePressure: true });
  if (!outline.length) return "";
  const d = outline.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...outline[0], "Q"] as (string | number)[],
  );
  d.push("Z");
  return d.join(" ");
}

/** SVG scratch layer over the task image (controlled: the viewer owns and persists strokes). */
export default function DrawingLayer({ width, height, tool, strokes, onChange }: DrawingLayerProps) {
  const [live, setLive] = useState<Stroke | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toPoint = (e: PointerEvent<SVGSVGElement>): [number, number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * width, ((e.clientY - r.top) / r.height) * height, e.pressure || 0.5];
  };

  const eraseAt = (p: [number, number, number]) => {
    const radius = 18;
    const next = strokes.filter((s) => !s.points.some(([x, y]) => (x - p[0]) ** 2 + (y - p[1]) ** 2 < radius * radius));
    if (next.length !== strokes.length) onChange(next);
  };

  const handleDown = (e: PointerEvent<SVGSVGElement>) => {
    if (tool.mode === "none" || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toPoint(e);
    if (tool.mode === "eraser") eraseAt(p);
    else setLive({ color: tool.color, size: tool.size, points: [p] });
  };
  const handleMove = (e: PointerEvent<SVGSVGElement>) => {
    if (tool.mode === "eraser" && e.buttons === 1) eraseAt(toPoint(e));
    else if (live) setLive({ ...live, points: [...live.points, toPoint(e)] });
  };
  const handleUp = () => {
    if (!live) return;
    // a single tap still leaves a dot
    const points: Stroke["points"] =
      live.points.length > 1 ? live.points : [...live.points, [live.points[0][0] + 0.5, live.points[0][1] + 0.5, 0.5]];
    onChange([...strokes, { ...live, points }]);
    setLive(null);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 h-full w-full"
      style={{
        touchAction: tool.mode === "none" ? "auto" : "none",
        cursor: tool.mode === "none" ? "inherit" : "var(--cur-draw)",
        overflow: "visible",
      }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      {[...strokes, ...(live ? [live] : [])].map((s, i) => (
        <path key={i} d={pathFromStroke(s.points, s.size)} fill={s.color} opacity={0.9} />
      ))}
    </svg>
  );
}
