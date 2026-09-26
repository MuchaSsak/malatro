begin;

/* Runs: five difficulty decks (CIEKAWE+ and CIEKAWE++ added) */
alter table public.runs drop constraint if exists runs_difficulty_check;
alter table public.runs add constraint runs_difficulty_check
  check (difficulty in ('trywialne', 'trywialne_plus', 'ciekawe', 'ciekawe_plus', 'ciekawe_plus_plus'));

commit;
