import { requireSupabase } from "~/lib/supabase/client";

export const SLUG_REGEX = /^[a-z0-9_-]{3,20}$/;
export const PIN_REGEX = /^[\p{L}\p{N}_!@#$%^&*.-]{4,32}$/u;

export type SignInWithPinServiceProps = { slug: string; pin: string };
export type SignInWithPinResult = { isNew: boolean };

export class AuthFlowError extends Error {
  constructor(public readonly reason: "invalid_slug" | "invalid_pin" | "wrong_pin" | "confirm_required") {
    super(reason);
  }
}

/**
 * Login = short slug + PIN. Supabase needs an email + a 6+ char password, so the slug maps to a
 * synthetic address and the PIN gets a fixed prefix. Unknown slug => account is created on the spot.
 */
export default async function signInWithPin({ slug, pin }: SignInWithPinServiceProps): Promise<SignInWithPinResult> {
  const supabase = requireSupabase();
  const cleanSlug = slug.trim().toLowerCase();
  if (!SLUG_REGEX.test(cleanSlug)) throw new AuthFlowError("invalid_slug");
  if (!PIN_REGEX.test(pin)) throw new AuthFlowError("invalid_pin");
  const email = `${cleanSlug}@players.malatro.dev`;
  const password = `mlt-${pin}`;

  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error) return { isNew: false };
  if (signIn.error.code !== "invalid_credentials") throw signIn.error;

  const signUp = await supabase.auth.signUp({ email, password, options: { data: { slug: cleanSlug } } });
  if (signUp.error) {
    if (signUp.error.code === "user_already_exists" || signUp.error.code === "email_exists") {
      throw new AuthFlowError("wrong_pin");
    }
    throw signUp.error;
  }
  if (!signUp.data.session) throw new AuthFlowError("confirm_required");
  return { isNew: true };
}
