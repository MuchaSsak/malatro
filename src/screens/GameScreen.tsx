import { Trans, useLingui } from "@lingui/react/macro";
import { motion, useAnimate } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import BlindSelect from "~/components/game/BlindSelect";
import CashOut from "~/components/game/CashOut";
import CheatPanel from "~/components/game/CheatPanel";
import ConsumableTray from "~/components/game/ConsumableTray";
import DeckPile from "~/components/game/DeckPile";
import DeckView from "~/components/game/DeckView";
import GameOver from "~/components/game/GameOver";
import HandArea, { PlayArea } from "~/components/game/HandArea";
import JokerTray from "~/components/game/JokerTray";
import OptionsPanel from "~/components/game/OptionsPanel";
import PackOpen from "~/components/game/PackOpen";
import RoundControls from "~/components/game/RoundControls";
import RunInfo from "~/components/game/RunInfo";
import Shop from "~/components/game/Shop";
import Sidebar from "~/components/game/Sidebar";
import Modal from "~/components/ui/Modal";
import PixelButton from "~/components/ui/PixelButton";
import { useGame, useRun } from "~/contexts/GameContext";
import PlaybackProvider, { usePlayback } from "~/contexts/PlaybackContext";
import { useSettings } from "~/contexts/SettingsContext";
import { useViewer } from "~/contexts/ViewerContext";
import { audio } from "~/lib/audio";
import { onCheatPrompt } from "~/lib/cheats";
import { emitJiggle, emitPopup } from "~/lib/fx";
import { HAND_BY_ID } from "~/lib/game/hands";

type GameScreenProps = { onMainMenu: () => void; onNewRun: () => void };

export default function GameScreen(props: GameScreenProps) {
  return (
    <PlaybackProvider>
      <GameTable {...props} />
    </PlaybackProvider>
  );
}

function GameTable({ onMainMenu, onNewRun }: GameScreenProps) {
  const { engine } = useGame();
  const run = useRun();
  const { l, settings, update } = useSettings();
  const { t } = useLingui();
  const pb = usePlayback();
  const { target: viewerTarget } = useViewer();
  const [modal, setModal] = useState<"info" | "options" | "deck" | "cheats" | null>(null);

  // ten quick pokes on a blind chip offer the testing cheats
  useEffect(() => onCheatPrompt(() => !settings.isCheats && setModal("cheats")), [settings.isCheats]);
  const [scope, animate] = useAnimate();

  // engine side effects -> toasts, sounds, juice
  useEffect(() => {
    return engine.onFx((fx) => {
      if (fx.kind === "toast") {
        const text = l(fx.text);
        if (fx.tone === "bad") toast.error(text);
        else toast(text);
      } else if (fx.kind === "sound") {
        const map: Record<string, Parameters<typeof audio.play>[0]> = {
          deal: "shuffle",
          discard: "discard",
          win: "win",
          shop: "shop",
          buy: "coin",
          sell: "coins",
          pack: "pack",
          pick: "pick",
          tarot: "levelup",
          skip: "confirm",
          click: "click",
          error: "error",
        };
        if (map[fx.name]) audio.play(map[fx.name]);
      } else if (fx.kind === "joker") {
        emitJiggle(fx.jokerUid, 1);
        emitPopup(fx.jokerUid, l(fx.text), "text");
      } else if (fx.kind === "levelup") {
        audio.play("levelup");
        toast.success(t`${l(HAND_BY_ID[fx.hand].name)} leveled up to lvl.${fx.level}`);
      } else if (fx.kind === "money") {
        emitJiggle("sidebar-money", 1);
      }
    });
  }, [engine, l, t]);

  // Escape opens options (pause menu); while a modal or the task viewer is open, they own Escape
  useEffect(() => {
    if (modal || viewerTarget) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.repeat) return;
      audio.play("click");
      setModal("options");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modal, viewerTarget]);

  // screen shake on big hands
  useEffect(() => {
    if (!pb.shake || !scope.current) return;
    void animate(
      scope.current,
      { x: [0, -8, 7, -5, 3, 0], y: [0, 4, -5, 3, -1, 0], rotate: [0, -0.4, 0.3, 0] },
      { duration: 0.35 },
    );
  }, [pb.shake, animate, scope]);

  const phase = run.phase;
  return (
    <motion.div ref={scope} className="absolute inset-0">
      <Sidebar onRunInfo={() => setModal("info")} onOptions={() => setModal("options")} />
      <JokerTray />
      <ConsumableTray />
      {phase === "blind-select" && <BlindSelect />}
      {phase === "round" && run.round && (
        <>
          <PlayArea />
          <HandArea />
          <RoundControls />
        </>
      )}
      {phase === "cashout" && <CashOut />}
      {phase === "shop" && <Shop />}
      {phase === "pack" && <PackOpen />}
      <DeckPile onClick={() => setModal("deck")} />
      {settings.isCheats && <CheatPanel />}
      {(phase === "gameover" || phase === "won") && (
        <>
          <div
            className="absolute inset-0 z-[140]"
            style={{ background: phase === "won" ? "rgba(0,60,120,.35)" : "rgba(232,84,80,.35)" }}
          />
          <GameOver onNewRun={onNewRun} onMainMenu={onMainMenu} />
        </>
      )}
      {/* the prompt pops mid-tapping, so stray clicks outside must not dismiss it */}
      <Modal isOpen={modal === "cheats"} onClose={() => setModal(null)} isScrimClosable={false}>
        <div className="flex w-[640px] flex-col gap-5 p-7 text-center">
          <div className="tx font-pixel text-5xl text-money">
            <Trans>Activate cheats?</Trans>
          </div>
          <div className="font-pixel text-2xl leading-snug text-white/85">
            <Trans>
              A testing panel appears on the table (money, mult, win the blind). Runs where you use it are not saved to
              the leaderboard.
            </Trans>
          </div>
          <div className="flex gap-3">
            <PixelButton tone="panel" size="md" className="flex-1" onClick={() => setModal(null)}>
              <Trans>No</Trans>
            </PixelButton>
            <PixelButton
              tone="red"
              size="md"
              className="flex-1"
              onClick={() => {
                update({ isCheats: true });
                setModal(null);
              }}
            >
              <Trans>Activate</Trans>
            </PixelButton>
          </div>
        </div>
      </Modal>
      <Modal isOpen={modal === "info"} onClose={() => setModal(null)}>
        <RunInfo onClose={() => setModal(null)} />
      </Modal>
      <Modal isOpen={modal === "deck"} onClose={() => setModal(null)}>
        <DeckView onClose={() => setModal(null)} />
      </Modal>
      <Modal isOpen={modal === "options"} onClose={() => setModal(null)}>
        <OptionsPanel
          onClose={() => setModal(null)}
          onMainMenu={() => {
            setModal(null);
            onMainMenu();
          }}
          onAbandon={() => {
            if (window.confirm(t`Abandon this run? Progress will be lost.`)) {
              setModal(null);
              engine.abandonRun();
              onMainMenu();
            }
          }}
        />
      </Modal>
    </motion.div>
  );
}
