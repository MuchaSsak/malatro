import { useLingui } from "@lingui/react/macro";

import InfoPanel from "~/components/ui/InfoPanel";
import RichText from "~/components/ui/RichText";
import { useSettings } from "~/contexts/SettingsContext";
import { SCIAGA_BY_ID, TWIERDZENIE_BY_ID } from "~/lib/game/content/consumables";
import { JOKER_BY_ID, RARITY_COLOR, RARITY_NAME } from "~/lib/game/content/jokers";
import { TAG_BY_ID } from "~/lib/game/content/tags";
import { VOUCHER_BY_ID } from "~/lib/game/content/vouchers";
import { HAND_BY_ID, handBase } from "~/lib/game/hands";
import type { ConsumableInstance, JokerInstance, RunState } from "~/lib/game/types";

const EDITION_COLOR = { foil: "#8fb8de", holo: "#e36dbf", poly: "#9c6fe0", negative: "#374244" } as const;

export function JokerInfo({ joker, run }: { joker: JokerInstance; run: RunState | null }) {
  const { l } = useSettings();
  const { t } = useLingui();
  const def = JOKER_BY_ID[joker.id];
  if (!def) return null;
  const editionName = {
    foil: t`Foil: +50 Chips`,
    holo: t`Holographic: +10 Mult`,
    poly: t`Polychrome: x1.5 Mult`,
    negative: t`Negative: +1 Joker slot`,
  };
  return (
    <InfoPanel
      title={l(def.name)}
      pills={[
        { text: l(RARITY_NAME[def.rarity]), color: RARITY_COLOR[def.rarity] },
        ...(joker.edition ? [{ text: editionName[joker.edition], color: EDITION_COLOR[joker.edition] }] : []),
      ]}
    >
      <RichText text={l(def.desc)} vars={def.vars?.(joker, run)} />
    </InfoPanel>
  );
}

export function ConsumableInfo({ item, run }: { item: ConsumableInstance; run: RunState | null }) {
  const { l } = useSettings();
  const { t } = useLingui();
  if (item.kind === "twierdzenie") {
    const def = TWIERDZENIE_BY_ID[item.id];
    const hand = HAND_BY_ID[def.hand];
    const level = run?.handLevels[def.hand] ?? 1;
    const next = handBase(def.hand, level + 1);
    const handName = l(hand.name);
    return (
      <InfoPanel title={l(def.name)} pills={[{ text: t`Theorem`, color: "#13AFCE" }]}>
        <div className="text-important">
          {handName} (lvl.{level})
        </div>
        <RichText text={t`Level up: [c:+${hand.lvlChips}] Chips and [m:+${hand.lvlMult}] Mult`} />
        <div className="mt-1 text-ink/70">
          → {next.chips} × {next.mult}
        </div>
      </InfoPanel>
    );
  }
  const def = SCIAGA_BY_ID[item.id];
  return (
    <InfoPanel title={l(def.name)} pills={[{ text: t`Cheat Sheet`, color: "#A782D1" }]}>
      <RichText text={l(def.desc)} />
    </InfoPanel>
  );
}

export function VoucherInfo({ id }: { id: string }) {
  const { l } = useSettings();
  const { t } = useLingui();
  const def = VOUCHER_BY_ID[id];
  return (
    <InfoPanel title={l(def.name)} pills={[{ text: t`Voucher`, color: "#FD682B" }]}>
      <RichText text={l(def.desc)} />
    </InfoPanel>
  );
}

export function TagInfo({ id }: { id: string }) {
  const { l } = useSettings();
  const { t } = useLingui();
  const def = TAG_BY_ID[id];
  if (!def) return null;
  return (
    <InfoPanel title={l(def.name)} pills={[{ text: t`Tag`, color: "#646EB7" }]} width={280}>
      <RichText text={l(def.desc)} />
    </InfoPanel>
  );
}
