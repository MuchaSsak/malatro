import { Trans } from "@lingui/react/macro";

import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { CATEGORIES, CATEGORY_IDS, SUITS } from "~/lib/game/categories";

/** Remaining deck composition by category (tasks stay hidden until drawn). */
export default function DeckView({ onClose }: { onClose: () => void }) {
  const { pool } = useGame();
  const run = useRun();
  const { l } = useSettings();
  const deck = run.round?.deck ?? [];
  const counts = new Map<string, number>();
  for (const c of deck) {
    const cat = pool.byId.get(c.taskId)?.cat;
    if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const levelCounts = { P: 0, R: 0 };
  for (const c of deck) {
    const t = pool.byId.get(c.taskId);
    if (t) levelCounts[t.level] += 1;
  }
  return (
    <div className="w-[980px] p-6">
      <div className="tx mb-4 text-center font-pixel text-5xl text-white">
        <Trans>Remaining deck: {deck.length}</Trans>
      </div>
      <div className="mb-4 flex justify-center gap-4 font-pixel text-3xl">
        <span className="rounded-lg bg-green px-4 py-1 text-white">P: {levelCounts.P}</span>
        <span className="rounded-lg bg-tarot px-4 py-1 text-white">R: {levelCounts.R}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_IDS.map((id) => {
          const cat = CATEGORIES[id];
          const suit = SUITS[cat.suit];
          const n = counts.get(id) ?? 0;
          return (
            <div key={id} className="flex items-center gap-3 rounded-panel bg-inset px-4 py-2" style={{ opacity: n ? 1 : 0.4 }}>
              <span className="w-12 text-center font-pixel text-3xl" style={{ color: suit.color }}>
                {cat.glyph}
              </span>
              <span className="tx flex-1 font-pixel text-[28px] text-white">{l(cat.name)}</span>
              <span className="tx font-pixel text-4xl text-important">{n}</span>
            </div>
          );
        })}
      </div>
      <PixelButton tone="orange" size="md" className="mt-5 w-full" onClick={onClose}>
        <Trans>Back</Trans>
      </PixelButton>
    </div>
  );
}
