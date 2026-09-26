import { queryClient } from "~/services/tanstack-query/client";

export default function invalidateRuns() {
  return queryClient.invalidateQueries({ queryKey: ["getLeaderboard"], exact: false });
}
