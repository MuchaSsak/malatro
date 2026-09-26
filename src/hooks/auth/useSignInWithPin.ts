import { useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import signInWithPin, { AuthFlowError } from "~/services/auth/signInWithPin";

export default function useSignInWithPin() {
  const { t } = useLingui();
  return useMutation({
    mutationKey: ["signInWithPin"],
    mutationFn: signInWithPin,
    onSuccess: ({ isNew }) => {
      toast.success(isNew ? t`Account created - welcome!` : t`Welcome back!`);
    },
    onError: (error) => {
      if (error instanceof AuthFlowError) {
        const text = {
          invalid_slug: t`Login: 3-20 characters, lowercase letters, digits, - or _`,
          invalid_pin: t`PIN: at least 4 characters`,
          wrong_pin: t`Wrong PIN for this login`,
          confirm_required: t`Email confirmation is enabled in Supabase - disable it for PIN login`,
        }[error.reason];
        toast.error(text);
        return;
      }
      toast.error(t`Could not sign in`, { description: error.message });
    },
  });
}
