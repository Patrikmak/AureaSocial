-- Allow authenticated users to read profiles (needed for Discover/Tinder-like browsing)
drop policy if exists profiles_authenticated_read on public.profiles;
create policy profiles_authenticated_read
on public.profiles
for select
to authenticated
using (true);

-- Swipes (likes/pass/superlike)
create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('like','pass','superlike')),
  created_at timestamp with time zone not null default now(),
  unique (swiper_id, target_id)
);

alter table public.swipes enable row level security;

drop policy if exists swipes_select_own_or_target on public.swipes;
create policy swipes_select_own_or_target
on public.swipes
for select
to authenticated
using (auth.uid() = swiper_id or auth.uid() = target_id);

drop policy if exists swipes_insert_own on public.swipes;
create policy swipes_insert_own
on public.swipes
for insert
to authenticated
with check (auth.uid() = swiper_id);

drop policy if exists swipes_update_own on public.swipes;
create policy swipes_update_own
on public.swipes
for update
to authenticated
using (auth.uid() = swiper_id)
with check (auth.uid() = swiper_id);

drop policy if exists swipes_delete_own on public.swipes;
create policy swipes_delete_own
on public.swipes
for delete
to authenticated
using (auth.uid() = swiper_id);

-- Matches (unique pair)
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique (user_low, user_high),
  check (user_low < user_high)
);

alter table public.matches enable row level security;

drop policy if exists matches_select_participants on public.matches;
create policy matches_select_participants
on public.matches
for select
to authenticated
using (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists matches_insert_participants on public.matches;
create policy matches_insert_participants
on public.matches
for insert
to authenticated
with check (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists matches_delete_participants on public.matches;
create policy matches_delete_participants
on public.matches
for delete
to authenticated
using (auth.uid() = user_low or auth.uid() = user_high);

-- Messages
create table if not exists public.match_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.match_messages enable row level security;

drop policy if exists match_messages_select_participants on public.match_messages;
create policy match_messages_select_participants
on public.match_messages
for select
to authenticated
using (
  exists (
    select 1 from public.matches m
    where m.id = match_messages.match_id
      and (auth.uid() = m.user_low or auth.uid() = m.user_high)
  )
);

drop policy if exists match_messages_insert_sender_participant on public.match_messages;
create policy match_messages_insert_sender_participant
on public.match_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.matches m
    where m.id = match_messages.match_id
      and (auth.uid() = m.user_low or auth.uid() = m.user_high)
  )
);
