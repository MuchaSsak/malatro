import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { ENV, IS_SUPABASE_CONFIGURED } from "~/lib/env";
import type { Database } from "~/lib/supabase/database";

/** Browser client; `null` when the project runs without Supabase (guest-only mode). */
export const supabase: SupabaseClient<Database> | null = IS_SUPABASE_CONFIGURED
  ? createClient<Database>(ENV.VITE_SUPABASE_URL!, ENV.VITE_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      global: { headers: { "x-client-info": "malatro" } },
    })
  : null;

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) throw new Error("Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)");
  return supabase;
}

export const RPC_ERROR = { PERMISSION_DENIED: "42501", DUPLICATION: "23505" } as const;
