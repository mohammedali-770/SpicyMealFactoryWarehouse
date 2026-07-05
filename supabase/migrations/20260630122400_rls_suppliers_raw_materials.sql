-- Concern: policies for suppliers + raw_materials (reuses public.jwt_role()).
-- `for all` manage policy + permissive `for select` read are OR-combined, so reads
-- stay open to all authenticated users while writes are role-gated.

-- suppliers: managed by admin + warehouse + factory managers; read by all authenticated.
drop policy if exists suppliers_manage on public.suppliers;
create policy suppliers_manage on public.suppliers
  for all to authenticated
  using (public.jwt_role() in ('admin', 'warehouse_manager', 'factory_manager'))
  with check (public.jwt_role() in ('admin', 'warehouse_manager', 'factory_manager'));

drop policy if exists suppliers_read on public.suppliers;
create policy suppliers_read on public.suppliers
  for select to authenticated using (true);

-- raw_materials: managed by admin + factory manager; read by all authenticated.
drop policy if exists raw_materials_manage on public.raw_materials;
create policy raw_materials_manage on public.raw_materials
  for all to authenticated
  using (public.jwt_role() in ('admin', 'factory_manager'))
  with check (public.jwt_role() in ('admin', 'factory_manager'));

drop policy if exists raw_materials_read on public.raw_materials;
create policy raw_materials_read on public.raw_materials
  for select to authenticated using (true);
