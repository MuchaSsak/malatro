import { useLingui } from "@lingui/react/macro";

import PixelArt from "~/components/ui/PixelArt";
import { VOUCHER_BY_ID } from "~/lib/game/content/vouchers";
import { cn } from "~/lib/utils";

/** Ticket-shaped voucher with notched sides and a shimmering face. */
export default function VoucherCard({ id, className }: { id: string; className?: string }) {
  const { t } = useLingui();
  const def = VOUCHER_BY_ID[id];
  return (
    <div className={cn("relative h-[190px] w-[140px]", className)}>
      <div
        className="absolute inset-0 overflow-hidden rounded-[10px] border-[3px] border-[#e8e8ff] shadow-card"
        style={{
          background: "linear-gradient(160deg, #6f7df0, #3b36b8 60%, #28207a)",
          maskImage:
            "radial-gradient(circle at 0 50%, transparent 12px, black 13px), radial-gradient(circle at 100% 50%, transparent 12px, black 13px)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        <div className="tx absolute inset-x-0 top-2 text-center font-pixel text-2xl leading-none text-white">{t`VOUCHER`}</div>
        <div className="absolute inset-x-5 top-10 grid h-[110px] place-items-center rounded-lg border-2 border-white/40 bg-white/10">
          <PixelArt glyph={def?.art ?? "?"} size={72} res={24} color="#fff" />
        </div>
        <div className="sheen pointer-events-none absolute inset-0 opacity-40" />
      </div>
    </div>
  );
}
