import CardBack from "~/components/cards/CardBack";
import { TagInfo } from "~/components/cards/cardInfo";
import PixelArt from "~/components/ui/PixelArt";
import { useRun } from "~/contexts/GameContext";
import { DECK_SIZE } from "~/lib/game/constants";
import { TAG_BY_ID } from "~/lib/game/content/tags";

type DeckPileProps = { onClick: () => void };

/** Bottom-right deck (stacked for thickness) + pending tags. */
export default function DeckPile({ onClick }: DeckPileProps) {
  const run = useRun();
  const count = run.round ? run.round.deck.length : DECK_SIZE;
  const layers = Math.max(1, Math.min(5, Math.ceil(count / 9)));
  return (
    <div className="absolute bottom-[28px] right-[24px] flex flex-col items-center">
      <div className="mb-3 flex flex-col-reverse gap-2 self-start">
        {run.tags.map((id, i) => (
          <div key={`${id}-${i}`} className="group relative">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-booster shadow-hard-sm">
              <PixelArt glyph={TAG_BY_ID[id]?.art ?? "?"} size={30} res={16} />
            </div>
            <div className="pointer-events-none absolute bottom-0 right-14 z-50 hidden group-hover:block">
              <TagInfo id={id} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onClick} className="relative h-[225px] w-[168px]">
        {Array.from({ length: layers }).map((_, i) => (
          <div key={i} className="absolute inset-0" style={{ transform: `translate(${-i * 3}px, ${-i * 3}px)` }}>
            <CardBack difficulty={run.difficulty} className="shadow-hard-sm" />
          </div>
        ))}
      </button>
      <span className="tx mt-2 font-pixel text-3xl text-white">
        {count}/{DECK_SIZE}
      </span>
    </div>
  );
}
