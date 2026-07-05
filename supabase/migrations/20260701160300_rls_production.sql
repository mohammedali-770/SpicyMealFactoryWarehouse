-- Concern: RLS + grants for production. Internal, so customers have NO access. Admin: full.
-- Staff (warehouse/factory/general managers + accountant): read all. Writes go through the
-- SECURITY DEFINER batch RPCs, never direct client INSERTs.
alter table public.production_batches enable row level security;
alter table public.batch_inputs enable row level security;
alter table public.batch_outputs enable row level security;

drop policy if exists production_batches_admin_all on public.production_batches;
create policy production_batches_admin_all on public.production_batches
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists production_batches_staff_select on public.production_batches;
create policy production_batches_staff_select on public.production_batches
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );

drop policy if exists batch_inputs_admin_all on public.batch_inputs;
create policy batch_inputs_admin_all on public.batch_inputs
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists batch_inputs_staff_select on public.batch_inputs;
create policy batch_inputs_staff_select on public.batch_inputs
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );

drop policy if exists batch_outputs_admin_all on public.batch_outputs;
create policy batch_outputs_admin_all on public.batch_outputs
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists batch_outputs_staff_select on public.batch_outputs;
create policy batch_outputs_staff_select on public.batch_outputs
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );

grant select, insert, update, delete on
  public.production_batches,
  public.batch_inputs,
  public.batch_outputs
to authenticated;
