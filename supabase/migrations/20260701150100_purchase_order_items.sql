-- Concern: purchase order line items. A line references EXACTLY ONE master row —
-- items (warehouse PO) XOR raw_materials (raw-material PO) — enforced by a CHECK.
-- unit_price is the purchase COST, captured at creation (caller-supplied or defaulted
-- from the master). line_name/line_serial snapshot the master so history is stable.
create table if not exists public.purchase_order_items (
  id              uuid primary key default gen_random_uuid(),
  po_id           uuid not null references public.purchase_orders (id) on delete cascade,
  item_id         uuid references public.items (id) on delete restrict,
  raw_material_id uuid references public.raw_materials (id) on delete restrict,
  line_name       text,
  line_serial     text,
  quantity        numeric(14,3) not null check (quantity > 0),
  unit_price      numeric(14,2) not null default 0 check (unit_price >= 0),
  line_total      numeric(14,2)
                    generated always as (round(quantity * coalesce(unit_price, 0), 2)) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint purchase_order_items_one_ref
    check ((item_id is not null) <> (raw_material_id is not null))
);

create index if not exists idx_po_items_po_id on public.purchase_order_items (po_id);
create index if not exists idx_po_items_item_id on public.purchase_order_items (item_id);
create index if not exists idx_po_items_raw_material_id on public.purchase_order_items (raw_material_id);

drop trigger if exists trg_po_items_updated_at on public.purchase_order_items;
create trigger trg_po_items_updated_at
  before update on public.purchase_order_items
  for each row execute function public.set_updated_at();
