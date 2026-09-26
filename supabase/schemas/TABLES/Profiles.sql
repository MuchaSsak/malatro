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
