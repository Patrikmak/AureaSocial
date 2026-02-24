-- Ensure avatars bucket exists (public)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- RLS policies for user-scoped uploads in avatars bucket
-- Path format used by the app: profile/<user_id>/<timestamp>_<filename>

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'profile'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'profile'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'profile'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Public read for avatars (bucket is public, but keep an explicit policy for clarity)
drop policy if exists avatars_select_public on storage.objects;
create policy avatars_select_public
on storage.objects
for select
using (bucket_id = 'avatars');