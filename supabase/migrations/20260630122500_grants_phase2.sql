-- Concern: base table privileges so RLS (not a missing GRANT) gates access.
grant select, insert, update, delete on public.suppliers, public.raw_materials to authenticated;
grant select on public.suppliers, public.raw_materials to anon;
