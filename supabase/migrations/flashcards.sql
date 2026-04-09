create extension if not exists "pgcrypto";

create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  title text not null,
  subject text,
  card_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references public.flashcard_decks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  front text not null,
  back text not null,
  type text default 'concept',
  tags jsonb default '[]'::jsonb,
  ease_factor float default 2.5,
  interval_days int default 1,
  repetitions int default 0,
  next_review_date date default current_date,
  last_review_date date,
  created_at timestamptz default now()
);

create table if not exists public.review_log (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.flashcards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  rating int not null,
  time_taken_ms int,
  reviewed_at timestamptz default now()
);

create index if not exists idx_flashcards_due on public.flashcards(session_id, next_review_date);

alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.review_log enable row level security;

drop policy if exists "Users manage own flashcard decks" on public.flashcard_decks;
create policy "Users manage own flashcard decks"
  on public.flashcard_decks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own flashcards" on public.flashcards;
create policy "Users manage own flashcards"
  on public.flashcards
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own review log" on public.review_log;
create policy "Users manage own review log"
  on public.review_log
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
