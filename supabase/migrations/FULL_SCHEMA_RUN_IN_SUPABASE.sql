-- ============================================================
-- STAR BUSTER — Full Schema Setup
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Pilot',
  avatar_url text,
  skin_id text not null default 'nova-gold',
  last_nebula_name text,
  last_active_at timestamptz not null default now(),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- LEVEL PROGRESS
create table if not exists public.level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id int not null,
  best_score int not null default 0,
  stars int not null default 0,
  completed_at timestamptz,
  unique (user_id, level_id)
);

-- GAME SAVES
create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id int not null default 1,
  board jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, level_id)
);

-- LEADERBOARD ENTRIES
create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id int not null,
  score int not null,
  created_at timestamptz not null default now()
);

-- FRIENDSHIPS
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (requester, addressee),
  check (requester <> addressee)
);

-- CREW GIFTS
create table if not exists public.crew_gifts (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('life', 'item')),
  item_id text,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- CREW MESSAGES
create table if not exists public.crew_messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- DAILY SCORES
create table if not exists public.daily_scores (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  score int not null default 0,
  primary key (user_id, day)
);

-- INDEXES
create index if not exists friendships_requester_idx on public.friendships (requester);
create index if not exists friendships_addressee_idx on public.friendships (addressee);
create index if not exists profiles_display_name_idx on public.profiles (display_name);
create index if not exists crew_gifts_recipient_idx on public.crew_gifts (recipient, claimed_at);
create index if not exists crew_messages_pair_idx on public.crew_messages (sender, recipient, created_at desc);

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Pilot'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.level_progress enable row level security;
alter table public.game_saves enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.friendships enable row level security;
alter table public.crew_gifts enable row level security;
alter table public.crew_messages enable row level security;
alter table public.daily_scores enable row level security;

-- POLICIES
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles crew search" on public.profiles;
create policy "profiles crew search" on public.profiles for select to authenticated using (true);

drop policy if exists "progress self all" on public.level_progress;
create policy "progress self all" on public.level_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saves self all" on public.game_saves;
create policy "saves self all" on public.game_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "scores self insert" on public.leaderboard_entries;
create policy "scores self insert" on public.leaderboard_entries for insert with check (auth.uid() = user_id);
drop policy if exists "scores self read" on public.leaderboard_entries;
create policy "scores self read" on public.leaderboard_entries for select using (auth.uid() = user_id);

drop policy if exists "friendships participants read" on public.friendships;
create policy "friendships participants read" on public.friendships for select using (auth.uid() = requester or auth.uid() = addressee);
drop policy if exists "friendships requester insert" on public.friendships;
create policy "friendships requester insert" on public.friendships for insert with check (auth.uid() = requester);
drop policy if exists "friendships participants update" on public.friendships;
create policy "friendships participants update" on public.friendships for update using (auth.uid() = requester or auth.uid() = addressee) with check (auth.uid() = requester or auth.uid() = addressee);

drop policy if exists "gifts participants" on public.crew_gifts;
create policy "gifts participants" on public.crew_gifts for all using (auth.uid() = sender or auth.uid() = recipient) with check (auth.uid() = sender or auth.uid() = recipient);

drop policy if exists "messages participants" on public.crew_messages;
create policy "messages participants" on public.crew_messages for all using (auth.uid() = sender or auth.uid() = recipient) with check (auth.uid() = sender or auth.uid() = recipient);

drop policy if exists "daily self write" on public.daily_scores;
create policy "daily self write" on public.daily_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "daily read" on public.daily_scores;
create policy "daily read" on public.daily_scores for select to authenticated using (true);

-- PUBLIC VIEWS
create or replace view public.leaderboard_public
with (security_invoker = true) as
select
  p.display_name,
  p.avatar_url,
  e.score,
  e.level_id,
  e.created_at
from public.leaderboard_entries e
join public.profiles p on p.id = e.user_id;

create or replace view public.daily_board_public
with (security_invoker = true) as
select
  p.display_name,
  d.score,
  d.day
from public.daily_scores d
join public.profiles p on p.id = d.user_id;

grant select on public.leaderboard_public to anon, authenticated;
grant select on public.daily_board_public to anon, authenticated;

-- STORAGE BUCKET FOR AVATARS
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

drop policy if exists "avatar owner rw" on storage.objects;
create policy "avatar owner rw"
  on storage.objects for all
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
