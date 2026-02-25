-- Create posts table (profile grid source)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  caption text,
  created_at timestamp with time zone not null default now()
);

alter table public.posts enable row level security;

drop policy if exists posts_select_authenticated on public.posts;
create policy posts_select_authenticated
on public.posts
for select
to authenticated
using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own
on public.posts
for update
to authenticated
using (auth.uid() = user_id);

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own
on public.posts
for delete
to authenticated
using (auth.uid() = user_id);


-- Comments for posts
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamp with time zone not null default now()
);

create index if not exists post_comments_post_id_idx on public.post_comments (post_id);

alter table public.post_comments enable row level security;

drop policy if exists post_comments_select_authenticated on public.post_comments;
create policy post_comments_select_authenticated
on public.post_comments
for select
to authenticated
using (true);

drop policy if exists post_comments_insert_own on public.post_comments;
create policy post_comments_insert_own
on public.post_comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists post_comments_delete_own on public.post_comments;
create policy post_comments_delete_own
on public.post_comments
for delete
to authenticated
using (auth.uid() = user_id);


-- Allow the post owner to cleanup likes/comments when deleting a post.
-- Note: This does NOT allow reading others' likes; it only expands DELETE permissions.

drop policy if exists post_likes_delete_as_post_owner on public.post_likes;
create policy post_likes_delete_as_post_owner
on public.post_likes
for delete
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id::text = post_likes.post_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists post_comments_delete_as_post_owner on public.post_comments;
create policy post_comments_delete_as_post_owner
on public.post_comments
for delete
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id::text = post_comments.post_id
      and p.user_id = auth.uid()
  )
);
