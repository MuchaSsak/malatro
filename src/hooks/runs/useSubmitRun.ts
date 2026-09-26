import { useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import invalidateRuns from "~/services/runs/invalidateRuns";
import submitRun from "~/services/runs/submitRun";

export default function useSubmitRun() {
  const { t } = useLingui();
  return useMutation({
    mutationKey: ["submitRun"],
    mutationFn: submitRun,
    onSuccess: () => {
      toast.success(t`Result saved to the leaderboard`);
      void invalidateRuns();
    },
    onError: (error) => toast.error(t`Could not save the result`, { description: error.message }),
  });
}
