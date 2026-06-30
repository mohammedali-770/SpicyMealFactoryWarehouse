-- Concern: orders policies (the Phase-1 RLS Definition of Done).
-- Admin: full access. Customer: SELECT/INSERT own only. Staff: SELECT all.
-- Staff UPDATE/DELETE status transitions go through Phase-2 RPCs.
drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all to authenticated
  using (public.jwt_role() = 'admin')
  with check (public.jwt_role() = 'admin');

drop policy if exists orders_customer_select on public.orders;
create policy orders_customer_select on public.orders
  for select to authenticated
  using (public.jwt_role() = 'customer' and customer_id = auth.uid());

drop policy if exists orders_staff_select on public.orders;
create policy orders_staff_select on public.orders
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );

drop policy if exists orders_customer_insert on public.orders;
create policy orders_customer_insert on public.orders
  for insert to authenticated
  with check (public.jwt_role() = 'customer' and customer_id = auth.uid());
