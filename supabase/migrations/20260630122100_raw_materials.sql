-- Concern: raw materials (factory inputs), optionally sourced from a supplier.
create table if not exists public.raw_materials (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  name_ar      text,
  unit         text not null default 'kg',
  unit_price   numeric(14,2) not null default 0 check (unit_price >= 0),
  supplier_id  uuid references public.suppliers (id) on delete restrict,
  is_active    boolean not null default true,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_raw_materials_supplier_id on public.raw_materials (supplier_id);
create index if not exists idx_raw_materials_order_index on public.raw_materials (order_index);
create index if not exists idx_raw_materials_active on public.raw_materials (is_active) where is_active;

drop trigger if exists trg_raw_materials_updated_at on public.raw_materials;
create trigger trg_raw_materials_updated_at
  before update on public.raw_materials
  for each row execute function public.set_updated_at();
