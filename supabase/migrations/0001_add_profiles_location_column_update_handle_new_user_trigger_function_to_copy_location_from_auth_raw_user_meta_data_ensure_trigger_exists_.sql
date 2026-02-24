-- Add location column to profiles
alter table public.profiles
add column if not exists location text;

-- Update trigger function to copy location from auth user metadata when available
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, location)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    coalesce(
      nullif(new.raw_user_meta_data ->> 'location', ''),
      nullif(concat_ws(', ', nullif(new.raw_user_meta_data ->> 'city', ''), nullif(new.raw_user_meta_data ->> 'country', '')), ''),
      nullif(concat_ws(', ', nullif(new.raw_user_meta_data ->> 'cidade', ''), nullif(new.raw_user_meta_data ->> 'pais', '')), '')
    )
  )
  on conflict (id) do update set
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    location = coalesce(excluded.location, public.profiles.location),
    updated_at = now();

  return new;
end;
$$;

-- Ensure trigger exists on auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;