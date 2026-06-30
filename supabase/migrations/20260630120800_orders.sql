-- Concern: orders header. Master-data FKs use RESTRICT (never orphan an order);
-- order children cascade. order_number is filled by a Phase-2 RPC (nullable now).
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text unique,
  customer_id   uuid not null references public.profiles (id) on delete restrict,
  branch_id     uuid references public.branches (id) on delete restrict,
  status        text not null default 'draft'
                  check (status in ('draft', 'pending', 'approved', 'completed', 'cancelled')),
  category      text, -- 'warehouse' | 'factory' (orders are split by category in a later phase)
  order_date    timestamptz not null default now(),
  total_amount  numeric(14,2) not null default 0 check (total_amount >= 0),
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null,
  archived      boolean not null default false,
  approved_at   timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_orders_branch_id on public.orders (branch_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at);
create index if not exists idx_orders_approved_at on public.orders (approved_at);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
