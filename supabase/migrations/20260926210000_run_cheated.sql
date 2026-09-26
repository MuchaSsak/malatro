begin;

/* Runs: flag runs where the testing cheats were used; the leaderboard hides them */
alter table public.runs add column if not exists is_cheated boolean not null default false;

/* submit_run gains p_is_cheated; drop the old signature so calls are unambiguous */
drop function if exists public.submit_run (text, text, integer, boolean, boolean, bigint, bigint, integer, integer, text, bigint);

commit;

begin;

/* submit_run - upsert the caller's run result; the only write path into public.runs */
create or replace function public.submit_run (
  p_run_id text,
  p_difficulty text,
  p_ante integer,
  p_is_won boolean,
  p_is_endless boolean,
  p_total_score bigint,
  p_best_hand bigint,
  p_correct_notes integer,
  p_hands_played integer,
  p_seed text,
  p_play_time_ms bigint default 0,
  p_is_cheated boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid ();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_total_score < -100000000 or p_total_score > 1000000000000 or p_best_hand > 1000000000000 then
    raise exception 'score out of range' using errcode = '22003';
  end if;
  insert into public.runs as r (
    user_id, run_id, difficulty, ante, is_won, is_endless, total_score, best_hand, correct_notes, hands_played, seed, play_time_ms, is_cheated
  )
  values (
    v_user, p_run_id, p_difficulty, p_ante, p_is_won, p_is_endless, p_total_score, p_best_hand,
    greatest(0, p_correct_notes), greatest(0, p_hands_played), left(coalesce(p_seed, ''), 16),
    least(greatest(coalesce(p_play_time_ms, 0), 0), 8640000000), coalesce(p_is_cheated, false)
  )
  on conflict (user_id, run_id) do update
    set ante = greatest(r.ante, excluded.ante),
        is_won = r.is_won or excluded.is_won,
        is_endless = r.is_endless or excluded.is_endless,
        total_score = greatest(r.total_score, excluded.total_score),
        best_hand = greatest(r.best_hand, excluded.best_hand),
        correct_notes = greatest(r.correct_notes, excluded.correct_notes),
        hands_played = greatest(r.hands_played, excluded.hands_played),
        play_time_ms = greatest(r.play_time_ms, excluded.play_time_ms),
        -- once cheated, always cheated
        is_cheated = r.is_cheated or excluded.is_cheated,
        updated_at = now();
end;
$$;

revoke all on function public.submit_run (text, text, integer, boolean, boolean, bigint, bigint, integer, integer, text, bigint, boolean) from public, anon;
grant execute on function public.submit_run (text, text, integer, boolean, boolean, bigint, bigint, integer, integer, text, bigint, boolean) to authenticated;

commit;

begin;

/* get_leaderboard - best run per player for one difficulty; exposes only slug + run numbers; runs with cheats never show */
create or replace function public.get_leaderboard (p_difficulty text, p_limit integer default 50)
returns table (
  slug text,
  ante integer,
  is_won boolean,
  total_score bigint,
  best_hand bigint,
  correct_notes integer,
  created_at timestamptz,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.slug, b.ante, b.is_won, b.total_score, b.best_hand, b.correct_notes, b.created_at, b.user_id = auth.uid ()
  from (
    select distinct on (r.user_id)
      p.slug, r.user_id, r.ante, r.is_won, r.total_score, r.best_hand, r.correct_notes, r.created_at
    from public.runs r
    join public.profiles p on p.id = r.user_id
    where r.difficulty = p_difficulty and not r.is_cheated
    order by r.user_id, r.ante desc, r.total_score desc
  ) b
  order by b.ante desc, b.total_score desc
  limit least(greatest(p_limit, 1), 200);
$$;

revoke all on function public.get_leaderboard (text, integer) from public;
grant execute on function public.get_leaderboard (text, integer) to anon, authenticated;

commit;
