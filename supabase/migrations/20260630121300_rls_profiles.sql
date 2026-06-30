-- Concern: JWT role helper + profiles policies.
-- jwt_role() reads the business role from the JWT app_metadata claim.
-- IMPORTANT: never SELECT from profiles inside a policy (avoids recursive RLS).
create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select auth.jwt() -> 'app_metadata' ->> 'role';
$$;

-- Admin: full access to all profiles.
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.jwt_role() = 'admin')
  with check (public.jwt_role() = 'admin');

-- Everyone else: read ONLY their own profile row (don't expose staff emails/roles).
-- Writes are admin-only; INSERT is handled by the SECURITY DEFINER handle_new_user trigger.
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select to authenticated
  using (id = auth.uid());
