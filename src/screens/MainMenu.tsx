import { Trans, useLingui } from "@lingui/react/macro";
import { AnimatePresence, motion } from "motion/react";
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
import { useViewer } from "~/contexts/ViewerContext";
import useSignOut from "~/hooks/auth/useSignOut";
import useGetLeaderboard from "~/hooks/runs/useGetLeaderboard";
import useGetMyStats from "~/hooks/runs/useGetMyStats";
import useSubmitSuggestion from "~/hooks/suggestions/useSubmitSuggestion";
import { audio } from "~/lib/audio";
import { DIFFICULTIES } from "~/lib/game/constants";
import { eligible, encodeTaskSet } from "~/lib/game/deck";
import { randomSeed } from "~/lib/game/rng";
import type { DifficultyMode } from "~/lib/game/types";
import { encounteredIds } from "~/lib/progress";
import { cn, formatDuration, formatNumber } from "~/lib/utils";
import Collection from "~/screens/Collection";
import HowToPlay from "~/screens/HowToPlay";

type MainMenuProps = { onPlay: () => void };

export default function MainMenu({ onPlay }: MainMenuProps) {
  const { run } = useGame();
  const { displayName, session, setGuest } = useAuth();
  const { settings, update, isFullscreen, toggleFullscreen } = useSettings();
  const signOut = useSignOut();
  const myStats = useGetMyStats(session?.user.id);
  const playTime = myStats.data ? formatDuration(myStats.data.total_play_time_ms) : null;
  const { target: viewerTarget } = useViewer();
  const [isTrywialne, setIsTrywialne] = useState(false);
  const [modal, setModal] = useState<"play" | "options" | "leaderboard" | "howto" | "collection" | "suggest" | null>(
    () => (settings.hasSeenTutorial ? null : "howto"),
  );

  return (
    <div className="absolute inset-0" onPointerDown={() => audio.unlock()}>
      <div className="absolute inset-x-0 top-[170px]">
        <Logo
          size={210}
          onCardClick={() => {
            audio.play("levelup");
            setIsTrywialne(true);
          }}
        />
        <div className="tx mt-8 text-center font-pixel text-4xl text-white/85">
          <Trans>A matura roguelike deckbuilder</Trans>
        </div>
      </div>
      <div className="absolute bottom-[70px] left-1/2 flex -translate-x-1/2 gap-4 rounded-[22px] bg-panel-light/90 p-4 shadow-hard">
        <PixelButton tone="blue" size="xl" className="w-[320px]" onClick={() => setModal("play")}>
          <Trans>PLAY</Trans>
        </PixelButton>
        <PixelButton tone="orange" size="xl" className="w-[250px] px-6 text-5xl" onClick={() => setModal("options")}>
          <Trans>OPTIONS</Trans>
        </PixelButton>
        <PixelButton tone="money" size="xl" className="w-[300px] px-6 text-5xl" onClick={() => setModal("collection")}>
          <Trans>COLLECTION</Trans>
        </PixelButton>
        <PixelButton tone="green" size="xl" className="w-[250px] px-6 text-5xl" onClick={() => setModal("leaderboard")}>
          <Trans>RANKING</Trans>
        </PixelButton>
        <PixelButton tone="purple" size="xl" className="w-[230px] px-6 text-5xl" onClick={() => setModal("howto")}>
          <Trans>HOW TO</Trans>
        </PixelButton>
      </div>
      <div className="absolute bottom-[70px] left-[40px] flex items-center gap-3 rounded-panel bg-panel/90 px-5 py-3 shadow-hard">
        <div className="flex flex-col">
          <span className="tx font-pixel text-3xl text-white">{displayName ?? <Trans>Guest</Trans>}</span>
          {playTime && (
            <span className="tx font-pixel text-xl text-white/70">
              <Trans>Played {playTime}</Trans>
            </span>
          )}
        </div>
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
      <div className="absolute right-[40px] top-[36px] flex items-center gap-3">
        <PixelButton tone="panel" size="sm" onClick={() => setModal("suggest")}>
          <Trans>Suggest an update</Trans>
        </PixelButton>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          title="GitHub"
          className="grid h-12 w-12 place-items-center rounded-panel bg-panel-light text-white shadow-hard hover:brightness-110 active:translate-y-[4px] active:shadow-hard-sm"
        >
          <GithubIcon />
        </a>
      </div>
      <AnimatePresence>{isTrywialne && <TrywialneEgg onClose={() => setIsTrywialne(false)} />}</AnimatePresence>
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
      <Modal isOpen={modal === "suggest"} onClose={() => setModal(null)}>
        <SuggestPanel onClose={() => setModal(null)} />
      </Modal>
      {/* Escape closes the task viewer first; the Collection stays open behind it */}
      <Modal isOpen={modal === "collection"} onClose={() => !viewerTarget && setModal(null)}>
        <Collection
          onClose={() => setModal(null)}
          onPlay={() => {
            setModal(null);
            onPlay();
          }}
        />
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

const REPO_URL = "https://github.com/MuchaSsak/malatro";

/** GitHub mark (simple-icons, CC0). */
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/** Easter egg: poking the card in the logo summons the TRYWIALNE deck's patron. */
function TrywialneEgg({ onClose }: { onClose: () => void }) {
  const [hasImage, setHasImage] = useState(true);
  return (
    <motion.button
      type="button"
      onClick={onClose}
      className="absolute inset-0 z-[300] grid place-items-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.2, rotate: -25 }}
        animate={{ scale: 1, rotate: [-25, 6, -3, 0] }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
      >
        {hasImage ? (
          <img
            src="/easter/trywialne.jpg"
            alt="TRYWIALNE"
            onError={() => setHasImage(false)}
            className="max-h-[820px] max-w-[1100px] rounded-[18px] border-8 border-[#009dff] shadow-[0_0_80px_#009dff]"
          />
        ) : (
          <span className="tx font-pixel text-[180px] leading-none text-[#7fd4ff] [text-shadow:0_0_40px_#009dff]">
            TRYWIALNE
          </span>
        )}
      </motion.div>
    </motion.button>
  );
}

/** "Suggest an update": one textarea, stored in Supabase `suggestions` (insert-only). */
function SuggestPanel({ onClose }: { onClose: () => void }) {
  const { isOnlineAvailable } = useAuth();
  const { locale } = useSettings();
  const { t } = useLingui();
  const submit = useSubmitSuggestion();
  const [body, setBody] = useState("");
  const isValid = body.trim().length >= 3;
  return (
    <div className="flex w-[820px] flex-col gap-4 p-7">
      <div className="tx font-pixel text-5xl text-white">
        <Trans>Suggest an update</Trans>
      </div>
      <div className="font-pixel text-2xl text-white/70">
        <Trans>A wrong answer, an idea, a bug? Tell us.</Trans>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        placeholder={t`Your suggestion...`}
        rows={7}
        autoFocus
        className="scroll-thin resize-none rounded-panel border-4 border-panel-light bg-inset px-4 py-3 font-pixel text-2xl leading-snug text-white outline-none placeholder:text-white/25 focus:border-blue"
      />
      <div className="text-right font-pixel text-lg text-white/45">{body.length} / 2000</div>
      {!isOnlineAvailable && (
        <div className="font-pixel text-xl text-red">
          <Trans>Sending needs Supabase (see README).</Trans>
        </div>
      )}
      <div className="flex gap-3">
        <PixelButton tone="orange" size="md" className="flex-1" onClick={onClose}>
          <Trans>Back</Trans>
        </PixelButton>
        <PixelButton
          tone="blue"
          size="md"
          className="flex-1"
          disabled={!isValid || submit.isPending || !isOnlineAvailable}
          onClick={() =>
            submit.mutate(
              { body, locale },
              {
                onSuccess: () => {
                  setBody("");
                  onClose();
                },
              },
            )
          }
        >
          {submit.isPending ? <Trans>Sending...</Trans> : <Trans>Send</Trans>}
        </PixelButton>
      </div>
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
  const { l, locale, settings, update } = useSettings();
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
          <label className="flex cursor-pointer items-center justify-center gap-3">
            <input
              type="checkbox"
              checked={settings.isPreferNew}
              onChange={(e) => update({ isPreferNew: e.target.checked })}
              className="h-6 w-6 accent-[#009dff]"
            />
            <span className="tx font-pixel text-2xl text-white/80">
              <Trans>Prefer tasks I haven't met yet</Trans>
            </span>
          </label>
          <PixelButton
            tone="blue"
            size="xl"
            disabled={poolSize < 50}
            onClick={() => {
              if (hasRun && !window.confirm(t`Start a new run? The current run will be lost.`)) return;
              const met = encounteredIds();
              const avoid = settings.isPreferNew && met.size ? encodeTaskSet(pool, met) : undefined;
              engine.newRun(diff.id as DifficultyMode, seed || randomSeed(), avoid);
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
