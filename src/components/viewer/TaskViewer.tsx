import { Trans, useLingui } from "@lingui/react/macro";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { examLabel } from "~/components/cards/TaskInfo";
import { Tex } from "~/components/ui/MathText";
import PixelButton from "~/components/ui/PixelButton";
import type { DrawTool } from "~/components/viewer/DrawingLayer";
import TaskBoard from "~/components/viewer/TaskBoard";
import { useGame } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { useViewer, type ViewerTarget } from "~/contexts/ViewerContext";
import { audio } from "~/lib/audio";
import { drawingKey, getStrokes, setStrokes, type Stroke } from "~/lib/drawings";
import { evaluateAnswer, formatValue, isAnswerCorrect } from "~/lib/game/answer";
import { CATEGORIES, SUITS } from "~/lib/game/categories";
import { VALUE_CAP } from "~/lib/game/constants";
import { canAfford, cardInsight, cardShownValue, valueRangeLabel } from "~/lib/game/run";
import { activeBoss } from "~/lib/game/scoring";
import type { RunState, TaskRecord } from "~/lib/game/types";
import { fetchStatements } from "~/lib/tasks";
import { cn } from "~/lib/utils";

const COLORS = ["#e0302a", "#1d6fe0", "#1f9e5a", "#1c1c1c", "#e08a00"];
/** One-tap inserts for the answer input (everything the answer parser understands). */
const SYMBOLS = ["√", "π", "^", "/", "(", ")", "-", ",", "°", "%"];

/**
 * Fullscreen task: the original CKE crop (or, in English, the translated statement) on a drawable
 * board, plus the player's answer, which is required before the card can be played.
 */
export default function TaskViewer() {
  const { target, close } = useViewer();
  const { run, pool } = useGame();
  useEffect(() => {
    if (!target) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [target, close]);
  const task = target ? pool.byId.get(target.taskId) : null;
  return (
    <AnimatePresence>
      {target && task && run && (
        <motion.div
          key={target.taskId + (target.cardUid ?? "")}
          className="viewer-scrim fixed inset-0 z-[500] flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ViewerBody target={target} task={task} run={run} onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ViewerBody({
  target,
  task,
  run,
  onClose,
}: {
  target: ViewerTarget;
  task: TaskRecord;
  run: RunState;
  onClose: () => void;
}) {
  const { engine, pool } = useGame();
  const { l, locale } = useSettings();
  const { t } = useLingui();
  const [tool, setTool] = useState<DrawTool>({ mode: "pen", color: COLORS[0], size: 5 });
  const [zoom, setZoom] = useState(1);
  const [statement, setStatement] = useState<string | null>(null);
  const [isOriginal, setIsOriginal] = useState(false);
  const [note, setNote] = useState(run.notes[task.id] ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  // English runs read the translated statement; the Polish crop stays one tap away for figures
  const sheet: "pl" | "en" = locale === "en" && !isOriginal ? "en" : "pl";
  const strokeKey = drawingKey(task.id, sheet);
  const [drawing, setDrawing] = useState(() => ({ key: strokeKey, strokes: getStrokes(strokeKey) }));
  if (drawing.key !== strokeKey) setDrawing({ key: strokeKey, strokes: getStrokes(strokeKey) });
  const strokes = drawing.strokes;

  const round = run.round;
  const card = target.cardUid ? round?.hand.find((c) => c.uid === target.cardUid) : undefined;
  const isNoDrawing = activeBoss(run, round)?.kind === "no-drawing" && run.phase === "round";
  const isKnown = run.known[task.id] === "value" || target.source === "played";
  const insight = card ? cardInsight(run, card) : null;
  const shownValue = card ? cardShownValue(run, card, pool) : null;
  const isSelected = !!card && !!round?.selected.includes(card.uid);
  const cat = CATEGORIES[task.cat];
  const suit = SUITS[cat.suit];
  const parsed = evaluateAnswer(note);

  useEffect(() => {
    if (locale !== "en") return;
    let isActive = true;
    fetchStatements(task.exam).then((s) => isActive && setStatement(s[task.task] ?? null));
    return () => {
      isActive = false;
    };
  }, [locale, task.exam, task.task]);

  const saveStrokes = (next: Stroke[]) => {
    setDrawing({ key: strokeKey, strokes: next });
    setStrokes(strokeKey, next);
  };

  const saveNote = (value: string) => {
    setNote(value);
    engine.setNote(task.id, value);
  };

  const insertSymbol = (symbol: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? note.length;
    const end = el?.selectionEnd ?? note.length;
    saveNote(note.slice(0, start) + symbol + note.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  };

  const shopItem = target.source === "shop" ? run.shop?.items.find((i) => i.uid === target.cardUid) : undefined;
  const packChoice = target.source === "pack" ? run.pack?.choices.find((c) => c.uid === target.cardUid) : undefined;
  const effectiveTool: DrawTool = isNoDrawing ? { ...tool, mode: "none" } : tool;

  return (
    <div className="flex h-full w-full">
      {/* image + drawing */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b-4 border-black/30 bg-panel px-4 py-2">
          <ToolButton isActive={tool.mode === "none"} onClick={() => setTool({ ...tool, mode: "none" })} label={t`Pan`}>
            ✋
          </ToolButton>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              disabled={isNoDrawing}
              onClick={() => setTool({ ...tool, mode: "pen", color: c })}
              className={cn(
                "h-10 w-10 rounded-full border-4 shadow-hard-sm disabled:opacity-30",
                tool.mode === "pen" && tool.color === c ? "border-white" : "border-transparent",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          {[3, 5, 9].map((s) => (
            <ToolButton
              key={s}
              isActive={tool.size === s && tool.mode === "pen"}
              onClick={() => setTool({ ...tool, mode: "pen", size: s })}
              label={`${s}px`}
              isDisabled={isNoDrawing}
            >
              <span className="inline-block rounded-full bg-white" style={{ width: s * 2, height: s * 2 }} />
            </ToolButton>
          ))}
          <ToolButton
            isActive={tool.mode === "eraser"}
            onClick={() => setTool({ ...tool, mode: "eraser" })}
            label={t`Eraser`}
            isDisabled={isNoDrawing}
          >
            🧽
          </ToolButton>
          <ToolButton
            onClick={() => saveStrokes(strokes.slice(0, -1))}
            label={t`Undo`}
            isDisabled={isNoDrawing || strokes.length === 0}
          >
            ↶
          </ToolButton>
          <ToolButton onClick={() => saveStrokes([])} label={t`Clear`} isDisabled={isNoDrawing || strokes.length === 0}>
            🗑
          </ToolButton>
          <div className="mx-2 h-8 w-1 rounded bg-white/20" />
          <ToolButton onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} label={t`Zoom out`}>
            −
          </ToolButton>
          <span className="tx w-16 text-center font-pixel text-2xl text-white">{Math.round(zoom * 100)}%</span>
          <ToolButton onClick={() => setZoom((z) => Math.min(3, z + 0.2))} label={t`Zoom in`}>
            +
          </ToolButton>
          {locale === "en" && (
            <ToolButton isActive={isOriginal} onClick={() => setIsOriginal((v) => !v)} label="Original (Polish) sheet">
              <span className="px-1 text-xl">PL</span>
            </ToolButton>
          )}
          {isNoDrawing && (
            <span className="tx ml-3 rounded-lg bg-red px-3 py-1 font-pixel text-xl text-white">
              <Trans>Boss: no scratch paper!</Trans>
            </span>
          )}
          <div className="flex-1" />
          <PixelButton tone="orange" size="sm" onClick={onClose}>
            <Trans>Close (Esc)</Trans>
          </PixelButton>
        </div>
        <TaskBoard
          task={task}
          sheet={sheet}
          statement={statement}
          zoom={zoom}
          tool={effectiveTool}
          strokes={strokes}
          onStrokesChange={saveStrokes}
        />
      </div>

      {/* side panel */}
      <aside className="scroll-thin flex w-[400px] shrink-0 flex-col gap-3 overflow-y-auto bg-panel p-4 shadow-[-6px_0_0_rgba(0,0,0,0.3)]">
        <div className="rounded-panel px-4 py-3 text-center shadow-hard" style={{ backgroundColor: suit.color }}>
          <div className="tx font-pixel text-4xl leading-none text-white">{l(cat.name)}</div>
          <div className="tx mt-1 font-pixel text-xl text-white/85">{l(task.topic)}</div>
        </div>
        <div className="rounded-panel bg-inset px-4 py-3 font-pixel text-xl leading-snug text-white/85">
          {examLabel(task, l, locale === "pl")}
          <div className="mt-1 flex gap-2 text-2xl">
            <span className={cn("rounded px-2 text-white", task.level === "R" ? "bg-tarot" : "bg-green")}>
              {task.level}
            </span>
            <span className="rounded bg-panel-light px-2 text-white">{task.pts} pkt</span>
            <span className="rounded bg-panel-light px-2 text-important">{"●".repeat(task.diff)}</span>
          </div>
        </div>
        <div className="rounded-panel bg-white px-4 py-3 text-center font-pixel text-[21px] leading-snug text-ink">
          {task.sum ? (
            <Trans>
              Card value = the <span className="text-important">sum of all numbers</span> in the final answer
            </Trans>
          ) : (
            <Trans>Card value = the final answer (a number)</Trans>
          )}
          <div className="mt-1 text-[17px] text-ink/60">
            <Trans>Chips per card are capped at ±{VALUE_CAP}</Trans>
          </div>
        </div>

        {/* the player's own answer */}
        <div className="rounded-panel bg-inset-deep p-4">
          <label className="tx mb-2 block font-pixel text-2xl text-white" htmlFor="note-input">
            <Trans>Your answer</Trans>
          </label>
          <input
            ref={inputRef}
            id="note-input"
            value={note}
            onChange={(e) => saveNote(e.target.value)}
            placeholder={t`e.g. 12, -3/2, 2√3`}
            autoComplete="off"
            className="w-full rounded-lg border-4 border-panel-light bg-[#fffbe6] px-3 py-2 font-pixel text-3xl text-[#3a3000] outline-none focus:border-money"
          />
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {SYMBOLS.map((symbol) => (
              <button
                key={symbol}
                type="button"
                // keep focus (and the caret) in the input
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => insertSymbol(symbol)}
                className="tx h-10 rounded-lg bg-panel-light font-pixel text-2xl text-white shadow-hard-sm hover:bg-grey active:translate-y-[2px] active:shadow-none"
              >
                {symbol}
              </button>
            ))}
          </div>
          <div className="mt-2 min-h-[28px] font-pixel text-xl text-white/70">
            {note && (parsed === null ? <Trans>Not a number I can read</Trans> : <>= {formatValue(parsed)}</>)}
          </div>
          <div className="font-pixel text-[17px] leading-tight text-white/50">
            <Trans>Required to play this card. A wrong answer scores 0 chips.</Trans>
          </div>
        </div>

        {/* what is known about the value */}
        {isKnown ? (
          <div className="rounded-panel bg-blue/90 p-4 text-center shadow-hard">
            <div className="tx font-pixel text-2xl text-white">
              <Trans>Answer from the key</Trans>
            </div>
            <div className="my-2 rounded-lg bg-white px-3 py-2 text-[22px] text-ink">
              <Tex tex={task.ans || task.tex} />
            </div>
            <div className="tx font-pixel text-4xl text-white">= {formatValue(task.value)}</div>
            {note && (
              <div className="tx mt-1 font-pixel text-2xl text-white">
                {isAnswerCorrect(note, task.value, `${task.tex} ${task.ans ?? ""}`) ? (
                  <Trans>Your answer was right ✓</Trans>
                ) : (
                  <Trans>Your answer was wrong ✗</Trans>
                )}
              </div>
            )}
          </div>
        ) : insight && shownValue !== null ? (
          <div className="rounded-panel bg-planet/80 p-4 text-center shadow-hard">
            <div className="tx font-pixel text-2xl text-white">
              {insight === "value" ? (
                <Trans>Revealed value</Trans>
              ) : insight === "range" ? (
                <Trans>Value range</Trans>
              ) : (
                <Trans>Value sign</Trans>
              )}
            </div>
            <div className="tx font-pixel text-5xl text-white">
              {insight === "value"
                ? formatValue(shownValue)
                : insight === "range"
                  ? valueRangeLabel(shownValue)
                  : shownValue > 0
                    ? "+"
                    : shownValue < 0
                      ? "−"
                      : "0"}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2">
          {target.source === "hand" && card && round && !round.pending && card.uid !== round.forcedUid && (
            <PixelButton
              tone={isSelected ? "grey" : "blue"}
              size="md"
              onClick={() => {
                engine.toggleSelect(card.uid);
                audio.play(isSelected ? "deselect" : "select");
              }}
            >
              {isSelected ? <Trans>Deselect card</Trans> : <Trans>Select for play</Trans>}
            </PixelButton>
          )}
          {shopItem && !shopItem.isSold && (
            <PixelButton
              tone="green"
              size="md"
              disabled={!canAfford(run, shopItem.price)}
              onClick={() => {
                engine.buyItem(shopItem.uid);
                onClose();
              }}
            >
              <Trans>Buy for ${shopItem.price}</Trans>
            </PixelButton>
          )}
          {packChoice && (
            <PixelButton
              tone="green"
              size="md"
              onClick={() => {
                engine.pickFromPack(packChoice.uid);
                onClose();
              }}
            >
              <Trans>Take this card</Trans>
            </PixelButton>
          )}
          <PixelButton tone="orange" size="md" onClick={onClose}>
            <Trans>Back to the table</Trans>
          </PixelButton>
        </div>
      </aside>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  isActive,
  label,
  isDisabled,
}: {
  children: ReactNode;
  onClick: () => void;
  isActive?: boolean;
  label: string;
  isDisabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "tx grid h-11 min-w-11 place-items-center rounded-lg px-2 font-pixel text-2xl text-white shadow-hard-sm transition-colors disabled:opacity-30",
        isActive ? "bg-red" : "bg-panel-light hover:bg-grey",
      )}
    >
      {children}
    </button>
  );
}
