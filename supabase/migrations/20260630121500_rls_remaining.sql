-- Concern: policies for branches, items, order_items, order_history, daily_counters.

-- branches: all authenticated may read; only admin writes.
drop policy if exists branches_admin_all on public.branches;
create policy branches_admin_all on public.branches
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists branches_read on public.branches;
create policy branches_read on public.branches
  for select to authenticated using (true);

-- items: all authenticated may read; only admin writes (pricing UPD by accountant is a later phase).
drop policy if exists items_admin_all on public.items;
create policy items_admin_all on public.items
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists items_read on public.items;
create policy items_read on public.items
  for select to authenticated using (true);

-- order_items: admin full; staff read all; customer reads lines of their own orders.
drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists order_items_staff_select on public.order_items;
create policy order_items_staff_select on public.order_items
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );
drop policy if exists order_items_customer_select on public.order_items;
create policy order_items_customer_select on public.order_items
  for select to authenticated
  using (
    public.jwt_role() = 'customer'
    and exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

-- order_history: admin full; staff read all; customer reads history of their own orders.
drop policy if exists order_history_admin_all on public.order_history;
create policy order_history_admin_all on public.order_history
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists order_history_staff_select on public.order_history;
create policy order_history_staff_select on public.order_history
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );
drop policy if exists order_history_customer_select on public.order_history;
create policy order_history_customer_select on public.order_history
  for select to authenticated
  using (
    public.jwt_role() = 'customer'
    and exists (
      select 1 from public.orders o
      where o.id = order_history.order_id and o.customer_id = auth.uid()
    )
  );

-- daily_counters: admin only via RLS (service_role bypasses RLS for Phase-2 number RPCs).
drop policy if exists daily_counters_admin_all on public.daily_counters;
create policy daily_counters_admin_all on public.daily_counters
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
