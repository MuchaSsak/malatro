import type { Locale } from "~/lib/game/types";
import { requireSupabase } from "~/lib/supabase/client";

export type SubmitSuggestionServiceProps = { body: string; locale: Locale };

export default async function submitSuggestion({ body, locale }: SubmitSuggestionServiceProps) {
  // insert only: players have no SELECT on suggestions, so don't ask for the row back
  const { error } = await requireSupabase().from("suggestions").insert({ body: body.trim(), locale });
  if (error) throw error;
}
