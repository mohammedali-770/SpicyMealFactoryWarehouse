-- Concern: read-only reporting views for accountant / general_manager / admin.
-- security_invoker so the caller's RLS applies, PLUS an explicit jwt_role() guard in each
-- WHERE so non-reporting roles get an empty result even though the underlying tables are
-- staff-readable. Daily views expose a business_day (Asia/Riyadh) the client filters on with
-- gte/lte; valuation views are current-state snapshots.

-- Sales: recognised revenue from approved/completed customer orders, by day + category.
create or replace view public.report_sales_daily
  with (security_invoker = true) as
select
  (o.order_date at time zone 'Asia/Riyadh')::date   as business_day,
  o.category,
  count(*)::int                                     as order_count,
  coalesce(sum(o.total_amount), 0)::numeric(14,2)   as revenue
from public.orders o
where o.status in ('approved', 'completed')
  and public.jwt_role() in ('admin', 'general_manager', 'accountant')
group by 1, 2;

-- Purchasing spend: received POs, by receipt day + kind.
create or replace view public.report_purchase_daily
  with (security_invoker = true) as
select
  (coalesce(po.received_at, po.order_date) at time zone 'Asia/Riyadh')::date as business_day,
  po.kind,
  count(*)::int                                     as po_count,
  coalesce(sum(po.total_amount), 0)::numeric(14,2)  as spend
from public.purchase_orders po
where po.status = 'received'
  and public.jwt_role() in ('admin', 'general_manager', 'accountant')
group by 1, 2;

-- Production output: completed batches by completion day.
create or replace view public.report_production_daily
  with (security_invoker = true) as
select
  (b.completed_at at time zone 'Asia/Riyadh')::date as business_day,
  count(distinct b.id)::int                         as batch_count,
  coalesce(sum(bo.quantity), 0)::numeric(14,3)      as output_qty
from public.production_batches b
left join public.batch_outputs bo on bo.batch_id = b.id
where b.status = 'completed'
  and public.jwt_role() in ('admin', 'general_manager', 'accountant')
group by 1;

-- Inventory valuation (current snapshot): on-hand x catalog unit price.
create or replace view public.report_item_valuation
  with (security_invoker = true) as
select
  i.id                                              as item_id,
  i.sku,
  i.name,
  i.name_ar,
  i.unit,
  coalesce(sum(m.quantity), 0)::numeric(14,3)       as on_hand,
  i.unit_price,
  (coalesce(sum(m.quantity), 0) * i.unit_price)::numeric(14,2) as value
from public.items i
left join public.stock_movements m on m.item_id = i.id
where i.category = 'warehouse'
  and public.jwt_role() in ('admin', 'general_manager', 'accountant')
group by i.id;

create or replace view public.report_raw_material_valuation
  with (security_invoker = true) as
select
  rm.id                                             as raw_material_id,
  rm.name,
  rm.name_ar,
  rm.unit,
  coalesce(sum(m.quantity), 0)::numeric(14,3)       as on_hand,
  rm.unit_price,
  (coalesce(sum(m.quantity), 0) * rm.unit_price)::numeric(14,2) as value
from public.raw_materials rm
left join public.raw_material_movements m on m.raw_material_id = rm.id
where public.jwt_role() in ('admin', 'general_manager', 'accountant')
group by rm.id;

grant select on
  public.report_sales_daily,
  public.report_purchase_daily,
  public.report_production_daily,
  public.report_item_valuation,
  public.report_raw_material_valuation
to authenticated;
