import { Trans, useLingui } from "@lingui/react/macro";
import { type FormEvent, useState } from "react";

import Logo from "~/components/layout/Logo";
import PixelButton from "~/components/ui/PixelButton";
import { useAuth } from "~/contexts/AuthContext";
import { useSettings } from "~/contexts/SettingsContext";
import useSignInWithPin from "~/hooks/auth/useSignInWithPin";
import { audio } from "~/lib/audio";

/** Login = short slug + PIN. Unknown slug creates the account on the spot. */
export default function AuthScreen() {
  const { setGuest, isOnlineAvailable } = useAuth();
  const { settings, update } = useSettings();
  const { t } = useLingui();
  const signIn = useSignInWithPin();
  const [slug, setSlug] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    audio.unlock();
    signIn.mutate({ slug, pin });
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
      <Logo size={170} />
      <form
        onSubmit={handleSubmit}
        className="w-[640px] rounded-[22px] bg-outline p-[5px] shadow-hard"
        onPointerDown={() => audio.unlock()}
      >
        <div className="flex flex-col gap-5 rounded-[18px] bg-panel p-8">
          <div className="tx text-center font-pixel text-5xl text-white">
            <Trans>Sign in or create an account</Trans>
          </div>
          {isOnlineAvailable ? (
            <>
              <label className="flex flex-col gap-2">
                <span className="tx font-pixel text-3xl text-white/85">
                  <Trans>Login</Trans>
                </span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  maxLength={20}
                  autoFocus
                  autoComplete="username"
                  placeholder={t`e.g. mateusz`}
                  className="rounded-panel border-4 border-panel-light bg-inset px-4 py-3 font-pixel text-4xl text-white outline-none placeholder:text-white/25 focus:border-blue"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="tx font-pixel text-3xl text-white/85">
                  <Trans>PIN or short password</Trans>
                </span>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  type="password"
                  maxLength={32}
                  autoComplete="current-password"
                  placeholder="••••"
                  className="rounded-panel border-4 border-panel-light bg-inset px-4 py-3 font-pixel text-4xl tracking-widest text-white outline-none placeholder:text-white/25 focus:border-blue"
                />
              </label>
              <PixelButton tone="blue" size="lg" type="submit" disabled={signIn.isPending || slug.length < 3 || pin.length < 4}>
                {signIn.isPending ? <Trans>Entering...</Trans> : <Trans>Enter</Trans>}
              </PixelButton>
              <p className="text-center font-pixel text-xl leading-tight text-white/55">
                <Trans>New login? We create the account automatically. Same login next time = your results.</Trans>
              </p>
            </>
          ) : (
            <p className="text-center font-pixel text-2xl leading-tight text-white/70">
              <Trans>Online accounts are not configured (VITE_SUPABASE_URL). You can play as a guest.</Trans>
            </p>
          )}
          <PixelButton tone="grey" size="md" onClick={() => setGuest(true)}>
            <Trans>Play as guest</Trans>
          </PixelButton>
          <div className="flex justify-center gap-2">
            {(["pl", "en"] as const).map((loc) => (
              <PixelButton
                key={loc}
                size="sm"
                tone={settings.locale === loc ? "red" : "panel"}
                onClick={() => update({ locale: loc })}
              >
                {loc.toUpperCase()}
              </PixelButton>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
