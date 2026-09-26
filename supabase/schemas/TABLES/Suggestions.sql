/* Suggestions - free-text "Suggest an update" feedback from the main menu; write-only for players, read in the dashboard */
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null default auth.uid (),
  body text not null,
  locale text,
  created_at timestamptz not null default now(),
  constraint suggestions_body_length check (char_length(body) between 3 and 2000),
  constraint suggestions_locale_format check (locale is null or locale in ('pl', 'en'))
);

alter table public.suggestions enable row level security;

create policy "Enable INSERT for anon and authenticated" on public.suggestions for insert
  to anon, authenticated with check (user_id is null or user_id = (select auth.uid ()));

revoke all on public.suggestions from anon, authenticated;
grant insert on public.suggestions to anon, authenticated;
