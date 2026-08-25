-- Crew gifts, chat, daily orbit scores. Apply after 002_friendships.sql.

create table if not exists public.crew_gifts (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('life', 'item')),
  item_id text,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_scores (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  score int not null default 0,
  primary key (user_id, day)
);

alter table public.profiles add column if not exists is_admin boolean not null default false;

alter table public.crew_gifts enable row level security;
alter table public.crew_messages enable row level security;
alter table public.daily_scores enable row level security;

create policy "gifts participants" on public.crew_gifts
  for all using (auth.uid() = sender or auth.uid() = recipient)
  with check (auth.uid() = sender or auth.uid() = recipient);

create policy "messages participants" on public.crew_messages
  for all using (auth.uid() = sender or auth.uid() = recipient)
  with check (auth.uid() = sender or auth.uid() = recipient);

create policy "daily self write" on public.daily_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily read" on public.daily_scores
  for select to authenticated using (true);

create or replace view public.daily_board_public
with (security_invoker = true) as
select
  p.display_name,
  d.score,
  d.day
from public.daily_scores d
join public.profiles p on p.id = d.user_id;

grant select on public.daily_board_public to anon, authenticated;

create index if not exists crew_gifts_recipient_idx on public.crew_gifts (recipient, claimed_at);
create index if not exists crew_messages_pair_idx on public.crew_messages (sender, recipient, created_at desc);
