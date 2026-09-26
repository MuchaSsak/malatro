/** App-facing DB types: import from here, never from the generated file. */
import type { Database as Generated } from "~/lib/supabase/database.types";

export type Database = Generated;

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type RpcReturns<F extends keyof PublicSchema["Functions"]> = PublicSchema["Functions"][F]["Returns"];
export type RpcArgs<F extends keyof PublicSchema["Functions"]> = PublicSchema["Functions"][F]["Args"];

export type LeaderboardRow = RpcReturns<"get_leaderboard">[number];
