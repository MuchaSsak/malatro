import { queryClient } from "~/services/tanstack-query/client";

export default function invalidateRuns() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["getLeaderboard"], exact: false }),
    queryClient.invalidateQueries({ queryKey: ["getMyStats"], exact: false }),
  ]);
}
