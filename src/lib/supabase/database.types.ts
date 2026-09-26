// Generated shape of the public schema (regenerate: `bun run supabase:types` with the local stack running).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { created_at: string; id: string; slug: string };
        Insert: { created_at?: string; id: string; slug: string };
        Update: { created_at?: string; id?: string; slug?: string };
        Relationships: [];
      };
      runs: {
        Row: {
          ante: number;
          best_hand: number;
          correct_notes: number;
          created_at: string;
          difficulty: string;
          hands_played: number;
          id: string;
          is_endless: boolean;
          is_won: boolean;
          run_id: string;
          seed: string;
          total_score: number;
          updated_at: string;
          user_id: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_leaderboard: {
        Args: { p_difficulty: string; p_limit?: number };
        Returns: {
          ante: number;
          best_hand: number;
          correct_notes: number;
          created_at: string;
          is_me: boolean;
          is_won: boolean;
          slug: string;
          total_score: number;
        }[];
      };
      submit_run: {
        Args: {
          p_ante: number;
          p_best_hand: number;
          p_correct_notes: number;
          p_difficulty: string;
          p_hands_played: number;
          p_is_endless: boolean;
          p_is_won: boolean;
          p_run_id: string;
          p_seed: string;
          p_total_score: number;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
