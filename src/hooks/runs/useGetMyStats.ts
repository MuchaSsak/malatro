import { useQuery } from "@tanstack/react-query";

import { IS_SUPABASE_CONFIGURED } from "~/lib/env";
import getMyStats from "~/services/runs/getMyStats";

export default function useGetMyStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["getMyStats", userId],
    queryFn: getMyStats,
    enabled: IS_SUPABASE_CONFIGURED && !!userId,
  });
}
