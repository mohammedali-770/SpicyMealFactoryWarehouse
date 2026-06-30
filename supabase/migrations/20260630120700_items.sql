-- Concern: items (catalog). Money is numeric(14,2). Soft-deleted via is_active.
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique,
  name        text not null,
  name_ar     text,
  category    text, -- 'warehouse' | 'factory' (constrained in a later phase)
  unit        text not null default 'kg',
  unit_price  numeric(14,2) not null default 0 check (unit_price >= 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();
