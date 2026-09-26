import { useQuery } from "@tanstack/react-query";

import { IS_SUPABASE_CONFIGURED } from "~/lib/env";
import type { DifficultyMode } from "~/lib/game/types";
import getLeaderboard from "~/services/runs/getLeaderboard";

export default function useGetLeaderboard(difficulty: DifficultyMode) {
  return useQuery({
    queryKey: ["getLeaderboard", difficulty],
    queryFn: () => getLeaderboard({ difficulty }),
    enabled: IS_SUPABASE_CONFIGURED,
  });
}
