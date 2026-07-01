-- Concern: production batch header. The factory consumes raw materials and yields warehouse
-- items. Ledger movements are posted atomically at completion (see set_batch_status):
-- negative raw_material_movements (consumption) + positive stock_movements (production).
-- Nothing posts until 'completed', so cancelling from pending/in_progress needs no reversal.
create table if not exists public.production_batches (
  id            uuid primary key default gen_random_uuid(),
  batch_number  text unique,
  status        text not null default 'pending'
                  check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null,
  started_at    timestamptz,
  completed_at  timestamptz,
  order_date    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_production_batches_status on public.production_batches (status);
create index if not exists idx_production_batches_created_at on public.production_batches (created_at);

drop trigger if exists trg_production_batches_updated_at on public.production_batches;
create trigger trg_production_batches_updated_at
  before update on public.production_batches
  for each row execute function public.set_updated_at();
