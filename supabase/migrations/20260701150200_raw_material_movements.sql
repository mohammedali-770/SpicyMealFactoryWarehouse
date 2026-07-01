-- Concern: append-only inventory ledger for raw materials (mirror of stock_movements
-- for warehouse items). Populated by raw-material purchase-order receipts; on-hand is the
-- running sum (see the raw_material_stock view). quantity is SIGNED (in/out).
create table if not exists public.raw_material_movements (
  id                uuid primary key default gen_random_uuid(),
  raw_material_id   uuid not null references public.raw_materials (id) on delete restrict,
  quantity          numeric(14,3) not null check (quantity <> 0),
  reason            text not null check (reason in ('purchase_receipt', 'adjustment')),
  purchase_order_id uuid references public.purchase_orders (id) on delete set null,
  note              text,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_rm_movements_raw_material_id
  on public.raw_material_movements (raw_material_id);
create index if not exists idx_rm_movements_po_id
  on public.raw_material_movements (purchase_order_id);
create index if not exists idx_rm_movements_created_at
  on public.raw_material_movements (created_at);
