import { Trans } from "@lingui/react/macro";
import { type PointerEvent, useEffect, useRef, useState } from "react";

import MathText from "~/components/ui/MathText";
import DrawingLayer, { type DrawTool } from "~/components/viewer/DrawingLayer";
import type { Stroke } from "~/lib/drawings";
import type { TaskRecord } from "~/lib/game/types";

/** Logical board size: strokes are stored in these units, the board is scaled to the pane. */
const BOARD_W = 1600;
const SHEET_W = 1300;
const MARGIN = 70;
/** English statements that refer to a picture also get the original figure under the text. */
const FIGURE_RE = /figure|graph|diagram|drawing|shown|picture|table|plot|chart|grid|see the/i;

type TaskBoardProps = {
  task: TaskRecord;
  /** "pl": the original CKE crop; "en": the English statement typeset as a sheet */
  sheet: "pl" | "en";
  statement: string | null;
  zoom: number;
  tool: DrawTool;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
};

/**
 * The drawable area of the task viewer: a 1600-unit-wide board with the task sheet in the middle,
 * scaled to the pane like the game stage. The drawing layer covers the whole board, so the dark
 * margin works as scratch paper too. With the hand tool, dragging pans the board.
 */
export default function TaskBoard({ task, sheet, statement, zoom, tool, strokes, onStrokesChange }: TaskBoardProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [viewport, setViewport] = useState({ w: 1100, h: 900 });
  const [sheetH, setSheetH] = useState(600);

  useEffect(() => {
    const vp = viewportRef.current;
    const sh = sheetRef.current;
    if (!vp || !sh) return;
    const observer = new ResizeObserver(() => {
      setViewport({ w: vp.clientWidth, h: vp.clientHeight });
      setSheetH(sh.offsetHeight);
    });
    observer.observe(vp);
    observer.observe(sh);
    return () => observer.disconnect();
  }, []);

  const scale = (viewport.w * zoom) / BOARD_W;
  const boardH = Math.max(viewport.h / scale, sheetH + 2 * MARGIN);
  const sheetW = sheet === "pl" ? Math.min(SHEET_W, task.w * 1.9) : SHEET_W;
  const hasFigure = sheet === "en" && !!statement && FIGURE_RE.test(statement);

  const handlePanStart = (e: PointerEvent<HTMLDivElement>) => {
    if (tool.mode !== "none" || !viewportRef.current) return;
    const vp = viewportRef.current;
    panRef.current = { x: e.clientX, y: e.clientY, left: vp.scrollLeft, top: vp.scrollTop };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePanMove = (e: PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan || !viewportRef.current) return;
    viewportRef.current.scrollLeft = pan.left - (e.clientX - pan.x);
    viewportRef.current.scrollTop = pan.top - (e.clientY - pan.y);
  };

  return (
    <div
      ref={viewportRef}
      className="scroll-thin relative min-h-0 flex-1 overflow-auto"
      style={{ cursor: tool.mode === "none" ? "var(--cur-grab)" : undefined }}
      onPointerDown={handlePanStart}
      onPointerMove={handlePanMove}
      onPointerUp={() => (panRef.current = null)}
      onPointerCancel={() => (panRef.current = null)}
    >
      <div className="relative mx-auto" style={{ width: BOARD_W * scale, height: boardH * scale }}>
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: BOARD_W, height: boardH, transform: `scale(${scale})` }}
        >
          <div ref={sheetRef} className="absolute" style={{ left: (BOARD_W - sheetW) / 2, top: MARGIN, width: sheetW }}>
            {sheet === "pl" ? (
              <div
                className="relative overflow-hidden rounded-xl bg-white shadow-hard"
                style={{ aspectRatio: `${task.w} / ${task.h}` }}
              >
                <img
                  src={`/tasks/${task.img}`}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full select-none"
                />
              </div>
            ) : (
              <div
                className="rounded-xl bg-white px-14 py-12 text-[#1c282c] shadow-hard"
                style={{ fontSize: 36, lineHeight: 1.55, fontFamily: '"Times New Roman", Georgia, serif' }}
              >
                <div className="mb-5 font-bold" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  <Trans>
                    Task {task.task}. (0-{task.pts})
                  </Trans>
                </div>
                {statement ? (
                  <MathText text={statement} as="div" />
                ) : (
                  <div className="text-[#1c282c]/50">
                    <Trans>Loading...</Trans>
                  </div>
                )}
                {hasFigure && (
                  <div className="mt-8">
                    <div className="mb-2 font-pixel text-[26px] uppercase tracking-wide text-[#1c282c]/55">
                      <Trans>Figure from the original sheet</Trans>
                    </div>
                    <img
                      src={`/tasks/${task.img}`}
                      alt=""
                      draggable={false}
                      className="w-full select-none rounded-lg border-4 border-[#1c282c]/10"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <DrawingLayer width={BOARD_W} height={boardH} tool={tool} strokes={strokes} onChange={onStrokesChange} />
        </div>
      </div>
    </div>
  );
}
