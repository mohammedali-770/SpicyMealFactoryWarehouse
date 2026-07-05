-- Concern: keep the profiles.role/email mirror consistent with auth metadata.
-- GoTrue populates app_metadata in a second write AFTER the INSERT that fires
-- handle_new_user(), so the role can be missed at creation time. This AFTER UPDATE
-- trigger re-syncs whenever auth metadata changes, so profiles.role always matches
-- the JWT's app_metadata.role (which RLS actually reads).
create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set role  = coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, p.role),
      email = new.email
  where p.id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of raw_app_meta_data, email on auth.users
  for each row execute function public.sync_profile_from_auth();
