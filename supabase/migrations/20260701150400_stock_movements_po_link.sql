-- Concern: link warehouse-item receipts back to their purchase order for traceability.
-- Additive; existing order_fulfillment/adjustment rows keep a null purchase_order_id.
alter table public.stock_movements
  add column if not exists purchase_order_id uuid
    references public.purchase_orders (id) on delete set null;

create index if not exists idx_stock_movements_po_id
  on public.stock_movements (purchase_order_id);
