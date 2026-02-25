-- Saves (bookmark) for posts

create table if not exists public.post_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, post_id)
);

alter table public.post_saves enable row level security;

drop policy if exists post_saves_select_own on public.post_saves;
create policy post_saves_select_own
on public.post_saves
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists post_saves_insert_own on public.post_saves;
create policy post_saves_insert_own
on public.post_saves
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists post_saves_delete_own on public.post_saves;
create policy post_saves_delete_own
on public.post_saves
for delete
to authenticated
using (auth.uid() = user_id);
