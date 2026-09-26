import { Component, type ErrorInfo, type ReactNode } from "react";

import { STORAGE_KEY } from "~/lib/game/engine";
import { loadSettings } from "~/lib/settings";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

const COPY = {
  pl: {
    title: "Coś poszło nie tak",
    body: "Gra napotkała błąd. Spróbuj odświeżyć stronę. Jeśli błąd wraca, zresetuj zapisaną partię.",
    reload: "Odśwież",
    reset: "Zresetuj partię",
  },
  en: {
    title: "Something went wrong",
    body: "The game hit an error. Try reloading. If it keeps happening, reset the saved run.",
    reload: "Reload",
    reset: "Reset saved run",
  },
};

/**
 * Last-resort screen for render errors. Sits outside every provider (i18n included), so it reads
 * the locale straight from settings and uses plain copy. "Reset" drops only the saved run, which is
 * the one piece of state that can crash every reload; settings and drawings stay.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const copy = COPY[loadSettings().locale === "en" ? "en" : "pl"];
    const handleReset = () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // storage blocked: nothing saved to clear
      }
      location.reload();
    };
    return (
      <div className="grid h-full w-full place-items-center bg-inset-deep p-8 font-pixel text-white">
        <div className="w-full max-w-[560px] rounded-panel border-4 border-outline bg-panel p-8 text-center shadow-hard">
          <div className="tx mb-4 text-5xl text-red">{copy.title}</div>
          <p className="mb-8 text-2xl leading-snug text-white/80">{copy.body}</p>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              className="h-16 rounded-panel bg-blue px-6 text-3xl shadow-hard active:translate-y-[4px]"
              onClick={() => location.reload()}
            >
              {copy.reload}
            </button>
            <button
              type="button"
              className="h-16 rounded-panel bg-red px-6 text-3xl shadow-hard active:translate-y-[4px]"
              onClick={handleReset}
            >
              {copy.reset}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
