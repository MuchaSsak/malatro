import { z } from "zod";

/** Public (browser-safe) config only. Supabase is optional: without it the game runs in guest mode. */
const ENV_SCHEMA = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(10).optional(),
});

const parsed = ENV_SCHEMA.safeParse(import.meta.env);

export const ENV = parsed.success ? parsed.data : {};
export const IS_SUPABASE_CONFIGURED = !!(ENV.VITE_SUPABASE_URL && ENV.VITE_SUPABASE_PUBLISHABLE_KEY);
