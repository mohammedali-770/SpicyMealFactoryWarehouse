-- Concern: extend both inventory ledgers for production, and link movements to their batch.
-- CHECK constraints have no IF NOT EXISTS, so drop-and-re-add the reason guards.
alter table public.stock_movements drop constraint if exists stock_movements_reason_check;
alter table public.stock_movements add constraint stock_movements_reason_check
  check (reason in ('order_fulfillment', 'adjustment', 'purchase_receipt', 'production'));
alter table public.stock_movements add column if not exists production_batch_id uuid
  references public.production_batches (id) on delete set null;
create index if not exists idx_stock_movements_batch_id
  on public.stock_movements (production_batch_id);

alter table public.raw_material_movements drop constraint if exists raw_material_movements_reason_check;
alter table public.raw_material_movements add constraint raw_material_movements_reason_check
  check (reason in ('purchase_receipt', 'adjustment', 'consumption'));
alter table public.raw_material_movements add column if not exists production_batch_id uuid
  references public.production_batches (id) on delete set null;
create index if not exists idx_rm_movements_batch_id
  on public.raw_material_movements (production_batch_id);
