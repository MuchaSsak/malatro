import { useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import submitSuggestion from "~/services/suggestions/submitSuggestion";

export default function useSubmitSuggestion() {
  const { t } = useLingui();
  return useMutation({
    mutationKey: ["submitSuggestion"],
    mutationFn: submitSuggestion,
    onSuccess: () => toast.success(t`Thanks! Your suggestion was sent.`),
    onError: (error) => toast.error(t`Could not send the suggestion`, { description: error.message }),
  });
}
