import { Trans } from "@lingui/react/macro";
import { useState } from "react";

import PixelButton from "~/components/ui/PixelButton";
import RichText from "~/components/ui/RichText";
import { useRun } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import { BOSS_BY_ID } from "~/lib/game/content/bosses";
import { VOUCHER_BY_ID } from "~/lib/game/content/vouchers";
import { HAND_TYPES, handBase } from "~/lib/game/hands";
import { cn } from "~/lib/utils";

const LEVEL_COLORS = ["#EFEFEF", "#95ACFF", "#65EFAF", "#FAE37E", "#FFC052", "#F87D75", "#CAA0EF"];

/** Run Info overlay: hand levels (poker hands table), rules, vouchers, upcoming boss. */
export default function RunInfo({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"hands" | "rules" | "vouchers">("hands");
  return (
    <div className="flex h-[860px] w-[1200px] flex-col p-6">
      <div className="mb-4 flex justify-center gap-3">
        <TabButton isActive={tab === "hands"} onClick={() => setTab("hands")}>
          <Trans>Hands</Trans>
        </TabButton>
        <TabButton isActive={tab === "rules"} onClick={() => setTab("rules")}>
          <Trans>Rules</Trans>
        </TabButton>
        <TabButton isActive={tab === "vouchers"} onClick={() => setTab("vouchers")}>
          <Trans>Vouchers & Boss</Trans>
        </TabButton>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto pr-2">
        {tab === "hands" && <HandsTable />}
        {tab === "rules" && <Rules />}
        {tab === "vouchers" && <VouchersTab />}
      </div>
      <PixelButton tone="orange" size="md" className="mt-4 w-full" onClick={onClose}>
        <Trans>Back</Trans>
      </PixelButton>
    </div>
  );
}

function TabButton({ isActive, onClick, children }: { isActive: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <PixelButton tone={isActive ? "red" : "panel"} size="sm" className="px-8" onClick={onClick}>
      {children}
    </PixelButton>
  );
}

function HandsTable() {
  const run = useRun();
  const { l } = useSettings();
  return (
    <div className="flex flex-col gap-2">
      {[...HAND_TYPES].reverse().map((h) => {
        const level = run.handLevels[h.id] ?? 1;
        const plays = run.handPlays[h.id] ?? 0;
        if (h.isSecret && plays === 0) return null;
        const base = handBase(h.id, level);
        return (
          <div key={h.id} className="flex items-center gap-4 rounded-panel bg-inset px-4 py-2">
            <span
              className="w-[110px] rounded-lg py-1 text-center font-pixel text-2xl text-ink"
              style={{ backgroundColor: LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)] }}
            >
              lvl.{level}
            </span>
            <div className="flex-1">
              <div className="tx font-pixel text-[32px] leading-none text-white">{l(h.name)}</div>
              <div className="font-pixel text-xl text-white/60">{l(h.rule)}</div>
            </div>
            <span className="tx w-[110px] rounded-lg bg-blue py-1 text-center font-pixel text-3xl text-white">{base.chips}</span>
            <span className="tx font-pixel text-3xl text-red">×</span>
            <span className="tx w-[90px] rounded-lg bg-red py-1 text-center font-pixel text-3xl text-white">{base.mult}</span>
            <span className="tx w-[80px] text-right font-pixel text-2xl text-important">#{plays}</span>
          </div>
        );
      })}
    </div>
  );
}

function Rules() {
  const { locale } = useSettings();
  const lines =
    locale === "pl"
      ? [
          "Każda karta to prawdziwe zadanie maturalne. **Wartość karty = wynik zadania** (ukryty, dopóki nie zagrasz karty).",
          "Karta z [a:Σ] ma wartość równą **sumie wszystkich liczb** w odpowiedzi (np. rozwiązania równania, współrzędne punktu).",
          "Zagrane karty dodają swoje wartości do [c:Żetonów]. Ujemne wyniki odejmują! Jedna karta daje najwyżej ±50.",
          "Układ zależy od **kategorii** (Para, Trójka, Kareta...) i **działu** (Kolor = 5 kart z jednego działu).",
          "Wynik ręki = [c:Żetony] × [m:Mnożnik]. Zdobądź wymagany próg w dostępnych rękach.",
          "Kliknij kartę, aby otworzyć zadanie i liczyć na nim. Każda zagrywana karta wymaga Twojej odpowiedzi - błędna daje [x:0] Żetonów.",
          "Zaznaczanie kart: prawy przycisk myszy, przycisk [a:+] nad kartą lub klawisze 1-9. Enter = zagraj.",
          "Po każdym progu karty znikają - następna talia to nowe zadania. Karty kupione w sklepie trafiają na rękę w następnej rundzie.",
        ]
      : [
          "Every card is a real matura task. **A card's value = the task's answer** (hidden until you play it).",
          "A card with [a:Σ] is worth the **sum of all numbers** in the answer (e.g. all solutions, both coordinates).",
          "Played cards add their values to [c:Chips]. Negative answers subtract! One card gives at most ±50.",
          "Hand type depends on **categories** (Pair, Three, Four...) and **branches** (Flush = 5 cards of one branch).",
          "Hand score = [c:Chips] × [m:Mult]. Reach the blind's target within your hands.",
          "Click a card to open the task and work on it. Every card you play needs your answer - a wrong one scores [x:0] Chips.",
          "Select cards with right-click, the [a:+] tab above a card, or keys 1-9. Enter plays.",
          "After each blind the cards are gone - the next deck is new tasks. Cards bought in the shop are dealt first next round.",
        ];
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line) => (
        <div key={line} className="rounded-panel bg-white px-5 py-3 font-pixel text-[26px] leading-snug text-ink">
          <RichText text={line.replace(/\*\*([^*]+)\*\*/g, "[a:$1]")} />
        </div>
      ))}
    </div>
  );
}

function VouchersTab() {
  const run = useRun();
  const { l } = useSettings();
  const boss = BOSS_BY_ID[run.plan.boss.bossId];
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-panel bg-inset p-4">
        <div className="tx mb-2 font-pixel text-3xl text-important">
          <Trans>Ante {run.ante} Boss</Trans>
        </div>
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full font-pixel text-3xl" style={{ backgroundColor: boss.color }}>
            {boss.glyph}
          </span>
          <div>
            <div className="tx font-pixel text-3xl text-white">{l(boss.name)}</div>
            <div className="font-pixel text-2xl text-white/70">{l(boss.desc)}</div>
          </div>
        </div>
      </div>
      <div className="rounded-panel bg-inset p-4">
        <div className="tx mb-3 font-pixel text-3xl text-important">
          <Trans>Redeemed vouchers</Trans>
        </div>
        {run.vouchers.length === 0 && (
          <div className="font-pixel text-2xl text-white/50">
            <Trans>None yet</Trans>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {run.vouchers.map((id) => (
            <div key={id} className={cn("rounded-panel bg-white px-4 py-2 font-pixel text-2xl text-ink")}>
              <div className="text-voucher">{l(VOUCHER_BY_ID[id].name)}</div>
              <RichText text={l(VOUCHER_BY_ID[id].desc)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
