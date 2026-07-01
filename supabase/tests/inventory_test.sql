-- pgTAP: inventory ledger (Phase 4) — adjust_item_stock + order-completion movements.
-- Run locally with `supabase test db`, or in CI with `pg_prove` against a migrated DB.
-- The mutating paths are SECURITY DEFINER and self-enforce authorization from the JWT
-- claims, which we set per assertion.
begin;
select plan(18);

-- ---- Fixtures (run as the migration owner; RLS is bypassed for setup) ----
insert into auth.users (id, email, raw_app_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'c1@test.local', '{"role":"customer"}'),
  ('44444444-4444-4444-4444-444444444444', 'wh@test.local', '{"role":"warehouse_manager"}'),
  ('55555555-5555-5555-5555-555555555555', 'ft@test.local', '{"role":"factory_manager"}'),
  ('66666666-6666-6666-6666-666666666666', 'ac@test.local', '{"role":"accountant"}')
on conflict (id) do nothing;

insert into public.items (id, sku, name, category, unit_price, is_active, stock_level_required) values
  ('10000000-0000-0000-0000-000000000001', 'W1', 'Rice',  'warehouse', 10, true, false),
  ('10000000-0000-0000-0000-000000000003', 'F1', 'Sauce', 'factory',   20, true, true)
on conflict (id) do nothing;

set local role authenticated;

-- ========== adjust_item_stock: happy path ==========
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select lives_ok(
  $$ select public.adjust_item_stock('10000000-0000-0000-0000-000000000001', 100, 'initial') $$,
  'warehouse manager loads +100 stock');
reset role;
select is(
  (select on_hand from public.item_stock where item_id = '10000000-0000-0000-0000-000000000001'),
  100::numeric, 'item_stock reports 100 on hand');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select lives_ok(
  $$ select public.adjust_item_stock('10000000-0000-0000-0000-000000000001', -30, 'count') $$,
  'a negative adjustment removes stock');
reset role;
select is(
  (select on_hand from public.item_stock where item_id = '10000000-0000-0000-0000-000000000001'),
  70::numeric, 'on hand is 70 after -30');

-- ========== adjust_item_stock: authorization ==========
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}', true);
select throws_ok(
  $$ select public.adjust_item_stock('10000000-0000-0000-0000-000000000001', 5) $$,
  '42501', null, 'a customer cannot adjust stock');
select set_config('request.jwt.claims',
  '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated","app_metadata":{"role":"accountant"}}', true);
select throws_ok(
  $$ select public.adjust_item_stock('10000000-0000-0000-0000-000000000001', 5) $$,
  '42501', null, 'an accountant cannot adjust stock');
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select throws_ok(
  $$ select public.adjust_item_stock('10000000-0000-0000-0000-000000000001', 5) $$,
  '42501', null, 'a factory manager cannot adjust warehouse stock');

-- ========== adjust_item_stock: validation ==========
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select throws_ok(
  $$ select public.adjust_item_stock('10000000-0000-0000-0000-000000000003', 5) $$,
  '22023', null, 'stock adjustments are rejected for factory items');
select throws_ok(
  $$ select public.adjust_item_stock('10000000-0000-0000-0000-000000000001', 0) $$,
  '22023', null, 'a zero adjustment is rejected');

-- ========== order completion posts the fulfillment ledger ==========
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}', true);
select lives_ok(
  $$ select public.create_customer_order(
       '[{"item_id":"10000000-0000-0000-0000-000000000001","quantity":10}]'::jsonb) $$,
  'customer places a warehouse order for 10');
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select lives_ok(
  $$ select public.set_order_status((select id from public.orders where category='warehouse'), 'approved') $$,
  'warehouse manager approves it');
select lives_ok(
  $$ select public.set_order_status((select id from public.orders where category='warehouse'), 'completed') $$,
  'warehouse manager completes it');
reset role;
select is(
  (select quantity from public.stock_movements
     where reason = 'order_fulfillment'
       and order_id = (select id from public.orders where category = 'warehouse')),
  -10::numeric, 'completion posts a -10 fulfillment movement');
select is(
  (select on_hand from public.item_stock where item_id = '10000000-0000-0000-0000-000000000001'),
  60::numeric, 'on hand drops from 70 to 60 after fulfillment');

-- ========== factory completion posts nothing to the warehouse ledger ==========
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}', true);
select lives_ok(
  $$ select public.create_customer_order(
       '[{"item_id":"10000000-0000-0000-0000-000000000003","quantity":3,"stock_level":5}]'::jsonb) $$,
  'customer places a factory order');
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select lives_ok(
  $$ select public.set_order_status((select id from public.orders where category='factory'), 'approved') $$,
  'factory manager approves the factory order');
select lives_ok(
  $$ select public.set_order_status((select id from public.orders where category='factory'), 'completed') $$,
  'factory manager completes the factory order');
reset role;
select is(
  (select count(*) from public.stock_movements
     where order_id = (select id from public.orders where category = 'factory'))::int,
  0, 'factory completion posts no warehouse ledger movement');

select * from finish();
rollback;
