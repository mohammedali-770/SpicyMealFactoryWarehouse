-- pgTAP: reporting views (Phase 7). Drives a full order → PO → batch scenario, then checks
-- the aggregates and the jwt_role() guard that hides reports from non-reporting staff.
-- Run locally with `supabase test db`, or in CI with `pg_prove` against a migrated DB.
begin;
select plan(9);

-- ---- Fixtures ----
insert into auth.users (id, email, raw_app_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'c1@test.local', '{"role":"customer"}'),
  ('44444444-4444-4444-4444-444444444444', 'wh@test.local', '{"role":"warehouse_manager"}'),
  ('55555555-5555-5555-5555-555555555555', 'ft@test.local', '{"role":"factory_manager"}'),
  ('66666666-6666-6666-6666-666666666666', 'ac@test.local', '{"role":"accountant"}')
on conflict (id) do nothing;
insert into public.suppliers (id, name, is_active)
  values ('c0000000-0000-0000-0000-000000000001', 'S1', true) on conflict (id) do nothing;
insert into public.items (id, sku, name, category, unit_price, is_active)
  values ('10000000-0000-0000-0000-000000000001', 'W1', 'Meal', 'warehouse', 10, true)
  on conflict (id) do nothing;
insert into public.raw_materials (id, name, unit_price, is_active)
  values ('a0000000-0000-0000-0000-000000000001', 'Salt', 3, true) on conflict (id) do nothing;

-- Customer order W1 x5 -> approved (revenue 50).
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","app_metadata":{"role":"customer"}}', true);
select public.create_customer_order('[{"item_id":"10000000-0000-0000-0000-000000000001","quantity":5}]'::jsonb);
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","app_metadata":{"role":"warehouse_manager"}}', true);
select public.set_order_status((select id from public.orders where category = 'warehouse'), 'approved');

-- WPO W1 x100 @4 -> received (spend 400, stock +100).
select public.create_purchase_order('warehouse', 'c0000000-0000-0000-0000-000000000001',
  '[{"ref_id":"10000000-0000-0000-0000-000000000001","quantity":100,"unit_price":4}]'::jsonb);
select public.set_purchase_order_status((select id from public.purchase_orders where kind='warehouse'), 'approved');
select public.set_purchase_order_status((select id from public.purchase_orders where kind='warehouse'), 'received');

-- RPO Salt x50 @3 -> received (spend 150, raw +50); batch consumes 20, produces 8 items.
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","app_metadata":{"role":"factory_manager"}}', true);
select public.create_purchase_order('raw_material', 'c0000000-0000-0000-0000-000000000001',
  '[{"ref_id":"a0000000-0000-0000-0000-000000000001","quantity":50,"unit_price":3}]'::jsonb);
select public.set_purchase_order_status((select id from public.purchase_orders where kind='raw_material'), 'approved');
select public.set_purchase_order_status((select id from public.purchase_orders where kind='raw_material'), 'received');
select public.create_production_batch(
  '[{"ref_id":"a0000000-0000-0000-0000-000000000001","quantity":20}]'::jsonb,
  '[{"ref_id":"10000000-0000-0000-0000-000000000001","quantity":8}]'::jsonb);
select public.set_batch_status((select id from public.production_batches), 'in_progress');
select public.set_batch_status((select id from public.production_batches), 'completed');

-- ---- Reports as accountant ----
select set_config('request.jwt.claims',
  '{"sub":"66666666-6666-6666-6666-666666666666","app_metadata":{"role":"accountant"}}', true);
select is((select revenue from public.report_sales_daily where category = 'warehouse'),
  50::numeric, 'sales revenue is the approved order total');
select is((select spend from public.report_purchase_daily where kind = 'warehouse'),
  400::numeric, 'warehouse PO spend is the received total');
select is((select spend from public.report_purchase_daily where kind = 'raw_material'),
  150::numeric, 'raw-material PO spend is the received total');
select is((select output_qty from public.report_production_daily),
  8::numeric, 'production output is the completed batch yield');
select is((select batch_count from public.report_production_daily),
  1, 'one completed batch is counted');
select is(
  (select value from public.report_item_valuation where item_id = '10000000-0000-0000-0000-000000000001'),
  1080::numeric, 'item valuation = on-hand (108) x unit price (10)');
select is(
  (select value from public.report_raw_material_valuation
     where raw_material_id = 'a0000000-0000-0000-0000-000000000001'),
  90::numeric, 'raw-material valuation = on-hand (30) x unit price (3)');

-- ---- Role guard: a warehouse manager sees no reports ----
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","app_metadata":{"role":"warehouse_manager"}}', true);
select is((select count(*)::int from public.report_sales_daily), 0,
  'non-reporting staff get no sales rows');
select is((select count(*)::int from public.report_item_valuation), 0,
  'non-reporting staff get no valuation rows');

select * from finish();
rollback;
