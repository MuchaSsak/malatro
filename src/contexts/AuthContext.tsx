import type { Session } from "@supabase/supabase-js";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { IS_SUPABASE_CONFIGURED } from "~/lib/env";
import { readJson, writeJson } from "~/lib/storage";
import { supabase } from "~/lib/supabase/client";
import { queryClient } from "~/services/tanstack-query/client";

/** Types */

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  /** slug shown in UI: profile slug for accounts, "gość" for guests */
  displayName: string | null;
  setGuest: (isGuest: boolean) => void;
  isOnlineAvailable: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const GUEST_KEY = "malatro_guest_v1";

/** Provider */

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(IS_SUPABASE_CONFIGURED);
  const [isGuest, setIsGuestState] = useState<boolean>(() => readJson(GUEST_KEY, false));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) queryClient.setQueriesData({ predicate: (q) => q.queryKey[0] === "getProfile" }, null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const setGuest = (v: boolean) => {
    setIsGuestState(v);
    writeJson(GUEST_KEY, v);
  };

  const slug = (session?.user.user_metadata?.slug as string | undefined) ?? session?.user.email?.split("@")[0] ?? null;

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isGuest: isGuest && !session,
        displayName: session ? slug : null,
        setGuest,
        isOnlineAvailable: IS_SUPABASE_CONFIGURED,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth was used outside of AuthProvider!");
  return ctx;
}
