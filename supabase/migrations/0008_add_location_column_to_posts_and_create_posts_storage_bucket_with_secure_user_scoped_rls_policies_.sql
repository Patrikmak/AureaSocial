-- Add location to posts
alter table public.posts add column if not exists location text;

-- Ensure posts bucket exists (public)
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do update set public = excluded.public;

-- RLS policies for user-scoped uploads in posts bucket
-- Path format: posts/<user_id>/<timestamp>_<filename>

drop policy if exists posts_media_insert_own on storage.objects;
create policy posts_media_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'posts'
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists posts_media_update_own on storage.objects;
create policy posts_media_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'posts'
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists posts_media_delete_own on storage.objects;
create policy posts_media_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'posts'
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Public read for posts media

drop policy if exists posts_media_select_public on storage.objects;
create policy posts_media_select_public
on storage.objects
for select
using (bucket_id = 'posts');