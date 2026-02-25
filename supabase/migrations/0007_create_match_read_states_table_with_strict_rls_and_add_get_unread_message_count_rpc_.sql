-- Create match read states table
create table if not exists public.match_read_states (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamp with time zone not null default now(),
  primary key (match_id, user_id)
);

alter table public.match_read_states enable row level security;

drop policy if exists match_read_states_select_own on public.match_read_states;
create policy match_read_states_select_own
on public.match_read_states
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches m
    where m.id = match_read_states.match_id
      and (auth.uid() = m.user_low or auth.uid() = m.user_high)
  )
);

drop policy if exists match_read_states_insert_own on public.match_read_states;
create policy match_read_states_insert_own
on public.match_read_states
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches m
    where m.id = match_read_states.match_id
      and (auth.uid() = m.user_low or auth.uid() = m.user_high)
  )
);

drop policy if exists match_read_states_update_own on public.match_read_states;
create policy match_read_states_update_own
on public.match_read_states
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches m
    where m.id = match_read_states.match_id
      and (auth.uid() = m.user_low or auth.uid() = m.user_high)
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches m
    where m.id = match_read_states.match_id
      and (auth.uid() = m.user_low or auth.uid() = m.user_high)
  )
);

drop policy if exists match_read_states_delete_own on public.match_read_states;
create policy match_read_states_delete_own
on public.match_read_states
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches m
    where m.id = match_read_states.match_id
      and (auth.uid() = m.user_low or auth.uid() = m.user_high)
  )
);

-- RPC: total unread messages for current user
create or replace function public.get_unread_message_count()
returns integer
language sql
stable
as $$
  with my_matches as (
    select id
    from public.matches
    where user_low = auth.uid() or user_high = auth.uid()
  ), reads as (
    select match_id, last_read_at
    from public.match_read_states
    where user_id = auth.uid()
  )
  select coalesce(count(*), 0)::int
  from public.match_messages mm
  join my_matches m on m.id = mm.match_id
  left join reads r on r.match_id = mm.match_id
  where mm.sender_id <> auth.uid()
    and mm.created_at > coalesce(r.last_read_at, 'epoch'::timestamptz);
$$;