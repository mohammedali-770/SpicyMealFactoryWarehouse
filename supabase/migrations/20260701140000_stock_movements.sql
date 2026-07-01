-- Concern: append-only inventory ledger for warehouse items. On-hand for an item is the
-- running sum of its movement quantities (see the item_stock view). Rows are immutable
-- (no updated_at). quantity is SIGNED: positive = stock in, negative = stock out.
--   order_fulfillment : posted when a warehouse order is completed (negative).
--   adjustment        : manual correction / initial load (signed).
--   purchase_receipt  : reserved for Phase 5 goods receipt (positive).
-- FKs use RESTRICT/SET NULL so the ledger never loses an item and survives order/user churn.
create table if not exists public.stock_movements (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items (id) on delete restrict,
  quantity    numeric(14,3) not null check (quantity <> 0),
  reason      text not null
                check (reason in ('order_fulfillment', 'adjustment', 'purchase_receipt')),
  order_id    uuid references public.orders (id) on delete set null,
  note        text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_stock_movements_item_id on public.stock_movements (item_id);
create index if not exists idx_stock_movements_order_id on public.stock_movements (order_id);
create index if not exists idx_stock_movements_created_at on public.stock_movements (created_at);
