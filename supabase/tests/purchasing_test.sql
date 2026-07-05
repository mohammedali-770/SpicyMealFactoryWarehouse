-- pgTAP: purchasing (Phase 5) — create_purchase_order + set_purchase_order_status.
-- Covers the WPO/RPO split of authority, cost capture, the transition gate, and receipts
-- posting into the item (stock_movements) and raw-material (raw_material_movements) ledgers.
-- Run locally with `supabase test db`, or in CI with `pg_prove` against a migrated DB.
begin;
select plan(17);

-- ---- Fixtures (run as the migration owner; RLS is bypassed for setup) ----
insert into auth.users (id, email, raw_app_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'c1@test.local', '{"role":"customer"}'),
  ('44444444-4444-4444-4444-444444444444', 'wh@test.local', '{"role":"warehouse_manager"}'),
  ('55555555-5555-5555-5555-555555555555', 'ft@test.local', '{"role":"factory_manager"}')
on conflict (id) do nothing;

insert into public.suppliers (id, name, is_active) values
  ('c0000000-0000-0000-0000-000000000001', 'S1', true),
  ('c0000000-0000-0000-0000-000000000002', 'S2', false)
on conflict (id) do nothing;

insert into public.items (id, sku, name, category, unit_price, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'W1', 'Rice',  'warehouse', 10, true),
  ('10000000-0000-0000-0000-000000000002', 'W2', 'Flour', 'warehouse',  5, true),
  ('10000000-0000-0000-0000-000000000003', 'F1', 'Sauce', 'factory',   20, true)
on conflict (id) do nothing;

insert into public.raw_materials (id, name, unit_price, is_active) values
  ('a0000000-0000-0000-0000-000000000001', 'Salt', 3, true)
on conflict (id) do nothing;

set local role authenticated;

-- ========== create_purchase_order: warehouse PO ==========
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select lives_ok(
  $$ select public.create_purchase_order('warehouse', 'c0000000-0000-0000-0000-000000000001',
       '[{"ref_id":"10000000-0000-0000-0000-000000000001","quantity":50},
         {"ref_id":"10000000-0000-0000-0000-000000000002","quantity":10,"unit_price":7}]'::jsonb) $$,
  'warehouse manager creates a WPO');
reset role;
select is((select total_amount from public.purchase_orders where kind = 'warehouse'),
  570::numeric, 'total captures cost at creation (50*10 + 10*7)');
select is(
  (select unit_price from public.purchase_order_items
     where item_id = '10000000-0000-0000-0000-000000000001'),
  10::numeric, 'unit price defaults from the item when omitted');
select is(
  (select unit_price from public.purchase_order_items
     where item_id = '10000000-0000-0000-0000-000000000002'),
  7::numeric, 'explicit unit price is used when supplied');

-- ========== create_purchase_order: authorization + validation ==========
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select throws_ok(
  $$ select public.create_purchase_order('warehouse', 'c0000000-0000-0000-0000-000000000001',
       '[{"ref_id":"10000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb) $$,
  '42501', null, 'a factory manager cannot create a warehouse PO');
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select throws_ok(
  $$ select public.create_purchase_order('raw_material', 'c0000000-0000-0000-0000-000000000001',
       '[{"ref_id":"a0000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb) $$,
  '42501', null, 'a warehouse manager cannot create a raw-material PO');
select throws_ok(
  $$ select public.create_purchase_order('warehouse', 'c0000000-0000-0000-0000-000000000002',
       '[{"ref_id":"10000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb) $$,
  '22023', null, 'an inactive supplier is rejected');
select throws_ok(
  $$ select public.create_purchase_order('warehouse', 'c0000000-0000-0000-0000-000000000001',
       '[{"ref_id":"10000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb) $$,
  '22023', null, 'a factory item cannot go on a warehouse PO');

-- ========== set_purchase_order_status: gate ==========
select throws_ok(
  $$ select public.set_purchase_order_status(
       (select id from public.purchase_orders where kind='warehouse'), 'received') $$,
  '22023', null, 'pending -> received is rejected (must be approved first)');
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select throws_ok(
  $$ select public.set_purchase_order_status(
       (select id from public.purchase_orders where kind='warehouse'), 'approved') $$,
  '42501', null, 'a factory manager cannot approve a warehouse PO');

-- ========== receive WPO -> posts the item ledger ==========
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select lives_ok(
  $$ select public.set_purchase_order_status(
       (select id from public.purchase_orders where kind='warehouse'), 'approved') $$,
  'warehouse manager approves the WPO');
select lives_ok(
  $$ select public.set_purchase_order_status(
       (select id from public.purchase_orders where kind='warehouse'), 'received') $$,
  'warehouse manager receives the WPO');
reset role;
select is(
  (select count(*)::int from public.stock_movements
     where reason = 'purchase_receipt'
       and purchase_order_id = (select id from public.purchase_orders where kind='warehouse')),
  2, 'receiving posts one receipt movement per line');
select is(
  (select on_hand from public.item_stock where item_id = '10000000-0000-0000-0000-000000000001'),
  50::numeric, 'received quantity lands in item on-hand');

-- ========== RPO lifecycle -> posts the raw-material ledger ==========
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select lives_ok(
  $$ select public.set_purchase_order_status(
       (select public.create_purchase_order('raw_material', 'c0000000-0000-0000-0000-000000000001',
          '[{"ref_id":"a0000000-0000-0000-0000-000000000001","quantity":100}]'::jsonb) ->> 'id')::uuid,
       'approved') $$,
  'factory manager creates and approves an RPO');
select lives_ok(
  $$ select public.set_purchase_order_status(
       (select id from public.purchase_orders where kind='raw_material'), 'received') $$,
  'factory manager receives the RPO');
reset role;
select is(
  (select on_hand from public.raw_material_stock
     where raw_material_id = 'a0000000-0000-0000-0000-000000000001'),
  100::numeric, 'received raw material lands in raw-material on-hand');

select * from finish();
rollback;
