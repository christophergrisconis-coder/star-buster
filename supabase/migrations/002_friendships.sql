-- Friendships + public-facing profile fields for crew search.
-- Does not alter 001_init.sql. Apply after the base schema.

alter table public.profiles
  add column if not exists last_nebula_name text,
  add column if not exists last_active_at timestamptz not null default now();

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (requester, addressee),
  check (requester <> addressee)
);

create index if not exists friendships_requester_idx on public.friendships (requester);
create index if not exists friendships_addressee_idx on public.friendships (addressee);
create index if not exists profiles_display_name_idx on public.profiles (display_name);

alter table public.friendships enable row level security;

drop policy if exists "friendships participants read" on public.friendships;
create policy "friendships participants read" on public.friendships
  for select using (auth.uid() = requester or auth.uid() = addressee);

drop policy if exists "friendships requester insert" on public.friendships;
create policy "friendships requester insert" on public.friendships
  for insert with check (auth.uid() = requester);

drop policy if exists "friendships participants update" on public.friendships;
create policy "friendships participants update" on public.friendships
  for update using (auth.uid() = requester or auth.uid() = addressee)
  with check (auth.uid() = requester or auth.uid() = addressee);

drop policy if exists "profiles crew search" on public.profiles;
create policy "profiles crew search" on public.profiles
  for select to authenticated using (true);
