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
