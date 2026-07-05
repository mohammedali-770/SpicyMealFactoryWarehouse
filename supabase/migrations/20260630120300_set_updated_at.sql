-- Concern: generic updated_at maintenance trigger function.
-- Attached BEFORE UPDATE on every mutable table (optimistic-locking foundation).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
