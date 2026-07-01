-- Concern: stock_movements policies + grants. Warehouse stock is internal, so customers
-- have NO access. Admin: full. Staff: read-only (writes go through SECURITY DEFINER RPCs
-- and the order-completion path, never direct client INSERTs).
alter table public.stock_movements enable row level security;

drop policy if exists stock_movements_admin_all on public.stock_movements;
create policy stock_movements_admin_all on public.stock_movements
  for all to authenticated
  using (public.jwt_role() = 'admin')
  with check (public.jwt_role() = 'admin');

drop policy if exists stock_movements_staff_select on public.stock_movements;
create policy stock_movements_staff_select on public.stock_movements
  for select to authenticated
  using (
    public.jwt_role() in
      ('warehouse_manager', 'factory_manager', 'general_manager', 'accountant')
  );

grant select, insert, update, delete on public.stock_movements to authenticated;
