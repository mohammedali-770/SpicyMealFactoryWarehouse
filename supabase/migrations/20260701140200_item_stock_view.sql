-- Concern: on-hand quantity per warehouse item = running sum of its ledger movements.
-- security_invoker so the caller's RLS on items/stock_movements applies (staff see real
-- balances; customers, having no stock_movements access, simply see nothing here).
create or replace view public.item_stock
  with (security_invoker = true) as
select
  i.id                                     as item_id,
  i.sku,
  i.name,
  i.name_ar,
  i.category,
  i.unit,
  coalesce(sum(m.quantity), 0)::numeric(14,3) as on_hand
from public.items i
left join public.stock_movements m on m.item_id = i.id
where i.category = 'warehouse'
group by i.id;

grant select on public.item_stock to authenticated;
