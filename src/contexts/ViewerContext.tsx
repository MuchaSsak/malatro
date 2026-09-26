import { createContext, type ReactNode, useContext, useState } from "react";

/** Types */

export type ViewerSource = "hand" | "shop" | "pack" | "played" | "deck";
export type ViewerTarget = { taskId: string; cardUid?: string; source: ViewerSource; price?: number };

type ViewerContextValue = {
  target: ViewerTarget | null;
  open: (t: ViewerTarget) => void;
  close: () => void;
};

const ViewerContext = createContext<ViewerContextValue | null>(null);

/** Provider: which task (if any) is open in the fullscreen viewer. */
export default function ViewerProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ViewerTarget | null>(null);
  return (
    <ViewerContext.Provider value={{ target, open: setTarget, close: () => setTarget(null) }}>
      {children}
    </ViewerContext.Provider>
  );
}

export function useViewer() {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error("useViewer was used outside of ViewerProvider!");
  return ctx;
}
