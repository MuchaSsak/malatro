begin;

set local search_path = public, pg_catalog;

/* Profiles - one row per auth user, created by trigger on signup; the slug is the player's login and public name */
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint profiles_slug_format check (slug ~ '^[a-z0-9_-]{3,20}$')
);

create unique index if not exists profiles_slug_idx on public.profiles (slug);

/* Trigger: mirror new auth users into profiles (slug comes from signUp options.data.slug) */
create schema if not exists private;

create or replace function private.profiles_sync_with_users ()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, slug)
  values (new.id, lower(coalesce(new.raw_user_meta_data ->> 'slug', split_part(new.email, '@', 1))))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_sync_with_users_tr on auth.users;
create trigger profiles_sync_with_users_tr
after insert on auth.users
for each row execute function private.profiles_sync_with_users ();

alter table public.profiles enable row level security;

drop policy if exists "Enable SELECT_OWN for authenticated" on public.profiles;
create policy "Enable SELECT_OWN for authenticated" on public.profiles for select
  to authenticated using (id = (select auth.uid ()));

revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;

commit;
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
  seed text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint runs_difficulty_check check (difficulty in ('trywialne', 'trywialne_plus', 'ciekawe')),
  constraint runs_ante_check check (ante between 1 and 100),
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
  p_seed text
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
    user_id, run_id, difficulty, ante, is_won, is_endless, total_score, best_hand, correct_notes, hands_played, seed
  )
  values (
    v_user, p_run_id, p_difficulty, p_ante, p_is_won, p_is_endless, p_total_score, p_best_hand,
    greatest(0, p_correct_notes), greatest(0, p_hands_played), left(coalesce(p_seed, ''), 16)
  )
  on conflict (user_id, run_id) do update
    set ante = greatest(r.ante, excluded.ante),
        is_won = r.is_won or excluded.is_won,
        is_endless = r.is_endless or excluded.is_endless,
        total_score = greatest(r.total_score, excluded.total_score),
        best_hand = greatest(r.best_hand, excluded.best_hand),
        correct_notes = greatest(r.correct_notes, excluded.correct_notes),
        hands_played = greatest(r.hands_played, excluded.hands_played),
        updated_at = now();
end;
$$;

revoke all on function public.submit_run (text, text, integer, boolean, boolean, bigint, bigint, integer, integer, text) from public, anon;
grant execute on function public.submit_run (text, text, integer, boolean, boolean, bigint, bigint, integer, integer, text) to authenticated;

commit;
begin;

/* get_leaderboard - best run per player for one difficulty; exposes only slug + run numbers */
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
    where r.difficulty = p_difficulty
    order by r.user_id, r.ante desc, r.total_score desc
  ) b
  order by b.ante desc, b.total_score desc
  limit least(greatest(p_limit, 1), 200);
$$;

revoke all on function public.get_leaderboard (text, integer) from public;
grant execute on function public.get_leaderboard (text, integer) to anon, authenticated;

commit;
