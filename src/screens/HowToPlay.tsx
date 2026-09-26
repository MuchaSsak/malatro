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
        "Każda karta to prawdziwe zadanie z matury (CKE). Na karcie widzisz [a:kategorię], dział i skrót zadania.",
        "[a:Wartość karty = wynik zadania.] Jest ukryta - musisz rozwiązać zadanie, żeby ją znać!",
        "Karta z [a:Σ] jest warta [a:sumę wszystkich liczb] w odpowiedzi (np. oba rozwiązania równania).",
      ],
    },
    {
      title: "Otwórz i licz",
      lines: [
        "[a:Kliknij kartę], by otworzyć oryginalne zadanie z arkusza. Możesz po nim [a:rysować] - rysunki zostają.",
        "Zanim zagrasz kartę, wpisz jej [a:odpowiedź]. Dobra odpowiedź = karta punktuje. Zła = [x:0] Żetonów i karta nie liczy się do układu.",
        "Zaznacz kartę do zagrania: [a:prawy przycisk myszy], przycisk [a:+] nad kartą lub klawisze [a:1-9].",
      ],
    },
    {
      title: "Punktacja",
      lines: [
        "Zagraj do 5 kart. Wszystkie zagrane karty dodają swoją wartość do [c:Żetonów] - [a:ujemne odejmują!]",
        "Układ z kategorii i działów daje bazowe [c:Żetony] i [m:Mnożnik]: Para, Trójka, Kolor (5 z jednego działu), Przekrój (5 kategorii, wszystkie 4 działy)...",
        "Wynik = [c:Żetony] × [m:Mnożnik]. Pokonaj próg punktowy, zanim skończą się ręce.",
      ],
    },
    {
      title: "Sklep i bossowie",
      lines: [
        "Za wygrane dostajesz [$:$]. Kupuj [a:Jokery], [a:Ściągi] (np. ujawniają znak lub wartość karty) i [a:Twierdzenia] (podnoszą poziom układów).",
        "Zadania ze sklepu trafią na rękę w następnej rundzie - kup to, co umiesz rozwiązać!",
        "Co 3 progi czeka [a:Boss] z utrudnieniem, np. [a:Lustro] zmienia znak wszystkich wartości. Pokonaj 8 ant, by wygrać.",
      ],
    },
  ],
  en: [
    {
      title: "Cards are tasks",
      lines: [
        "Every card is a real matura (CKE) exam task. The card shows its [a:category], branch and a short summary.",
        "[a:A card's value = the task's answer.] It's hidden - solve the task to know it!",
        "A card with [a:Σ] is worth the [a:sum of all numbers] in the answer (e.g. both solutions).",
      ],
    },
    {
      title: "Open and solve",
      lines: [
        "[a:Click a card] to open the original task from the exam sheet. You can [a:draw] on it - drawings persist.",
        "Before you play a card, type its [a:answer]. Right answer = the card scores. Wrong = [x:0] Chips and it doesn't count toward the hand.",
        "Select a card to play: [a:right-click], the [a:+] tab above it, or keys [a:1-9].",
      ],
    },
    {
      title: "Scoring",
      lines: [
        "Play up to 5 cards. Every played card adds its value to [c:Chips] - [a:negative ones subtract!]",
        "Categories and branches form hands with base [c:Chips] and [m:Mult]: Pair, Three, Flush (5 of one branch), Cross-section (5 categories, all 4 branches)...",
        "Score = [c:Chips] × [m:Mult]. Beat the blind before you run out of hands.",
      ],
    },
    {
      title: "Shop and bosses",
      lines: [
        "Winning earns [$:$]. Buy [a:Jokers], [a:Cheat Sheets] (e.g. reveal a card's sign or value) and [a:Theorems] (level up hands).",
        "Tasks bought in the shop are dealt first next round - buy what you can solve!",
        "Every third blind is a [a:Boss] with a twist, e.g. [a:The Mirror] negates all values. Beat 8 antes to win.",
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
