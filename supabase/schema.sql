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

create table if not exists leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  xp integer not null default 0,
  streak integer not null default 0,
  updated_at bigint not null
);

create index if not exists leaderboard_xp on leaderboard (xp desc);

alter table decks enable row level security;
alter table cards enable row level security;
alter table review_logs enable row level security;
alter table settings enable row level security;
alter table leaderboard enable row level security;

drop policy if exists "own rows" on decks;
create policy "own rows" on decks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on cards;
create policy "own rows" on cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on review_logs;
create policy "own rows" on review_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on settings;
create policy "own rows" on settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bảng xếp hạng: ai đăng nhập cũng đọc được, mỗi người chỉ sửa dòng của mình.
drop policy if exists "board readable" on leaderboard;
create policy "board readable" on leaderboard for select using (auth.role() = 'authenticated');
drop policy if exists "own board row" on leaderboard;
create policy "own board row" on leaderboard for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin + tracking ẩn danh.
create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at bigint not null
);

-- Thêm admin đầu tiên: đăng nhập 1 lần, lấy user id (Settings hiện khi đăng nhập? xem trong Supabase > Authentication > Users),
-- rồi chạy: insert into admins (user_id, added_at) values ('<id-cua-ban>', extract(epoch from now()) * 1000);
create table if not exists analytics_events (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  event text not null,
  path text not null default '',
  at bigint not null
);
create index if not exists analytics_event_at on analytics_events (event, at desc);

alter table admins enable row level security;
alter table analytics_events enable row level security;

-- Ai cũng gửi được event (kể cả guest ẩn danh) — chỉ 3 loại event hợp lệ.
drop policy if exists "track insert" on analytics_events;
create policy "track insert" on analytics_events for insert to anon, authenticated
  with check (event in ('page_view', 'signup', 'review_day'));
-- Chỉ admin đọc.
drop policy if exists "admin read events" on analytics_events;
create policy "admin read events" on analytics_events for select using (
  exists (select 1 from admins where admins.user_id = auth.uid())
);
-- Không ai tự đọc/sửa bảng admins trừ chính admin.
drop policy if exists "admin read admins" on admins;
create policy "admin read admins" on admins for select using (
  exists (select 1 from admins where admins.user_id = auth.uid())
);

-- Admin đọc thống kê học tập toàn hệ thống (đếm, không xem nội dung thẻ người khác ở client).
drop policy if exists "admin read logs" on review_logs;
create policy "admin read logs" on review_logs for select using (
  exists (select 1 from admins where admins.user_id = auth.uid())
);
drop policy if exists "admin read cards" on cards;
create policy "admin read cards" on cards for select using (
  exists (select 1 from admins where admins.user_id = auth.uid())
);
drop policy if exists "admin read decks" on decks;
create policy "admin read decks" on decks for select using (
  exists (select 1 from admins where admins.user_id = auth.uid())
);
