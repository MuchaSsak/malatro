import type { RunState } from "~/lib/game/types";
import { requireSupabase } from "~/lib/supabase/client";

export type SubmitRunServiceProps = { run: RunState };

export default async function submitRun({ run }: SubmitRunServiceProps) {
  const { error } = await requireSupabase().rpc("submit_run", {
    p_run_id: run.id,
    p_difficulty: run.difficulty,
    p_ante: run.ante,
    p_is_won: run.phase === "won" || !!run.endless,
    p_is_endless: !!run.endless,
    p_total_score: Math.round(run.stats.totalScore),
    p_best_hand: Math.round(run.stats.bestHand),
    p_correct_notes: run.stats.correctNotes,
    p_hands_played: run.stats.handsPlayed,
    p_seed: run.seed,
    p_play_time_ms: Math.round(run.stats.playTimeMs ?? 0),
    p_is_cheated: !!run.isCheated,
  });
  if (error) throw error;
}
