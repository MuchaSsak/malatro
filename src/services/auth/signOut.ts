import { requireSupabase } from "~/lib/supabase/client";

export default async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}
