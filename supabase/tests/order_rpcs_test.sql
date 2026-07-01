-- pgTAP: ordering RPCs (Phase 3) — create_customer_order split + set_order_status.
-- Run locally with `supabase test db`, or in CI with `pg_prove` against a migrated DB.
-- The RPCs are SECURITY DEFINER (run as owner), so they self-enforce authorization from
-- the JWT claims; we drive them by setting `request.jwt.claims` per assertion.
begin;
select plan(18);

-- ---- Fixtures (run as the migration owner; RLS is bypassed for setup) ----
insert into auth.users (id, email, raw_app_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'c1@test.local', '{"role":"customer"}'),
  ('22222222-2222-2222-2222-222222222222', 'c2@test.local', '{"role":"customer"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.local', '{"role":"admin"}'),
  ('44444444-4444-4444-4444-444444444444', 'wh@test.local', '{"role":"warehouse_manager"}'),
  ('55555555-5555-5555-5555-555555555555', 'ft@test.local', '{"role":"factory_manager"}')
on conflict (id) do nothing;

insert into public.branches (id, name, is_active, internal_only) values
  ('b0000000-0000-0000-0000-000000000001', 'Main', true, false),
  ('b0000000-0000-0000-0000-000000000002', 'Internal', true, true)
on conflict (id) do nothing;

insert into public.items (id, sku, name, category, unit_price, is_active, stock_level_required) values
  ('10000000-0000-0000-0000-000000000001', 'W1', 'Rice',  'warehouse', 10, true, false),
  ('10000000-0000-0000-0000-000000000002', 'W2', 'Flour', 'warehouse',  5, true, false),
  ('10000000-0000-0000-0000-000000000003', 'F1', 'Sauce', 'factory',   20, true, true),
  ('10000000-0000-0000-0000-000000000004', 'X1', 'Old',   'warehouse', 99, false, false),
  ('10000000-0000-0000-0000-000000000005', 'U1', 'Uncat',  null,        1, true, false)
on conflict (id) do nothing;

set local role authenticated;

-- ========== create_customer_order: the warehouse/factory split ==========
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}', true);
select lives_ok(
  $$ select public.create_customer_order(
       '[{"item_id":"10000000-0000-0000-0000-000000000001","quantity":2},
         {"item_id":"10000000-0000-0000-0000-000000000002","quantity":1},
         {"item_id":"10000000-0000-0000-0000-000000000003","quantity":3,"stock_level":7}]'::jsonb,
       'b0000000-0000-0000-0000-000000000001', 'rush') $$,
  'customer can place a mixed cart'
);

reset role; -- inspect as the (superuser) test runner, bypassing RLS

select is((select count(*) from public.orders)::int, 2,
  'mixed cart splits into two orders (warehouse + factory)');
select is(
  (select count(*) from public.order_items oi
     join public.orders o on o.id = oi.order_id where o.category = 'warehouse')::int,
  2, 'warehouse order has both warehouse lines');
select is(
  (select stock_level from public.order_items oi
     join public.orders o on o.id = oi.order_id where o.category = 'factory'),
  7::numeric, 'factory line captures the reported stock_level');
select ok(
  (select order_number from public.orders where category = 'warehouse') like 'WORD-%-001',
  'warehouse order number uses the WORD- prefix');
select ok(
  (select order_number from public.orders where category = 'factory') like 'FORD-%-001',
  'factory order number uses the FORD- prefix');
select is((select bool_and(total_amount = 0) from public.orders), true,
  'totals are zero until prices are snapshotted at approval');
select is((select bool_and(unit_price is null) from public.order_items), true,
  'line prices are null until approval');

-- ========== set_order_status: authorization ==========
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}', true);
select throws_ok(
  $$ select public.set_order_status(
       (select id from public.orders where category = 'warehouse'), 'approved') $$,
  '42501', null, 'a customer cannot approve an order');

select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select throws_ok(
  $$ select public.set_order_status(
       (select id from public.orders where category = 'warehouse'), 'approved') $$,
  '42501', null, 'a factory manager cannot approve a warehouse order');

-- ========== set_order_status: approval snapshots prices ==========
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select lives_ok(
  $$ select public.set_order_status(
       (select id from public.orders where category = 'warehouse'), 'approved') $$,
  'the warehouse manager approves the warehouse order');

reset role;
select is(
  (select total_amount from public.orders where category = 'warehouse'),
  25::numeric, 'approval snapshots prices and totals the order (10*2 + 5*1)');
select is(
  (select unit_price from public.order_items
     where item_id = '10000000-0000-0000-0000-000000000001'),
  10::numeric, 'the line price is frozen from the catalog at approval');

-- ========== set_order_status: illegal transition ==========
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select throws_ok(
  $$ select public.set_order_status(
       (select id from public.orders where category = 'factory'), 'completed') $$,
  '22023', null, 'pending -> completed is rejected as an illegal transition');

-- ========== create_customer_order: validation ==========
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}', true);
select throws_ok(
  $$ select public.create_customer_order(
       '[{"item_id":"10000000-0000-0000-0000-000000000004","quantity":1}]'::jsonb) $$,
  '22023', null, 'an inactive item is rejected as unavailable');
select throws_ok(
  $$ select public.create_customer_order(
       '[{"item_id":"10000000-0000-0000-0000-000000000005","quantity":1}]'::jsonb) $$,
  '22023', null, 'an uncategorised item is rejected');

-- ========== next_order_number increments per day ==========
select lives_ok(
  $$ select public.create_customer_order(
       '[{"item_id":"10000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb) $$,
  'a second warehouse order increments the daily counter to 002');
reset role;
select ok(
  exists (select 1 from public.orders where order_number like 'WORD-%-002'),
  'the second warehouse order of the day is numbered 002');

select * from finish();
rollback;
