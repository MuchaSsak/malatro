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
