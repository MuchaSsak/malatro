import { Trans } from "@lingui/react/macro";
import { Suspense, useEffect, useState } from "react";
import { Toaster } from "sonner";

import BalatroBackground, { bossPalette, PALETTES, type SwirlPalette } from "~/components/layout/BalatroBackground";
import Stage from "~/components/layout/Stage";
import { useAuth } from "~/contexts/AuthContext";
import GameProvider, { useGame } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import ViewerProvider, { useViewer } from "~/contexts/ViewerContext";
import { audio } from "~/lib/audio";
import { BOSS_BY_ID } from "~/lib/game/content/bosses";
import { GRAPHICS } from "~/lib/graphics";
import AuthScreen from "~/screens/AuthScreen";
import { GameScreen, preloadOnIdle, TaskViewer } from "~/screens/lazy";
import MainMenu from "~/screens/MainMenu";

export default function App() {
  return (
    <div className="crt relative h-full w-full overflow-hidden">
      <GameProvider fallback={<Loading />}>
        <ViewerProvider>
          <Router />
          <LazyTaskViewer />
        </ViewerProvider>
      </GameProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "!font-pixel !text-2xl !rounded-xl !border-4 !border-outline !bg-panel !text-white !shadow-hard",
        }}
      />
    </div>
  );
}

function Loading() {
  const { settings } = useSettings();
  return (
    <>
      <BalatroBackground palette={PALETTES.menu} profile={GRAPHICS[settings.graphics]} />
      <div className="tx absolute inset-0 grid place-items-center font-pixel text-6xl text-white">
        <Trans>Shuffling the exam sheets...</Trans>
      </div>
    </>
  );
}

function Router() {
  const { session, isGuest, isLoading } = useAuth();
  const { run } = useGame();
  const { settings } = useSettings();
  const { target } = useViewer();
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const isAuthed = !!session || isGuest;
  const activeScreen = isAuthed ? (screen === "game" && run ? "game" : "menu") : "auth";

  useEffect(() => preloadOnIdle(), []);

  useEffect(() => {
    audio.playMusic(activeScreen === "game" && (run?.phase === "shop" || run?.phase === "pack") ? "shop" : "main");
  }, [activeScreen, run?.phase]);

  const palette = backgroundFor(activeScreen, run);
  return (
    <>
      <BalatroBackground
        palette={palette}
        isPaused={settings.isReducedMotion}
        profile={GRAPHICS[settings.graphics]}
        isCovered={!!target}
      />
      {isLoading ? null : (
        <Stage>
          {activeScreen === "auth" && <AuthScreen />}
          {activeScreen === "menu" && <MainMenu onPlay={() => setScreen("game")} />}
          {activeScreen === "game" && (
            <Suspense fallback={null}>
              <GameScreen onMainMenu={() => setScreen("menu")} onNewRun={() => setScreen("menu")} />
            </Suspense>
          )}
        </Stage>
      )}
    </>
  );
}

/** Mounts the viewer the first time a task is opened, then keeps it for its exit animations. */
function LazyTaskViewer() {
  const { target } = useViewer();
  const [isNeeded, setIsNeeded] = useState(false);
  if (target && !isNeeded) setIsNeeded(true);
  if (!isNeeded) return null;
  return (
    <Suspense fallback={null}>
      <TaskViewer />
    </Suspense>
  );
}

function backgroundFor(screen: string, run: ReturnType<typeof useGame>["run"]): SwirlPalette {
  if (screen !== "game" || !run) return PALETTES.menu;
  switch (run.phase) {
    case "gameover":
      return PALETTES.gameover;
    case "won":
      return PALETTES.won;
    case "shop":
      return PALETTES.shop;
    case "pack":
      return run.pack ? PALETTES[run.pack.kind] : PALETTES.shop;
    case "round":
    case "cashout":
      if (run.round?.bossId) return bossPalette(BOSS_BY_ID[run.round.bossId]?.color ?? "#b44430");
      return PALETTES.blind;
    default:
      return PALETTES.blind;
  }
}
