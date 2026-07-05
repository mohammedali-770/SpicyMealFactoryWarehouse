-- Concern: enable RLS on the new master-data tables.
alter table public.suppliers     enable row level security;
alter table public.raw_materials enable row level security;
