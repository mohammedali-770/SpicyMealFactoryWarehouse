-- Concern: production batch lines. Inputs consume raw materials; outputs produce warehouse
-- items. Names are snapshotted so soft-deleting a master never rewrites batch history. FKs
-- to masters use RESTRICT; both cascade from the batch.
create table if not exists public.batch_inputs (
  id              uuid primary key default gen_random_uuid(),
  batch_id        uuid not null references public.production_batches (id) on delete cascade,
  raw_material_id uuid not null references public.raw_materials (id) on delete restrict,
  line_name       text,
  quantity        numeric(14,3) not null check (quantity > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.batch_outputs (
  id         uuid primary key default gen_random_uuid(),
  batch_id   uuid not null references public.production_batches (id) on delete cascade,
  item_id    uuid not null references public.items (id) on delete restrict,
  line_name  text,
  quantity   numeric(14,3) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_batch_inputs_batch_id on public.batch_inputs (batch_id);
create index if not exists idx_batch_inputs_rm_id on public.batch_inputs (raw_material_id);
create index if not exists idx_batch_outputs_batch_id on public.batch_outputs (batch_id);
create index if not exists idx_batch_outputs_item_id on public.batch_outputs (item_id);

drop trigger if exists trg_batch_inputs_updated_at on public.batch_inputs;
create trigger trg_batch_inputs_updated_at
  before update on public.batch_inputs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_batch_outputs_updated_at on public.batch_outputs;
create trigger trg_batch_outputs_updated_at
  before update on public.batch_outputs
  for each row execute function public.set_updated_at();
