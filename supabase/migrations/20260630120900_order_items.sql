-- Concern: order line items.
--  - quantity: numeric(14,3).
--  - unit_price: SNAPSHOT captured at approval (Phase 2). Nullable until then.
--  - item_name / item_serial: snapshots so soft-deleting an item never corrupts history.
--  - stock_level: customer-reported on-hand level for factory items (documented per spec).
--  - line_total: generated/stored = round(quantity * unit_price, 2).
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  item_id     uuid not null references public.items (id) on delete restrict,
  item_name   text,
  item_serial text,
  quantity    numeric(14,3) not null check (quantity > 0),
  stock_level numeric(14,3),
  unit_price  numeric(14,2),
  line_total  numeric(14,2)
                generated always as (round(quantity * coalesce(unit_price, 0), 2)) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_item_id on public.order_items (item_id);

drop trigger if exists trg_order_items_updated_at on public.order_items;
create trigger trg_order_items_updated_at
  before update on public.order_items
  for each row execute function public.set_updated_at();
