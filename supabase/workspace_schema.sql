create extension if not exists "pgcrypto";

create table if not exists public.workspace_history (
  id text primary key,
  session_id text not null,
  title text not null,
  introduction text not null default '',
  source_text text not null,
  language text not null check (language in ('english', 'hinglish')),
  mode text not null check (mode in ('summary', 'explain', 'assignment', 'revision', 'solve')),
  result_data jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workspace_history_session_created_idx
  on public.workspace_history (session_id, created_at desc);

create table if not exists public.workspace_library (
  id text primary key,
  session_id text not null,
  title text not null,
  introduction text not null default '',
  source_text text not null,
  language text not null check (language in ('english', 'hinglish')),
  last_mode text not null check (last_mode in ('summary', 'explain', 'assignment', 'revision', 'solve')),
  visits integer not null default 1,
  result_data jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists workspace_library_session_updated_idx
  on public.workspace_library (session_id, updated_at desc);

create unique index if not exists workspace_library_session_source_language_idx
  on public.workspace_library (session_id, source_text, language);

alter table public.workspace_history enable row level security;
alter table public.workspace_library enable row level security;

drop policy if exists "Service role full access on workspace_history" on public.workspace_history;
create policy "Service role full access on workspace_history"
  on public.workspace_history
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role full access on workspace_library" on public.workspace_library;
create policy "Service role full access on workspace_library"
  on public.workspace_library
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
