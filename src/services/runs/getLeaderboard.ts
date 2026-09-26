import type { DifficultyMode } from "~/lib/game/types";
import { requireSupabase } from "~/lib/supabase/client";

export type GetLeaderboardServiceProps = { difficulty: DifficultyMode; limit?: number };

export default async function getLeaderboard({ difficulty, limit = 50 }: GetLeaderboardServiceProps) {
  const { data, error } = await requireSupabase().rpc("get_leaderboard", { p_difficulty: difficulty, p_limit: limit });
  if (error) throw error;
  return data ?? [];
}
