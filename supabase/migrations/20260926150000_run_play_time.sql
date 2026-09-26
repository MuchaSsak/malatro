begin;

/* Runs: active play time per run (ms), capped at 100 days */
alter table public.runs add column if not exists play_time_ms bigint not null default 0;
alter table public.runs drop constraint if exists runs_play_time_check;
alter table public.runs add constraint runs_play_time_check check (play_time_ms between 0 and 8640000000);

/* submit_run gains p_play_time_ms; drop the old signature so calls are unambiguous */
drop function if exists public.submit_run (text, text, integer, boolean, boolean, bigint, bigint, integer, integer, text);

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
  p_play_time_ms bigint default 0
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
    user_id, run_id, difficulty, ante, is_won, is_endless, total_score, best_hand, correct_notes, hands_played, seed, play_time_ms
  )
  values (
    v_user, p_run_id, p_difficulty, p_ante, p_is_won, p_is_endless, p_total_score, p_best_hand,
    greatest(0, p_correct_notes), greatest(0, p_hands_played), left(coalesce(p_seed, ''), 16),
    least(greatest(coalesce(p_play_time_ms, 0), 0), 8640000000)
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
        updated_at = now();
end;
$$;

revoke all on function public.submit_run (text, text, integer, boolean, boolean, bigint, bigint, integer, integer, text, bigint) from public, anon;
grant execute on function public.submit_run (text, text, integer, boolean, boolean, bigint, bigint, integer, integer, text, bigint) to authenticated;

commit;

begin;

/* get_my_stats - the caller's lifetime totals across all submitted runs */
create or replace function public.get_my_stats ()
returns table (
  runs_count integer,
  total_play_time_ms bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer, coalesce(sum(r.play_time_ms), 0)::bigint
  from public.runs r
  where r.user_id = auth.uid ();
$$;

revoke all on function public.get_my_stats () from public, anon;
grant execute on function public.get_my_stats () to authenticated;

commit;
