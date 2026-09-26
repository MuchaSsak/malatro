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
import { answerLetter, checkNote, evaluateAnswer, formatValue } from "~/lib/game/answer";
import { CATEGORIES, SUITS } from "~/lib/game/categories";
import { KNOWLEDGE_MULT, taskChips } from "~/lib/game/constants";
import { canAfford, cardInsight, cardShownValue, valueRangeLabel } from "~/lib/game/run";
import { activeBoss, cardChips, knowledgeMult } from "~/lib/game/scoring";
import type { RunState, TaskRecord } from "~/lib/game/types";
import { recordAttempts, setMarked, useTaskProgress } from "~/lib/progress";
import { fetchStatements } from "~/lib/tasks";
import { cn } from "~/lib/utils";

const COLORS = ["#e0302a", "#1d6fe0", "#1f9e5a", "#1c1c1c", "#e08a00"];
/** One-tap inserts for the answer input (everything the answer parser understands). */
const SYMBOLS = ["√", "π", "^", "/", "(", ")", "-", ",", "°", "%"];
const LETTERS = ["A", "B", "C", "D"];

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
  // the Collection opens tasks outside any run
  const isOpen = !!target && !!task && (!!run || target.source === "collection");
  return (
    <AnimatePresence>
      {isOpen && target && task && (
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
  run: RunState | null;
  onClose: () => void;
}) {
  const { engine, pool } = useGame();
  const isStudy = target.source === "collection";
  const { l, locale } = useSettings();
  const { t } = useLingui();
  const [tool, setTool] = useState<DrawTool>({ mode: "pen", color: COLORS[0], size: 5 });
  const [zoom, setZoom] = useState(1);
  const [statement, setStatement] = useState<string | null>(null);
  const [isOriginal, setIsOriginal] = useState(false);
  const [note, setNote] = useState(isStudy ? "" : (run?.notes[task.id] ?? ""));
  const [isChecked, setIsChecked] = useState(false);
  const progress = useTaskProgress(task.id);
  const inputRef = useRef<HTMLInputElement>(null);
  // English runs read the translated statement; the Polish crop stays one tap away for figures
  const sheet: "pl" | "en" = locale === "en" && !isOriginal ? "en" : "pl";
  const strokeKey = drawingKey(task.id, sheet);
  const [drawing, setDrawing] = useState(() => ({ key: strokeKey, strokes: getStrokes(strokeKey) }));
  const [history, setHistory] = useState<{ key: string; past: Stroke[][]; future: Stroke[][] }>({
    key: strokeKey,
    past: [],
    future: [],
  });
  if (drawing.key !== strokeKey) setDrawing({ key: strokeKey, strokes: getStrokes(strokeKey) });
  if (history.key !== strokeKey) setHistory({ key: strokeKey, past: [], future: [] });
  const strokes = drawing.strokes;

  const round = run?.round ?? null;
  const card = target.cardUid ? round?.hand.find((c) => c.uid === target.cardUid) : undefined;
  const isNoDrawing = !!run && activeBoss(run, round)?.kind === "no-drawing" && run.phase === "round";
  const isKnown = isStudy ? isChecked : run?.known[task.id] === "value" || target.source === "played";
  const insight = card && run ? cardInsight(run, card) : null;
  const shownValue = card && run ? cardShownValue(run, card, pool) : null;
  const isSelected = !!card && !!round?.selected.includes(card.uid);
  const cat = CATEGORIES[task.cat];
  const suit = SUITS[cat.suit];
  const parsed = evaluateAnswer(note);
  const letter = task.key ? answerLetter(note) : null;
  // what a correct answer scores on this card (ściąga mods and boss rules included)
  const chipsIfRight = run && card ? cardChips(run, round, card, task) : taskChips(task);
  const multIfRight = run && card ? knowledgeMult(run, round) : KNOWLEDGE_MULT;

  useEffect(() => {
    if (locale !== "en") return;
    let isActive = true;
    fetchStatements(task.exam).then((s) => isActive && setStatement(s[task.task] ?? null));
    return () => {
      isActive = false;
    };
  }, [locale, task.exam, task.task]);

  const writeStrokes = (next: Stroke[]) => {
    setDrawing({ key: strokeKey, strokes: next });
    setStrokes(strokeKey, next);
  };
  const saveStrokes = (next: Stroke[]) => {
    setHistory({ key: strokeKey, past: [...history.past, strokes].slice(-100), future: [] });
    writeStrokes(next);
  };
  const handleUndo = () => {
    // strokes loaded from an earlier visit have no history: undo drops the last one
    const prev = history.past.at(-1) ?? (strokes.length ? strokes.slice(0, -1) : null);
    if (!prev) return;
    setHistory({ key: strokeKey, past: history.past.slice(0, -1), future: [strokes, ...history.future] });
    writeStrokes(prev);
  };
  const handleRedo = () => {
    const next = history.future[0];
    if (!next) return;
    setHistory({ key: strokeKey, past: [...history.past, strokes], future: history.future.slice(1) });
    writeStrokes(next);
  };

  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y for the drawing (the answer input keeps its own text undo)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || isNoDrawing) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const saveNote = (value: string) => {
    setNote(value);
    if (!isStudy) engine.setNote(task.id, value);
  };

  const handleCheck = () => {
    if (parsed === null || isChecked) return;
    setIsChecked(true);
    const isCorrect = checkNote(note, task);
    recordAttempts([{ taskId: task.id, isCorrect }]);
    audio.play(isCorrect ? "coin" : "error");
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

  const shopItem = target.source === "shop" ? run?.shop?.items.find((i) => i.uid === target.cardUid) : undefined;
  const packChoice = target.source === "pack" ? run?.pack?.choices.find((c) => c.uid === target.cardUid) : undefined;
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
            onClick={handleUndo}
            label={t`Undo (Ctrl+Z)`}
            isDisabled={isNoDrawing || (strokes.length === 0 && history.past.length === 0)}
          >
            ↶
          </ToolButton>
          <ToolButton
            onClick={handleRedo}
            label={t`Redo (Ctrl+Y)`}
            isDisabled={isNoDrawing || history.future.length === 0}
          >
            ↷
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
            <div className="flex-1" />
            {/* what a right answer is worth */}
            <span className="rounded bg-blue px-2 text-white" title={t`If right`}>
              +{chipsIfRight}
            </span>
            {multIfRight > 0 && <span className="rounded bg-red px-2 text-white">+{multIfRight}</span>}
          </div>
        </div>

        {/* the player's own answer */}
        <div className="rounded-panel bg-inset-deep p-4">
          <label
            className="tx mb-2 flex items-baseline justify-between font-pixel text-2xl text-white"
            htmlFor="note-input"
          >
            <Trans>Your answer</Trans>
            {task.sum && (
              <span className="text-lg text-important">
                <Trans>Σ sum of all numbers</Trans>
              </span>
            )}
          </label>
          <input
            ref={inputRef}
            id="note-input"
            value={note}
            onChange={(e) => saveNote(e.target.value)}
            placeholder={task.key ? t`number or A-D` : t`e.g. 12, -3/2, 2√3`}
            autoComplete="off"
            className="w-full rounded-lg border-4 border-panel-light bg-[#fffbe6] px-3 py-2 font-pixel text-3xl text-[#3a3000] outline-none focus:border-money"
          />
          {/* closed task: pick the option letter */}
          {task.key && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {LETTERS.map((l, i) => {
                const tex = task.opts?.[i]?.[0];
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => saveNote(l)}
                    className={cn(
                      "flex h-11 items-center gap-2 overflow-hidden rounded-lg px-2 text-left shadow-hard-sm active:translate-y-[2px] active:shadow-none",
                      letter === l ? "bg-money text-[#3a3000]" : "bg-panel-light text-white hover:bg-grey",
                      !tex && "justify-center",
                    )}
                  >
                    <span className="font-pixel text-2xl">{l}</span>
                    {tex && (
                      <span className="min-w-0 truncate text-[16px]">
                        <Tex tex={tex} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
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
          {note && !letter && (parsed === null || String(formatValue(parsed)) !== note.trim()) && (
            <div className={cn("mt-2 font-pixel text-xl", parsed === null ? "text-red" : "text-white/70")}>
              {parsed === null ? <Trans>Not a number I can read</Trans> : <>= {formatValue(parsed)}</>}
            </div>
          )}
          {isStudy ? (
            <PixelButton
              tone="green"
              size="sm"
              className="mt-2 w-full"
              disabled={(parsed === null && !letter) || isChecked}
              onClick={handleCheck}
            >
              <Trans>Check answer</Trans>
            </PixelButton>
          ) : null}
        </div>

        {/* study record across runs + the manual "don't know" mark */}
        <div className="flex items-center gap-2 rounded-panel bg-inset px-3 py-2 font-pixel text-xl">
          <span className="text-green">✓ {progress?.ok ?? 0}</span>
          <span className="text-red">✗ {progress?.miss ?? 0}</span>
          <div className="flex-1" />
          <PixelButton
            tone={progress?.isMarked ? "purple" : "panel"}
            size="sm"
            onClick={() => setMarked(task.id, !progress?.isMarked)}
          >
            {progress?.isMarked ? <Trans>Marked: don't know</Trans> : <Trans>I don't know this</Trans>}
          </PixelButton>
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
                {checkNote(note, task) ? (
                  <Trans>Your answer was right ✓</Trans>
                ) : (
                  <Trans>Your answer was wrong ✗</Trans>
                )}
              </div>
            )}
          </div>
        ) : isStudy ? (
          <PixelButton tone="blue" size="sm" onClick={() => setIsChecked(true)}>
            <Trans>Show the answer</Trans>
          </PixelButton>
        ) : insight && shownValue !== null ? (
          <div className="rounded-panel bg-planet/80 p-4 text-center shadow-hard">
            <div className="tx font-pixel text-2xl text-white">
              {insight === "value" ? (
                <Trans>Revealed answer</Trans>
              ) : insight === "range" ? (
                <Trans>Answer range</Trans>
              ) : (
                <Trans>Answer sign</Trans>
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
          {shopItem && run && !shopItem.isSold && (
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
            {isStudy ? <Trans>Back</Trans> : <Trans>Back to the table</Trans>}
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
