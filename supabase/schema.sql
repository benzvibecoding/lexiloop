-- LexiLoop cloud sync schema (Supabase / Postgres).
-- Chạy trong Supabase SQL Editor. Mọi bảng: user_id + updated_at + deleted_at, RLS theo user.

create table if not exists decks (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at bigint not null,
  deleted_at bigint
);

create table if not exists cards (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id text not null,
  data jsonb not null,
  updated_at bigint not null,
  deleted_at bigint
);

create table if not exists review_logs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null,
  deck_id text not null,
  data jsonb not null,
  updated_at bigint not null
);

create table if not exists settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at bigint not null
);

create index if not exists decks_user_updated on decks (user_id, updated_at desc);
create index if not exists cards_user_updated on cards (user_id, updated_at desc);
create index if not exists cards_user_deck on cards (user_id, deck_id);
create index if not exists logs_user_updated on review_logs (user_id, updated_at desc);
create index if not exists logs_user_card on review_logs (user_id, card_id);

alter table decks enable row level security;
alter table cards enable row level security;
alter table review_logs enable row level security;
alter table settings enable row level security;

drop policy if exists "own rows" on decks;
create policy "own rows" on decks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on cards;
create policy "own rows" on cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on review_logs;
create policy "own rows" on review_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on settings;
create policy "own rows" on settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
