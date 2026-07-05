-- Concern: suppliers master data (warehouse + raw-material vendors).
create table if not exists public.suppliers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  name_ar      text,
  contact_name text,
  phone        text,
  email        text,
  address      text,
  notes        text,
  is_active    boolean not null default true,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_suppliers_order_index on public.suppliers (order_index);
create index if not exists idx_suppliers_active on public.suppliers (is_active) where is_active;

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();
