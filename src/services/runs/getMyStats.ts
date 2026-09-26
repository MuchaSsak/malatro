import { requireSupabase } from "~/lib/supabase/client";

export default async function getMyStats() {
  const { data, error } = await requireSupabase().rpc("get_my_stats");
  if (error) throw error;
  return data?.[0] ?? { runs_count: 0, total_play_time_ms: 0 };
}
