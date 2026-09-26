begin;

set local search_path = public, pg_catalog;

/* Runs - finished (or abandoned-with-progress) game runs; written only via submit_run(), read via get_leaderboard() */
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  run_id text not null,
  difficulty text not null,
  ante integer not null,
  is_won boolean not null default false,
  is_endless boolean not null default false,
  total_score bigint not null default 0,
  best_hand bigint not null default 0,
  correct_notes integer not null default 0,
  hands_played integer not null default 0,
  play_time_ms bigint not null default 0,
  -- testing cheats were used: kept for the player's own stats, hidden from the leaderboard
  is_cheated boolean not null default false,
  seed text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint runs_difficulty_check check (difficulty in ('trywialne', 'trywialne_plus', 'ciekawe')),
  constraint runs_ante_check check (ante between 1 and 100),
  constraint runs_play_time_check check (play_time_ms between 0 and 8640000000),
  constraint runs_run_id_length check (char_length(run_id) between 4 and 64)
);

create unique index if not exists runs_user_id_run_id_idx on public.runs (user_id, run_id);
create index if not exists runs_difficulty_ante_score_idx on public.runs (difficulty, ante desc, total_score desc);

alter table public.runs enable row level security;

drop policy if exists "Enable SELECT_OWN for authenticated" on public.runs;
create policy "Enable SELECT_OWN for authenticated" on public.runs for select
  to authenticated using (user_id = (select auth.uid ()));

revoke all on public.runs from anon;
grant select on public.runs to authenticated;

commit;
