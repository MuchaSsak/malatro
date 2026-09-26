import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";

import JokerCard from "~/components/cards/JokerCard";
import TaskCard from "~/components/cards/TaskCard";
import BlindChip from "~/components/game/BlindChip";
import PixelButton from "~/components/ui/PixelButton";
import RichText from "~/components/ui/RichText";
import { useGame } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { useViewer } from "~/contexts/ViewerContext";
import { audio } from "~/lib/audio";
import { CATEGORIES, SUITS } from "~/lib/game/categories";
import { BOSSES } from "~/lib/game/content/bosses";
import { JOKERS, RARITY_COLOR, RARITY_NAME } from "~/lib/game/content/jokers";
import { DIFFICULTIES } from "~/lib/game/constants";
import type { TaskPool } from "~/lib/game/deck";
import type { CategoryId, JokerRarity, Level, TaskRecord } from "~/lib/game/types";
import { type RunRecord, type TaskProgress, taskStatus, useProgress } from "~/lib/progress";
import { cn, formatDuration, formatNumber } from "~/lib/utils";

type CollectionProps = { onClose: () => void; onPlay: () => void };

type Tab = "cards" | "jokers" | "bosses" | "stats" | "runs";
type StatusFilter = "all" | "ok" | "dontknow";
type SortKey = "recent" | "missed" | "correct" | "diff" | "exam";

const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];
const PAGE_SIZE = 40;
const LEVEL_TONE: Record<Level, string> = { P: "#4BC292", R: "#a782d1" };
/** answers per level before the readiness estimate means anything */
const MIN_ANSWERS = 10;
const RARITIES: JokerRarity[] = ["common", "uncommon", "rare", "legendary"];

/**
 * Balatro-style Collection: every task the player has met, split into "answered correctly" and
 * "don't know" (last answer wrong, or marked by hand), every joker and boss blind, study stats per
 * matura level and the run history with one-click seed replays. Progress reads the local store.
 */
export default function Collection({ onClose, onPlay }: CollectionProps) {
  const [tab, setTab] = useState<Tab>("cards");
  return (
    <div className="flex h-[960px] w-[1780px] flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <div className="tx mr-6 font-pixel text-6xl text-white">
          <Trans>Collection</Trans>
        </div>
        <PixelButton tone={tab === "cards" ? "red" : "panel"} size="md" onClick={() => setTab("cards")}>
          <Trans>Tasks</Trans>
        </PixelButton>
        <PixelButton tone={tab === "jokers" ? "red" : "panel"} size="md" onClick={() => setTab("jokers")}>
          <Trans>Jokers</Trans>
        </PixelButton>
        <PixelButton tone={tab === "bosses" ? "red" : "panel"} size="md" onClick={() => setTab("bosses")}>
          <Trans>Boss blinds</Trans>
        </PixelButton>
        <PixelButton tone={tab === "stats" ? "red" : "panel"} size="md" onClick={() => setTab("stats")}>
          <Trans>Matura readiness</Trans>
        </PixelButton>
        <PixelButton tone={tab === "runs" ? "red" : "panel"} size="md" onClick={() => setTab("runs")}>
          <Trans>Runs</Trans>
        </PixelButton>
        <div className="flex-1" />
        <PixelButton tone="orange" size="md" onClick={onClose}>
          <Trans>Back</Trans>
        </PixelButton>
      </div>
      <div className="min-h-0 flex-1">
        {tab === "cards" && <CardsTab />}
        {tab === "jokers" && <JokersTab />}
        {tab === "bosses" && <BossesTab />}
        {tab === "stats" && <StatsTab />}
        {tab === "runs" && <RunsTab onPlay={onPlay} />}
      </div>
    </div>
  );
}

/** Cards */

function CardsTab() {
  const { pool } = useGame();
  const { l, locale } = useSettings();
  const { t } = useLingui();
  const { open } = useViewer();
  const progress = useProgress();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [level, setLevel] = useState<Level | "all">("all");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(0);

  const met = Object.entries(progress.tasks)
    .map(([id, p]) => ({ task: pool.byId.get(id), p }))
    .filter((e): e is { task: TaskRecord; p: TaskProgress } => !!e.task);
  const counts = {
    all: met.length,
    ok: met.filter((e) => taskStatus(e.p) === "ok").length,
    dontknow: met.filter((e) => taskStatus(e.p) === "dontknow").length,
  };
  const shown = met
    .filter((e) => status === "all" || taskStatus(e.p) === status)
    .filter((e) => level === "all" || e.task.level === level)
    .filter((e) => cat === "all" || e.task.cat === cat)
    .sort((a, b) => {
      if (sort === "missed") return b.p.miss - a.p.miss || b.p.lastAt - a.p.lastAt;
      if (sort === "correct") return b.p.ok - a.p.ok || b.p.lastAt - a.p.lastAt;
      if (sort === "diff") return b.task.diff - a.task.diff || a.task.id.localeCompare(b.task.id);
      if (sort === "exam") return b.task.year - a.task.year || a.task.id.localeCompare(b.task.id);
      return b.p.lastAt - a.p.lastAt;
    });
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = shown.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const change = (fn: () => void) => {
    fn();
    setPage(0);
  };
  const sorts: [SortKey, string][] = [
    ["recent", t`Recent`],
    ["missed", t`Most missed`],
    ["correct", t`Most correct`],
    ["diff", t`Hardest`],
    ["exam", t`Newest exam`],
  ];

  return (
    <div className="flex h-full gap-4">
      {/* filters */}
      <div className="scroll-thin flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto rounded-panel bg-inset p-3">
        <div className="tx font-pixel text-2xl text-white">
          <Trans>
            Met {formatNumber(counts.all)} of {formatNumber(pool.all.length)}
          </Trans>
        </div>
        <FilterGroup label={t`Show`}>
          <Chip isActive={status === "all"} onClick={() => change(() => setStatus("all"))}>
            <Trans>All ({counts.all})</Trans>
          </Chip>
          <Chip isActive={status === "ok"} tone="#4BC292" onClick={() => change(() => setStatus("ok"))}>
            <Trans>Answered correctly ({counts.ok})</Trans>
          </Chip>
          <Chip isActive={status === "dontknow"} tone="#FE5F55" onClick={() => change(() => setStatus("dontknow"))}>
            <Trans>Don't know ({counts.dontknow})</Trans>
          </Chip>
        </FilterGroup>
        <FilterGroup label={t`Level`}>
          {(["all", "P", "R"] as const).map((lv) => (
            <Chip key={lv} isActive={level === lv} onClick={() => change(() => setLevel(lv))}>
              {lv === "all" ? t`All` : lv === "P" ? t`Basic` : t`Extended`}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label={t`Category`}>
          <Chip isActive={cat === "all"} onClick={() => change(() => setCat("all"))}>
            <Trans>All</Trans>
          </Chip>
          {CATEGORY_IDS.map((c) => (
            <Chip
              key={c}
              isActive={cat === c}
              tone={SUITS[CATEGORIES[c].suit].color}
              onClick={() => change(() => setCat(c))}
            >
              {l(CATEGORIES[c].name)}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label={t`Sort`}>
          {sorts.map(([key, label]) => (
            <Chip key={key} isActive={sort === key} onClick={() => change(() => setSort(key))}>
              {label}
            </Chip>
          ))}
        </FilterGroup>
      </div>

      {/* grid */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto rounded-panel bg-inset-deep p-4">
          {visible.length === 0 ? (
            <div className="grid h-full place-items-center text-center font-pixel text-3xl text-white/60">
              {counts.all === 0 ? (
                <Trans>Play a run: every task you answer lands here.</Trans>
              ) : (
                <Trans>No tasks match these filters.</Trans>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,168px)] justify-center gap-x-4 gap-y-5">
              {visible.map(({ task, p }) => (
                <button
                  key={task.id}
                  type="button"
                  title={`${task.exam} · ${locale === "pl" ? "zad." : "task"} ${task.task}`}
                  onClick={() => {
                    audio.play("select");
                    open({ taskId: task.id, source: "collection" });
                  }}
                  className={cn(
                    "rounded-[12px] transition-transform hover:-translate-y-1",
                    taskStatus(p) === "dontknow" && "ring-4 ring-red/70",
                  )}
                >
                  <TaskCard task={task} />
                </button>
              ))}
            </div>
          )}
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <PixelButton tone="red" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
              ‹
            </PixelButton>
            <span className="tx font-pixel text-2xl text-white">
              {current + 1} / {pages}
            </span>
            <PixelButton tone="red" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              ›
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="font-pixel text-lg uppercase text-white/50">{label}</div>
      {children}
    </div>
  );
}

function Chip({
  isActive,
  tone,
  onClick,
  children,
}: {
  isActive: boolean;
  tone?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        audio.play("click");
        onClick();
      }}
      className={cn(
        "tx flex-1 truncate rounded-lg px-3 py-1.5 text-left font-pixel text-xl text-white shadow-hard-sm",
        isActive ? "bg-red" : "bg-panel-light hover:bg-grey",
      )}
      style={tone && !isActive ? { boxShadow: `inset 5px 0 0 ${tone}, 0 3px 0 rgba(0,0,0,.35)` } : undefined}
    >
      {children}
    </button>
  );
}

/** Stats */

type Agg = { ok: number; miss: number; met: number; total: number; weight: number };

/**
 * Per level: attempts, accuracy and coverage per category. The readiness estimate weights each
 * category by its share of matura points in the pool; each category's accuracy is shrunk towards
 * the player's overall accuracy at that level, so a category never touched counts as "about as good
 * as elsewhere" rather than as mastered or failed. Below MIN_ANSWERS there is no estimate at all.
 */
function levelStats(pool: TaskPool, tasks: Record<string, TaskProgress>, level: Level) {
  const byCat = Object.fromEntries(
    CATEGORY_IDS.map((c) => [c, { ok: 0, miss: 0, met: 0, total: 0, weight: 0 }]),
  ) as Record<CategoryId, Agg>;
  const byDiff = [1, 2, 3, 4, 5].map(() => ({ ok: 0, miss: 0 }));
  let points = 0;
  for (const t of pool.all) {
    if (t.level !== level) continue;
    byCat[t.cat].total += 1;
    byCat[t.cat].weight += t.pts;
    points += t.pts;
    const p = tasks[t.id];
    if (!p) continue;
    byCat[t.cat].ok += p.ok;
    byCat[t.cat].miss += p.miss;
    if (p.ok + p.miss > 0) byCat[t.cat].met += 1;
    byDiff[Math.max(1, Math.min(5, t.diff)) - 1].ok += p.ok;
    byDiff[Math.max(1, Math.min(5, t.diff)) - 1].miss += p.miss;
  }
  const inLevel = CATEGORY_IDS.filter((c) => byCat[c].total > 0);
  const attempts = inLevel.reduce((s, c) => s + byCat[c].ok + byCat[c].miss, 0);
  const correct = inLevel.reduce((s, c) => s + byCat[c].ok, 0);
  const prior = (correct + 1) / (attempts + 2);
  const cats = inLevel.map((c) => {
    const a = byCat[c];
    return { id: c, ...a, share: a.weight / Math.max(1, points), acc: (a.ok + 2 * prior) / (a.ok + a.miss + 2) };
  });
  const met = cats.reduce((s, c) => s + c.met, 0);
  const total = cats.reduce((s, c) => s + c.total, 0);
  const readiness = attempts >= MIN_ANSWERS ? cats.reduce((s, c) => s + c.share * c.acc, 0) : null;
  return { cats, byDiff, attempts, correct, met, total, readiness };
}

function StatsTab() {
  const { pool } = useGame();
  const progress = useProgress();
  const runs = progress.runs.slice(0, 30).reverse();
  return (
    <div className="scroll-thin flex h-full flex-col gap-4 overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <LevelPanel level="P" stats={levelStats(pool, progress.tasks, "P")} />
        <LevelPanel level="R" stats={levelStats(pool, progress.tasks, "R")} />
      </div>
      <RunTrend runs={runs} />
    </div>
  );
}

function LevelPanel({ level, stats }: { level: Level; stats: ReturnType<typeof levelStats> }) {
  const { l } = useSettings();
  const { t } = useLingui();
  const tone = LEVEL_TONE[level];
  const accuracy = stats.attempts ? stats.correct / stats.attempts : null;
  const confidence = stats.attempts < 30 ? t`low` : stats.attempts < 150 ? t`medium` : t`high`;
  const focus = stats.cats
    .filter((c) => c.ok + c.miss >= 3)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);
  return (
    <div className="flex flex-col gap-3 rounded-panel bg-inset p-4" style={{ boxShadow: `inset 0 6px 0 ${tone}` }}>
      <div className="flex items-end justify-between pt-1">
        <div className="tx font-pixel text-4xl" style={{ color: tone }}>
          {level === "P" ? <Trans>Basic matura</Trans> : <Trans>Extended matura</Trans>}
        </div>
        <div className="font-pixel text-xl text-white/60">
          <Trans>
            {formatNumber(stats.attempts)} answers · {formatNumber(stats.met)}/{formatNumber(stats.total)} tasks met
          </Trans>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <Gauge value={stats.readiness} tone={tone} />
        <div className="flex flex-1 flex-col gap-2 font-pixel text-2xl text-white">
          {stats.readiness === null ? (
            <div>
              <Trans>Estimated exam score</Trans>:{" "}
              <span className="text-white/60">
                <Trans>answer {MIN_ANSWERS - stats.attempts} more tasks</Trans>
              </span>
            </div>
          ) : (
            <div>
              <Trans>Estimated exam score</Trans>:{" "}
              <span style={{ color: tone }}>{Math.round(stats.readiness * 100)}%</span>
            </div>
          )}
          <div className="text-xl text-white/70">
            <Trans>Accuracy</Trans>: {accuracy === null ? "-" : `${Math.round(accuracy * 100)}%`} ·{" "}
            <Trans>Confidence</Trans>: {confidence}
          </div>
          <div className="text-xl text-white/70">
            <Trans>Coverage</Trans>: {Math.round((stats.met / Math.max(1, stats.total)) * 100)}%
          </div>
          {focus.length > 0 && (
            <div className="text-xl text-white/85">
              <Trans>Focus on</Trans>:{" "}
              <span className="text-red">{focus.map((c) => l(CATEGORIES[c.id].short)).join(", ")}</span>
            </div>
          )}
        </div>
      </div>
      {/* accuracy per category; bar length = smoothed accuracy, the thin line = coverage */}
      <div className="flex flex-col gap-1.5">
        {stats.cats.map((c) => {
          const n = c.ok + c.miss;
          const suit = SUITS[CATEGORIES[c.id].suit];
          return (
            <div key={c.id} className="flex items-center gap-2 font-pixel text-lg text-white">
              <span className="w-[210px] truncate text-right">{l(CATEGORIES[c.id].name)}</span>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-black/30">
                {n > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded"
                    style={{ width: `${(c.ok / n) * 100}%`, backgroundColor: suit.color }}
                  />
                )}
                <div
                  className="absolute bottom-0 left-0 h-[3px] bg-white/70"
                  style={{ width: `${(c.met / c.total) * 100}%` }}
                />
              </div>
              <span className="w-[120px] text-right text-white/80">
                {n ? `${Math.round((c.ok / n) * 100)}%` : "-"} <span className="text-white/45">({n})</span>
              </span>
              <span className="w-[56px] text-right text-white/45" title={t`Share of exam points`}>
                {Math.round(c.share * 100)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 font-pixel text-lg text-white/70">
        <span className="w-[210px] text-right">
          <Trans>By difficulty</Trans>
        </span>
        {stats.byDiff.map((d, i) => {
          const n = d.ok + d.miss;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative h-14 w-full overflow-hidden rounded bg-black/30">
                {n > 0 && (
                  <div
                    className="absolute inset-x-0 bottom-0"
                    style={{ height: `${(d.ok / n) * 100}%`, backgroundColor: tone }}
                  />
                )}
              </div>
              <span className="text-important">{"●".repeat(i + 1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Semicircle gauge (0..1); null = not enough data, drawn empty with a "?". */
function Gauge({ value, tone }: { value: number | null; tone: string }) {
  const r = 70;
  const len = Math.PI * r;
  return (
    <svg width={180} height={110} viewBox="0 0 180 110" className="shrink-0">
      <path
        d="M 20 95 A 70 70 0 0 1 160 95"
        fill="none"
        stroke="rgba(0,0,0,.35)"
        strokeWidth={20}
        strokeLinecap="round"
      />
      {!!value && (
        <path
          d="M 20 95 A 70 70 0 0 1 160 95"
          fill="none"
          stroke={tone}
          strokeWidth={20}
          strokeLinecap="round"
          strokeDasharray={`${len * Math.max(0, Math.min(1, value ?? 0))} ${len}`}
        />
      )}
      <text
        x={90}
        y={92}
        textAnchor="middle"
        className="font-pixel"
        fontSize={36}
        fill={value === null ? "rgba(255,255,255,.5)" : "#fff"}
      >
        {value === null ? "?" : `${Math.round(value * 100)}%`}
      </text>
    </svg>
  );
}

/** Jokers */

function JokersTab() {
  const { l } = useSettings();
  const { t } = useLingui();
  const [rarity, setRarity] = useState<JokerRarity | "all">("all");
  const shown = JOKERS.filter((j) => rarity === "all" || j.rarity === rarity).sort(
    (a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity),
  );
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="tx mr-2 font-pixel text-2xl text-white">
          <Trans>{JOKERS.length} jokers</Trans>
        </span>
        <Chip isActive={rarity === "all"} onClick={() => setRarity("all")}>
          {t`All`}
        </Chip>
        {RARITIES.map((r) => (
          <Chip key={r} isActive={rarity === r} tone={RARITY_COLOR[r]} onClick={() => setRarity(r)}>
            {l(RARITY_NAME[r])} ({JOKERS.filter((j) => j.rarity === r).length})
          </Chip>
        ))}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto rounded-panel bg-inset-deep p-4">
        <div className="grid grid-cols-3 gap-4">
          {shown.map((def) => (
            <div key={def.id} className="flex gap-4 rounded-panel bg-panel p-3 shadow-hard-sm">
              <JokerCard joker={{ uid: def.id, id: def.id, vars: def.initVars?.() ?? {} }} scale={0.72} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="tx font-pixel text-3xl leading-none text-white">{l(def.name)}</div>
                <div className="flex gap-2 font-pixel text-lg">
                  <span className="rounded px-2 text-white" style={{ backgroundColor: RARITY_COLOR[def.rarity] }}>
                    {l(RARITY_NAME[def.rarity])}
                  </span>
                  <span className="text-money">${def.cost}</span>
                </div>
                <div className="rounded-lg bg-paper px-2.5 py-2 font-pixel text-xl leading-tight text-ink">
                  <RichText
                    text={l(def.desc)}
                    vars={def.vars?.({ uid: def.id, id: def.id, vars: def.initVars?.() ?? {} }, null)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Bosses */

function BossesTab() {
  const { l } = useSettings();
  const shown = [...BOSSES].sort((a, b) => Number(!!a.isFinisher) - Number(!!b.isFinisher) || a.minAnte - b.minAnte);
  return (
    <div className="scroll-thin h-full overflow-y-auto rounded-panel bg-inset-deep p-4">
      <div className="grid grid-cols-3 gap-4">
        {shown.map((boss) => (
          <div
            key={boss.id}
            className="flex items-center gap-4 rounded-panel bg-panel p-3 shadow-hard-sm"
            style={{ boxShadow: `inset 6px 0 0 ${boss.color}` }}
          >
            <BlindChip kind="boss" bossId={boss.id} size={96} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="tx font-pixel text-3xl leading-none" style={{ color: boss.color }}>
                <span className="[filter:brightness(1.6)]">{l(boss.name)}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 font-pixel text-lg text-white/70">
                <span>
                  <Trans>From ante {boss.minAnte}</Trans>
                </span>
                <span className="text-red">
                  <Trans>Target ×{boss.targetMult}</Trans>
                </span>
                <span className="text-money">
                  <Trans>Reward ${boss.reward ?? 5}</Trans>
                </span>
                {boss.isFinisher && (
                  <span className="text-important">
                    <Trans>Final boss</Trans>
                  </span>
                )}
              </div>
              <div className="rounded-lg bg-inset px-2.5 py-2 font-pixel text-xl leading-tight text-white">
                <RichText text={l(boss.desc)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Accuracy per run for the last runs, coloured by difficulty. */
function RunTrend({ runs }: { runs: RunRecord[] }) {
  const w = 1700;
  const h = 200;
  const pad = 30;
  const step = runs.length > 1 ? (w - 2 * pad) / (runs.length - 1) : 0;
  const points = runs.map((r, i) => {
    const acc = r.answered ? r.correct / r.answered : 0;
    return { x: pad + i * step, y: h - pad - acc * (h - 2 * pad), acc, r };
  });
  return (
    <div className="rounded-panel bg-inset p-4">
      <div className="tx mb-2 font-pixel text-3xl text-white">
        <Trans>Answer accuracy per run</Trans>
      </div>
      {runs.length === 0 ? (
        <div className="py-8 text-center font-pixel text-2xl text-white/60">
          <Trans>No finished runs yet.</Trans>
        </div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="block">
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line
                x1={pad}
                x2={w - pad}
                y1={h - pad - g * (h - 2 * pad)}
                y2={h - pad - g * (h - 2 * pad)}
                stroke="rgba(255,255,255,.12)"
                strokeDasharray="6 6"
              />
              <text x={4} y={h - pad - g * (h - 2 * pad) + 6} fontSize={18} fill="rgba(255,255,255,.5)">
                {g * 100}
              </text>
            </g>
          ))}
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,.6)"
            strokeWidth={3}
          />
          {points.map((p) => (
            <circle
              key={p.r.id}
              cx={p.x}
              cy={p.y}
              r={9}
              fill={DIFFICULTIES.find((d) => d.id === p.r.difficulty)?.tone ?? "#fff"}
              stroke="#1e2b2e"
              strokeWidth={3}
            >
              <title>{`${Math.round(p.acc * 100)}% · ${p.r.correct}/${p.r.answered}`}</title>
            </circle>
          ))}
        </svg>
      )}
    </div>
  );
}

/** Runs */

function RunsTab({ onPlay }: { onPlay: () => void }) {
  const { engine, run } = useGame();
  const { locale } = useSettings();
  const { t } = useLingui();
  const progress = useProgress();
  const hasActive = !!run && run.phase !== "gameover" && run.phase !== "won";
  const outcome = { won: t`Won`, lost: t`Lost`, abandoned: t`Abandoned` };
  const tone = { won: "#009DFF", lost: "#FE5F55", abandoned: "#8a8a8a" };

  const handleReplay = (r: RunRecord) => {
    if (hasActive && !window.confirm(t`Start a new run? The current run will be lost.`)) return;
    engine.newRun(r.difficulty, r.seed, r.avoid);
    audio.play("shuffle");
    onPlay();
  };

  if (progress.runs.length === 0)
    return (
      <div className="grid h-full place-items-center rounded-panel bg-inset font-pixel text-3xl text-white/60">
        <Trans>No finished runs yet.</Trans>
      </div>
    );
  return (
    <div className="scroll-thin h-full overflow-y-auto rounded-panel bg-inset p-3">
      <table className="w-full font-pixel text-2xl text-white">
        <thead>
          <tr className="text-xl text-white/60">
            <th className="p-2 text-left">
              <Trans>Date</Trans>
            </th>
            <th className="p-2 text-left">
              <Trans>Deck</Trans>
            </th>
            <th className="p-2 text-left">
              <Trans>Result</Trans>
            </th>
            <th className="p-2">
              <Trans>Ante</Trans>
            </th>
            <th className="p-2 text-right">
              <Trans>Score</Trans>
            </th>
            <th className="p-2 text-right">
              <Trans>Answers</Trans>
            </th>
            <th className="p-2 text-right">
              <Trans>Time</Trans>
            </th>
            <th className="p-2 text-left">
              <Trans>Seed</Trans>
            </th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {progress.runs.map((r) => {
            const diff = DIFFICULTIES.find((d) => d.id === r.difficulty);
            return (
              <tr key={r.id} className="border-t-2 border-white/10">
                <td className="p-2 text-white/80">
                  {new Date(r.endedAt).toLocaleString(locale === "pl" ? "pl-PL" : "en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-2" style={{ color: diff?.tone }}>
                  {diff?.name}
                </td>
                <td className="p-2" style={{ color: tone[r.outcome] }}>
                  {outcome[r.outcome]}
                  {r.isEndless && " ∞"}
                </td>
                <td className="p-2 text-center">{r.ante}</td>
                <td className="p-2 text-right text-blue">{formatNumber(r.totalScore)}</td>
                <td className="p-2 text-right text-green">
                  {r.correct}/{r.answered}
                </td>
                <td className="p-2 text-right text-white/80">{formatDuration(r.playTimeMs)}</td>
                <td className="p-2 text-white/80">{r.seed}</td>
                <td className="p-2 text-right">
                  <PixelButton tone="green" size="sm" onClick={() => handleReplay(r)}>
                    <Trans>Replay</Trans>
                  </PixelButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
