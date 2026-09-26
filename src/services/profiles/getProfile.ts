import { requireSupabase } from "~/lib/supabase/client";

export type GetProfileServiceProps = { userId: string };

export default async function getProfile({ userId }: GetProfileServiceProps) {
  const { data, error } = await requireSupabase().from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}
