-- Concern: business role enum. profiles.role is the editable source of truth;
-- it is mirrored into the JWT app_metadata.role for RLS (see security model).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'admin',
      'customer',
      'warehouse_manager',
      'factory_manager',
      'general_manager',
      'accountant'
    );
  end if;
end
$$;
