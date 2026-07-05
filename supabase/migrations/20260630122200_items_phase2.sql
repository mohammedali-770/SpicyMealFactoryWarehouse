-- Concern: Phase-2 additive columns on items + branches (reorder, image, category).
alter table public.items add column if not exists order_index integer not null default 0;
alter table public.items add column if not exists image_url text;
-- factory items prompt the customer for an on-hand stock level (order_items.stock_level)
alter table public.items add column if not exists stock_level_required boolean not null default false;

-- Constrain category to the two domains (guarded: CHECK has no IF NOT EXISTS).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'items_category_check') then
    alter table public.items
      add constraint items_category_check
      check (category is null or category in ('warehouse', 'factory'));
  end if;
end
$$;

alter table public.branches add column if not exists order_index integer not null default 0;

create index if not exists idx_items_order_index on public.items (order_index);
create index if not exists idx_items_category on public.items (category);
create index if not exists idx_branches_order_index on public.branches (order_index);
