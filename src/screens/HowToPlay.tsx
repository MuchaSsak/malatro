import { Trans } from "@lingui/react/macro";
import { useState } from "react";

import PixelButton from "~/components/ui/PixelButton";
import RichText from "~/components/ui/RichText";
import { useSettings } from "~/contexts/SettingsContext";

const PAGES = {
  pl: [
    {
      title: "Karty to zadania",
      lines: [
        "Każda karta to prawdziwe zadanie maturalne (CKE).",
        "[a:Kliknij kartę], by je otworzyć. Możesz [a:rysować] po arkuszu.",
        "Wpisz [a:odpowiedź] (liczbę albo [a:A-D] w zadaniach zamkniętych).",
      ],
    },
    {
      title: "Punktacja",
      lines: [
        "Dobra odpowiedź: [c:Żetony] za trudność i punkty zadania oraz [m:+1] Mnożnika.",
        "Zła odpowiedź: [x:0], a karta nie liczy się do układu.",
        "Działy tworzą układy (Para, Kolor...). Wynik = [c:Żetony] × [m:Mnożnik].",
      ],
    },
    {
      title: "Sklep i bossowie",
      lines: [
        "Za wygrane kupujesz [a:Jokery], [a:Ściągi] i [a:Twierdzenia].",
        "Co 3 progi czeka [a:Boss] z utrudnieniem. Pokonaj 8 ante, by wygrać.",
      ],
    },
  ],
  en: [
    {
      title: "Cards are tasks",
      lines: [
        "Every card is a real matura (CKE) exam task.",
        "[a:Click a card] to open it. You can [a:draw] on the sheet.",
        "Type your [a:answer] (a number, or [a:A-D] on closed tasks).",
      ],
    },
    {
      title: "Scoring",
      lines: [
        "Right answer: [c:Chips] for the task's difficulty and points, plus [m:+1] Mult.",
        "Wrong answer: [x:0], and the card doesn't count toward the hand.",
        "Branches form hands (Pair, Flush...). Score = [c:Chips] × [m:Mult].",
      ],
    },
    {
      title: "Shop and bosses",
      lines: [
        "Winning buys [a:Jokers], [a:Cheat Sheets] and [a:Theorems].",
        "Every third blind is a [a:Boss] with a twist. Beat 8 antes to win.",
      ],
    },
  ],
};

export default function HowToPlay({ onClose }: { onClose: () => void }) {
  const { locale } = useSettings();
  const [page, setPage] = useState(0);
  const pages = PAGES[locale];
  const p = pages[page];
  return (
    <div className="flex w-[980px] flex-col gap-5 p-8">
      <div className="tx text-center font-pixel text-6xl text-white">{p.title}</div>
      <div className="flex flex-col gap-3">
        {p.lines.map((line) => (
          <div key={line} className="rounded-panel bg-white px-5 py-4 font-pixel text-[28px] leading-snug text-ink">
            <RichText text={line} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <PixelButton tone="panel" size="md" disabled={page === 0} onClick={() => setPage((x) => x - 1)}>
          ‹
        </PixelButton>
        <span className="tx font-pixel text-3xl text-white">
          {page + 1} / {pages.length}
        </span>
        {page < pages.length - 1 ? (
          <PixelButton tone="blue" size="md" onClick={() => setPage((x) => x + 1)}>
            ›
          </PixelButton>
        ) : (
          <PixelButton tone="blue" size="md" onClick={onClose}>
            <Trans>Let's go!</Trans>
          </PixelButton>
        )}
      </div>
    </div>
  );
}
