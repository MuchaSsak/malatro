import { useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import signOut from "~/services/auth/signOut";

export default function useSignOut() {
  const { t } = useLingui();
  return useMutation({
    mutationKey: ["signOut"],
    mutationFn: signOut,
    onError: (error) => toast.error(t`Could not sign out`, { description: error.message }),
  });
}
