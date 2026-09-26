import { Trans, useLingui } from "@lingui/react/macro";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";

import { ConsumableInfo, JokerInfo, VoucherInfo } from "~/components/cards/cardInfo";
import ConsumableCard from "~/components/cards/ConsumableCard";
import JokerCard from "~/components/cards/JokerCard";
import PackCard from "~/components/cards/PackCard";
import TaskCard from "~/components/cards/TaskCard";
import TaskInfo from "~/components/cards/TaskInfo";
import Tilt from "~/components/cards/Tilt";
import VoucherCard from "~/components/cards/VoucherCard";
import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import { useViewer } from "~/contexts/ViewerContext";
import { SCIAGA_BY_ID } from "~/lib/game/content/consumables";
import { canAfford, canUseConsumable } from "~/lib/game/run";
import type { ShopItem } from "~/lib/game/types";
import { cn } from "~/lib/utils";

export default function Shop() {
  const { engine } = useGame();
  const run = useRun();
  const shop = run.shop;
  if (!shop) return null;
  const rerollLabel = shop.freeRerolls > 0 ? "$0" : `$${shop.rerollCost}`;
  return (
    <motion.div
      initial={{ y: 700 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 170, damping: 24 }}
      className="absolute bottom-0 left-[560px] h-[720px] w-[1080px] rounded-t-[20px] bg-panel p-5 shadow-hard"
      style={{ boxShadow: "inset 0 0 0 5px #FE5F55" }}
    >
      <div className="flex h-[330px] gap-5">
        <div className="flex w-[250px] flex-col gap-4">
          <PixelButton
            tone="red"
            size="lg"
            className="h-[140px] text-[44px] leading-[0.95]"
            onClick={() => engine.leaveShop()}
          >
            <span className="text-center">
              <Trans>Next Round</Trans>
            </span>
          </PixelButton>
          <PixelButton
            tone="green"
            size="lg"
            className="h-[140px] flex-col gap-1 text-[40px] leading-none"
            disabled={shop.freeRerolls === 0 && !canAfford(run, shop.rerollCost)}
            onClick={() => engine.reroll()}
          >
            <Trans>Reroll</Trans>
            <span className="text-[52px]">{rerollLabel}</span>
          </PixelButton>
        </div>
        <div className="flex flex-1 items-center justify-center gap-10 rounded-panel bg-inset-deep px-6">
          {shop.items.map((item) =>
            item.isSold ? <div key={item.uid} className="w-[168px]" /> : <ShopCard key={item.uid} item={item} />,
          )}
        </div>
      </div>
      <div className="mt-5 flex h-[330px] gap-5">
        <div className="relative flex w-[420px] items-center justify-center gap-6 rounded-panel bg-inset-deep">
          <span
            className="tx absolute left-3 top-1/2 -translate-y-1/2 font-pixel text-2xl text-white/25"
            style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
          >
            <Trans>ANTE {run.ante} VOUCHER</Trans>
          </span>
          {shop.vouchers.map((v) =>
            v.isSold ? null : (
              <PricedSlot
                key={v.id}
                price={v.price}
                info={<VoucherInfo id={v.id} />}
                actions={(close) => (
                  <PixelButton
                    tone="green"
                    size="sm"
                    disabled={!canAfford(run, v.price)}
                    onClick={() => {
                      engine.buyVoucher(v.id);
                      close();
                    }}
                  >
                    <Trans>Redeem</Trans>
                  </PixelButton>
                )}
              >
                <VoucherCard id={v.id} />
              </PricedSlot>
            ),
          )}
        </div>
        <div className="flex flex-1 items-center justify-center gap-12 rounded-panel bg-inset-deep">
          {shop.packs.map((p) =>
            p.isSold ? (
              <div key={p.uid} className="w-[128px]" />
            ) : (
              <PricedSlot
                key={p.uid}
                price={p.price}
                actions={(close) => (
                  <PixelButton
                    tone="green"
                    size="sm"
                    disabled={!canAfford(run, p.price)}
                    onClick={() => {
                      engine.buyPack(p.uid);
                      close();
                    }}
                  >
                    <Trans>Open</Trans>
                  </PixelButton>
                )}
              >
                <PackCard kind={p.kind} size={p.size} />
              </PricedSlot>
            ),
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ShopCard({ item }: { item: ShopItem }) {
  const { engine } = useGame();
  const run = useRun();
  const { open } = useViewer();
  const { t } = useLingui();
  const isAffordable = canAfford(run, item.price);
  if (item.type === "task") {
    const task = engine.getPool().byId.get(item.card.taskId)!;
    return (
      <PricedSlot
        price={item.price}
        info={<TaskInfo task={task} note={run.notes[task.id]} />}
        onOpen={() => open({ taskId: task.id, cardUid: item.uid, source: "shop", price: item.price })}
        actions={(close) => (
          <PixelButton
            tone="green"
            size="sm"
            disabled={!isAffordable}
            onClick={() => {
              engine.buyItem(item.uid);
              close();
            }}
          >
            <Trans>Buy</Trans>
          </PixelButton>
        )}
      >
        <TaskCard task={task} card={item.card} note={run.notes[task.id]} difficulty={run.difficulty} />
      </PricedSlot>
    );
  }
  if (item.type === "joker") {
    return (
      <PricedSlot
        price={item.price}
        info={<JokerInfo joker={item.joker} run={run} />}
        actions={(close) => (
          <PixelButton
            tone="green"
            size="sm"
            disabled={!isAffordable}
            onClick={() => {
              engine.buyItem(item.uid);
              close();
            }}
          >
            <Trans>Buy</Trans>
          </PixelButton>
        )}
      >
        <JokerCard joker={item.joker} />
      </PricedSlot>
    );
  }
  const def = item.item.kind === "sciaga" ? SCIAGA_BY_ID[item.item.id] : null;
  const canUseNow = item.item.kind === "twierdzenie" || (def?.target === null && !canUseConsumable(run, item.item));
  return (
    <PricedSlot
      price={item.price}
      info={<ConsumableInfo item={item.item} run={run} />}
      actions={(close) => (
        <div className="flex flex-col gap-2">
          <PixelButton
            tone="green"
            size="sm"
            disabled={!isAffordable}
            onClick={() => {
              engine.buyItem(item.uid);
              close();
            }}
          >
            <Trans>Buy</Trans>
          </PixelButton>
          {canUseNow && (
            <PixelButton
              tone="red"
              size="sm"
              disabled={!isAffordable}
              title={t`Buy and use immediately`}
              onClick={() => {
                engine.buyItem(item.uid, true);
                close();
              }}
            >
              <Trans>Buy & Use</Trans>
            </PixelButton>
          )}
        </div>
      )}
    >
      <ConsumableCard item={item.item} />
    </PricedSlot>
  );
}

type PricedSlotProps = {
  price: number;
  children: ReactNode;
  info?: ReactNode;
  actions: (close: () => void) => ReactNode;
  /** task cards open the viewer on click instead of toggling actions */
  onOpen?: () => void;
};

/** A for-sale item: dark price tab on top, hover info, click shows Buy buttons beside it. */
function PricedSlot({ price, children, info, actions, onOpen }: PricedSlotProps) {
  const [isActive, setIsActive] = useState(false);
  const [isHover, setIsHover] = useState(false);
  return (
    <div
      className="relative flex flex-col items-center"
      onPointerEnter={() => setIsHover(true)}
      onPointerLeave={() => setIsHover(false)}
    >
      <div className="tx mb-[-6px] rounded-t-[10px] bg-inset px-4 pb-2 pt-1 font-pixel text-[34px] leading-none text-money">
        ${price}
      </div>
      <button
        type="button"
        className={cn("block transition-transform", isActive && "-translate-y-2")}
        onClick={() => setIsActive((a) => !a)}
      >
        <Tilt>{children}</Tilt>
      </button>
      {onOpen && (
        <button
          type="button"
          className="tx mt-2 rounded-lg bg-panel-light px-3 py-1 font-pixel text-xl text-white shadow-hard-sm hover:bg-blue"
          onClick={onOpen}
        >
          <Trans>Open task</Trans>
        </button>
      )}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-full top-12 z-50 ml-3"
          >
            {actions(() => setIsActive(false))}
          </motion.div>
        )}
      </AnimatePresence>
      {isHover && info && !isActive && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-3 -translate-x-1/2">{info}</div>
      )}
    </div>
  );
}
