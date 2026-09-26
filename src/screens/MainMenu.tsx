import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";

import CardBack from "~/components/cards/CardBack";
import OptionsPanel from "~/components/game/OptionsPanel";
import Logo from "~/components/layout/Logo";
import FullscreenIcon from "~/components/ui/FullscreenIcon";
import Modal from "~/components/ui/Modal";
import PixelButton from "~/components/ui/PixelButton";
import { useAuth } from "~/contexts/AuthContext";
import { useGame } from "~/contexts/GameContext";
import { useSettings } from "~/contexts/SettingsContext";
import useSignOut from "~/hooks/auth/useSignOut";
import useGetLeaderboard from "~/hooks/runs/useGetLeaderboard";
import { audio } from "~/lib/audio";
import { DIFFICULTIES } from "~/lib/game/constants";
import { eligible } from "~/lib/game/deck";
import { randomSeed } from "~/lib/game/rng";
import type { DifficultyMode } from "~/lib/game/types";
import { cn, formatNumber } from "~/lib/utils";
import HowToPlay from "~/screens/HowToPlay";

type MainMenuProps = { onPlay: () => void };

export default function MainMenu({ onPlay }: MainMenuProps) {
  const { run } = useGame();
  const { displayName, session, setGuest } = useAuth();
  const { settings, update, isFullscreen, toggleFullscreen } = useSettings();
  const signOut = useSignOut();
  const [modal, setModal] = useState<"play" | "options" | "leaderboard" | "howto" | null>(() =>
    settings.hasSeenTutorial ? null : "howto",
  );

  return (
    <div className="absolute inset-0" onPointerDown={() => audio.unlock()}>
      <div className="absolute inset-x-0 top-[170px]">
        <Logo size={210} />
        <div className="tx mt-8 text-center font-pixel text-4xl text-white/85">
          <Trans>A matura roguelike deckbuilder</Trans>
        </div>
      </div>
      <div className="absolute bottom-[70px] left-1/2 flex -translate-x-1/2 gap-4 rounded-[22px] bg-panel-light/90 p-4 shadow-hard">
        <PixelButton tone="blue" size="xl" className="w-[360px]" onClick={() => setModal("play")}>
          <Trans>PLAY</Trans>
        </PixelButton>
        <PixelButton tone="orange" size="xl" className="w-[260px] text-5xl" onClick={() => setModal("options")}>
          <Trans>OPTIONS</Trans>
        </PixelButton>
        <PixelButton tone="green" size="xl" className="w-[300px] text-5xl" onClick={() => setModal("leaderboard")}>
          <Trans>RANKING</Trans>
        </PixelButton>
        <PixelButton tone="purple" size="xl" className="w-[260px] text-5xl" onClick={() => setModal("howto")}>
          <Trans>HOW TO</Trans>
        </PixelButton>
      </div>
      <div className="absolute bottom-[70px] left-[40px] flex items-center gap-3 rounded-panel bg-panel/90 px-5 py-3 shadow-hard">
        <span className="tx font-pixel text-3xl text-white">{displayName ?? <Trans>Guest</Trans>}</span>
        <PixelButton
          tone="red"
          size="sm"
          onClick={() => {
            if (session) signOut.mutate();
            setGuest(false);
          }}
        >
          {session ? <Trans>Log out</Trans> : <Trans>Log in</Trans>}
        </PixelButton>
      </div>
      <div className="absolute bottom-[70px] right-[40px] flex gap-2">
        <PixelButton size="md" tone="panel" className="px-4" onClick={toggleFullscreen} aria-label="Fullscreen">
          <FullscreenIcon isIn={isFullscreen} />
        </PixelButton>
        {(["pl", "en"] as const).map((loc) => (
          <PixelButton
            key={loc}
            size="md"
            tone={settings.locale === loc ? "red" : "panel"}
            onClick={() => update({ locale: loc })}
          >
            {loc.toUpperCase()}
          </PixelButton>
        ))}
      </div>
      <Modal isOpen={modal === "play"} onClose={() => setModal(null)}>
        <NewRunPanel
          hasRun={!!run && run.phase !== "gameover" && run.phase !== "won"}
          onContinue={() => {
            setModal(null);
            onPlay();
          }}
          onStart={() => {
            setModal(null);
            onPlay();
          }}
          onClose={() => setModal(null)}
        />
      </Modal>
      <Modal isOpen={modal === "options"} onClose={() => setModal(null)}>
        <OptionsPanel onClose={() => setModal(null)} />
      </Modal>
      <Modal isOpen={modal === "leaderboard"} onClose={() => setModal(null)}>
        <Leaderboard onClose={() => setModal(null)} />
      </Modal>
      <Modal
        isOpen={modal === "howto"}
        onClose={() => {
          update({ hasSeenTutorial: true });
          setModal(null);
        }}
      >
        <HowToPlay
          onClose={() => {
            update({ hasSeenTutorial: true });
            setModal(null);
          }}
        />
      </Modal>
    </div>
  );
}

function NewRunPanel({
  hasRun,
  onContinue,
  onStart,
  onClose,
}: {
  hasRun: boolean;
  onContinue: () => void;
  onStart: () => void;
  onClose: () => void;
}) {
  const { engine, pool, run } = useGame();
  const { l, locale, update } = useSettings();
  const { t } = useLingui();
  const [tab, setTab] = useState<"new" | "continue">(hasRun ? "continue" : "new");
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState("");
  const diff = DIFFICULTIES[index];
  const poolSize = eligible(pool, diff.id).length;
  const move = (d: number) => setIndex((i) => (i + d + DIFFICULTIES.length) % DIFFICULTIES.length);

  return (
    <div className="flex w-[1000px] flex-col gap-5 p-7">
      <div className="flex justify-center gap-3">
        <PixelButton tone={tab === "new" ? "red" : "panel"} size="md" onClick={() => setTab("new")}>
          <Trans>New Run</Trans>
        </PixelButton>
        <PixelButton
          tone={tab === "continue" ? "red" : "panel"}
          size="md"
          disabled={!hasRun}
          onClick={() => setTab("continue")}
        >
          <Trans>Continue</Trans>
        </PixelButton>
      </div>
      {tab === "new" ? (
        <>
          <div className="flex items-center justify-center gap-8">
            <PixelButton tone="red" size="lg" className="w-[90px]" onClick={() => move(-1)}>
              ‹
            </PixelButton>
            <div className="flex w-[640px] items-center gap-8 rounded-panel bg-inset p-6">
              <div className="h-[225px] w-[168px] shrink-0 animate-bob">
                <CardBack difficulty={diff.id} className="shadow-hard" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="tx font-pixel text-[64px] leading-none" style={{ color: diff.tone }}>
                  {diff.name}
                </div>
                <div className="rounded-lg bg-white px-4 py-3 font-pixel text-[26px] leading-snug text-ink">
                  {l(diff.desc)}
                </div>
                <div className="tx font-pixel text-2xl text-white/70">
                  <Trans>{formatNumber(poolSize)} tasks in this deck</Trans>
                </div>
              </div>
            </div>
            <PixelButton tone="red" size="lg" className="w-[90px]" onClick={() => move(1)}>
              ›
            </PixelButton>
          </div>
          <div className="flex justify-center gap-2">
            {DIFFICULTIES.map((d, i) => (
              <span key={d.id} className={cn("h-3 w-10 rounded", i === index ? "bg-white" : "bg-white/25")} />
            ))}
          </div>
          {/* the whole run is in one language: Polish shows the CKE sheets, English the translations */}
          <div className="flex items-center justify-center gap-3">
            <span className="tx font-pixel text-2xl text-white/80">
              <Trans>Language</Trans>
            </span>
            {(["pl", "en"] as const).map((loc) => (
              <PixelButton
                key={loc}
                size="sm"
                tone={locale === loc ? "red" : "panel"}
                className="w-[150px]"
                onClick={() => update({ locale: loc })}
              >
                {loc === "pl" ? "Polski" : "English"}
              </PixelButton>
            ))}
          </div>
          <label className="flex items-center justify-center gap-3">
            <span className="tx font-pixel text-2xl text-white/80">
              <Trans>Seed (optional)</Trans>
            </span>
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value.toUpperCase().slice(0, 10))}
              placeholder={t`random`}
              className="w-[220px] rounded-lg border-4 border-panel-light bg-inset px-3 py-1 font-pixel text-3xl text-white outline-none placeholder:text-white/25"
            />
          </label>
          <PixelButton
            tone="blue"
            size="xl"
            disabled={poolSize < 50}
            onClick={() => {
              if (hasRun && !window.confirm(t`Start a new run? The current run will be lost.`)) return;
              engine.newRun(diff.id as DifficultyMode, seed || randomSeed());
              audio.play("shuffle");
              onStart();
            }}
          >
            <Trans>PLAY</Trans>
          </PixelButton>
        </>
      ) : (
        run && (
          <div className="flex flex-col items-center gap-4 rounded-panel bg-inset p-6">
            <div
              className="tx font-pixel text-5xl"
              style={{ color: DIFFICULTIES.find((d) => d.id === run.difficulty)?.tone }}
            >
              {DIFFICULTIES.find((d) => d.id === run.difficulty)?.name}
            </div>
            <div className="tx font-pixel text-3xl text-white">
              <Trans>
                Ante {run.ante} · ${run.money} · {run.jokers.length} Jokers
              </Trans>
            </div>
            <PixelButton tone="blue" size="xl" className="w-[420px]" onClick={onContinue}>
              <Trans>Continue</Trans>
            </PixelButton>
          </div>
        )
      )}
      <PixelButton tone="orange" size="md" onClick={onClose}>
        <Trans>Back</Trans>
      </PixelButton>
    </div>
  );
}

function Leaderboard({ onClose }: { onClose: () => void }) {
  const { isOnlineAvailable } = useAuth();
  const [mode, setMode] = useState<DifficultyMode>("trywialne");
  const query = useGetLeaderboard(mode);
  return (
    <div className="flex h-[820px] w-[1100px] flex-col gap-4 p-7">
      <div className="tx text-center font-pixel text-6xl text-white">
        <Trans>Leaderboard</Trans>
      </div>
      <div className="flex justify-center gap-3">
        {DIFFICULTIES.map((d) => (
          <PixelButton key={d.id} tone={mode === d.id ? "red" : "panel"} size="md" onClick={() => setMode(d.id)}>
            {d.name}
          </PixelButton>
        ))}
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto rounded-panel bg-inset p-3">
        {!isOnlineAvailable ? (
          <div className="p-8 text-center font-pixel text-3xl text-white/60">
            <Trans>Leaderboard needs Supabase (see README).</Trans>
          </div>
        ) : query.isPending ? (
          <div className="p-8 text-center font-pixel text-3xl text-white/60">
            <Trans>Loading...</Trans>
          </div>
        ) : query.isError ? (
          <div className="p-8 text-center font-pixel text-3xl text-red">{query.error.message}</div>
        ) : query.data.length === 0 ? (
          <div className="p-8 text-center font-pixel text-3xl text-white/60">
            <Trans>No runs yet. Be the first!</Trans>
          </div>
        ) : (
          <table className="w-full font-pixel text-3xl text-white">
            <thead>
              <tr className="text-2xl text-white/60">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">
                  <Trans>Player</Trans>
                </th>
                <th className="p-2">
                  <Trans>Ante</Trans>
                </th>
                <th className="p-2 text-right">
                  <Trans>Score</Trans>
                </th>
                <th className="p-2 text-right">
                  <Trans>Best hand</Trans>
                </th>
                <th className="p-2 text-right">✓</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((row, i) => (
                <tr key={row.slug} className={cn("border-t-2 border-white/10", row.is_me && "bg-blue/25")}>
                  <td className="p-2 text-important">{i + 1}</td>
                  <td className="p-2">{row.slug}</td>
                  <td className="p-2 text-center">
                    {row.ante}
                    {row.is_won && <span className="ml-1 text-money">★</span>}
                  </td>
                  <td className="p-2 text-right text-blue">{formatNumber(row.total_score)}</td>
                  <td className="p-2 text-right text-red">{formatNumber(row.best_hand)}</td>
                  <td className="p-2 text-right text-green">{row.correct_notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PixelButton tone="orange" size="md" onClick={onClose}>
        <Trans>Back</Trans>
      </PixelButton>
    </div>
  );
}
