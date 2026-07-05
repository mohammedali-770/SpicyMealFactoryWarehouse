-- Concern: RLS + grants for purchasing. Purchasing is internal, so customers have NO
-- access. Admin: full. Staff (warehouse/factory/general managers + accountant): read all.
-- All writes go through the SECURITY DEFINER purchasing RPCs, never direct client INSERTs.
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.raw_material_movements enable row level security;

-- ---- purchase_orders ----
drop policy if exists purchase_orders_admin_all on public.purchase_orders;
create policy purchase_orders_admin_all on public.purchase_orders
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists purchase_orders_staff_select on public.purchase_orders;
create policy purchase_orders_staff_select on public.purchase_orders
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );

-- ---- purchase_order_items ----
drop policy if exists po_items_admin_all on public.purchase_order_items;
create policy po_items_admin_all on public.purchase_order_items
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists po_items_staff_select on public.purchase_order_items;
create policy po_items_staff_select on public.purchase_order_items
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );

-- ---- raw_material_movements ----
drop policy if exists rm_movements_admin_all on public.raw_material_movements;
create policy rm_movements_admin_all on public.raw_material_movements
  for all to authenticated
  using (public.jwt_role() = 'admin') with check (public.jwt_role() = 'admin');
drop policy if exists rm_movements_staff_select on public.raw_material_movements;
create policy rm_movements_staff_select on public.raw_material_movements
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );

grant select, insert, update, delete on
  public.purchase_orders,
  public.purchase_order_items,
  public.raw_material_movements
to authenticated;
