-- Star Buster schema (Supabase / Lovable Cloud)
-- Apply in the SQL editor or via supabase db push.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  skin_id text not null default 'nova-gold',
  created_at timestamptz not null default now()
);

create table if not exists public.level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id int not null,
  best_score int not null default 0,
  stars int not null default 0,
  completed_at timestamptz,
  unique (user_id, level_id)
);

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id int not null,
  board jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, level_id)
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id int not null,
  score int not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Pilot')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.level_progress enable row level security;
alter table public.game_saves enable row level security;
alter table public.leaderboard_entries enable row level security;

create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

create policy "progress self" on public.level_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "saves self" on public.game_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "leaderboard self write" on public.leaderboard_entries
  for insert with check (auth.uid() = user_id);
create policy "leaderboard self read" on public.leaderboard_entries
  for select using (auth.uid() = user_id);

create or replace view public.leaderboard_public as
select
  p.display_name,
  p.avatar_url,
  e.score,
  e.level_id,
  e.created_at
from public.leaderboard_entries e
join public.profiles p on p.id = e.user_id;

grant select on public.leaderboard_public to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatar owner"
  on storage.objects for all
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
