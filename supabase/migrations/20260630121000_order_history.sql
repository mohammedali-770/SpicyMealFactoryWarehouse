-- Concern: append-only order status/edit audit trail. No updated_at (immutable rows).
create table if not exists public.order_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status   text,
  note        text,
  changed_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_order_history_order_id on public.order_history (order_id);
