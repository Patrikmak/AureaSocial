-- Table to persist likes per user per post
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, post_id)
);

alter table public.post_likes enable row level security;

drop policy if exists post_likes_select_own on public.post_likes;
create policy post_likes_select_own
on public.post_likes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists post_likes_insert_own on public.post_likes;
create policy post_likes_insert_own
on public.post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists post_likes_delete_own on public.post_likes;
create policy post_likes_delete_own
on public.post_likes
for delete
to authenticated
using (auth.uid() = user_id);
