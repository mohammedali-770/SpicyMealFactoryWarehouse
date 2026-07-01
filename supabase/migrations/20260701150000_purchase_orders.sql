-- Concern: purchase orders header. Two kinds:
--   warehouse    (WPO) → restocks warehouse `items`, receipts post to stock_movements.
--   raw_material (RPO) → buys `raw_materials`, receipts post to raw_material_movements.
-- Unlike customer orders, a PO's cost is known up front, so total_amount is set at
-- creation (not at approval). po_number is filled by the create RPC.
create table if not exists public.purchase_orders (
  id            uuid primary key default gen_random_uuid(),
  po_number     text unique,
  kind          text not null check (kind in ('warehouse', 'raw_material')),
  supplier_id   uuid not null references public.suppliers (id) on delete restrict,
  status        text not null default 'pending'
                  check (status in ('draft', 'pending', 'approved', 'received', 'cancelled')),
  notes         text,
  total_amount  numeric(14,2) not null default 0 check (total_amount >= 0),
  created_by    uuid references public.profiles (id) on delete set null,
  approved_at   timestamptz,
  received_at   timestamptz,
  order_date    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_purchase_orders_kind on public.purchase_orders (kind);
create index if not exists idx_purchase_orders_supplier_id on public.purchase_orders (supplier_id);
create index if not exists idx_purchase_orders_status on public.purchase_orders (status);
create index if not exists idx_purchase_orders_created_at on public.purchase_orders (created_at);

drop trigger if exists trg_purchase_orders_updated_at on public.purchase_orders;
create trigger trg_purchase_orders_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();
