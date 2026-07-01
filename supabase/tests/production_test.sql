-- pgTAP: production batches (Phase 6) — create_production_batch + set_batch_status.
-- Covers authority, validation, the transition gate, and completion posting consumption
-- into the raw-material ledger and production into the item ledger.
-- Run locally with `supabase test db`, or in CI with `pg_prove` against a migrated DB.
begin;
select plan(15);

-- ---- Fixtures (run as the migration owner; RLS is bypassed for setup) ----
insert into auth.users (id, email, raw_app_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'c1@test.local', '{"role":"customer"}'),
  ('44444444-4444-4444-4444-444444444444', 'wh@test.local', '{"role":"warehouse_manager"}'),
  ('55555555-5555-5555-5555-555555555555', 'ft@test.local', '{"role":"factory_manager"}')
on conflict (id) do nothing;

insert into public.items (id, sku, name, category, unit_price, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'W1', 'Meal',    'warehouse', 10, true),
  ('10000000-0000-0000-0000-000000000003', 'F1', 'Factory', 'factory',   20, true)
on conflict (id) do nothing;

insert into public.raw_materials (id, name, unit_price, is_active) values
  ('a0000000-0000-0000-0000-000000000001', 'Salt', 3, true)
on conflict (id) do nothing;

-- Seed 500 units of raw-material stock so consumption is visible.
insert into public.raw_material_movements (raw_material_id, quantity, reason)
values ('a0000000-0000-0000-0000-000000000001', 500, 'adjustment');

set local role authenticated;

-- ========== create_production_batch ==========
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select lives_ok(
  $$ select public.create_production_batch(
       '[{"ref_id":"a0000000-0000-0000-0000-000000000001","quantity":200}]'::jsonb,
       '[{"ref_id":"10000000-0000-0000-0000-000000000001","quantity":40}]'::jsonb, 'batch A') $$,
  'factory manager plans a batch');
reset role;
select ok(
  (select batch_number from public.production_batches) like 'BATCH-%-001',
  'batch gets a BATCH- number');
select is((select status from public.production_batches), 'pending', 'a new batch is pending');
select is((select count(*)::int from public.batch_inputs), 1, 'inputs are recorded');
select is(
  (select on_hand from public.raw_material_stock
     where raw_material_id = 'a0000000-0000-0000-0000-000000000001'),
  500::numeric, 'nothing is consumed while the batch is pending');

-- ========== authorization + validation ==========
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}', true);
select throws_ok(
  $$ select public.create_production_batch(
       '[{"ref_id":"a0000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb,
       '[{"ref_id":"10000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb) $$,
  '42501', null, 'a customer cannot run production');
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}', true);
select throws_ok(
  $$ select public.set_batch_status((select id from public.production_batches), 'in_progress') $$,
  '42501', null, 'a warehouse manager cannot run production');
select set_config('request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","app_metadata":{"role":"factory_manager"}}', true);
select throws_ok(
  $$ select public.set_batch_status((select id from public.production_batches), 'completed') $$,
  '22023', null, 'pending -> completed is rejected (must start first)');
select throws_ok(
  $$ select public.create_production_batch(
       '[]'::jsonb, '[{"ref_id":"10000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb) $$,
  '22023', null, 'a batch with no inputs is rejected');
select throws_ok(
  $$ select public.create_production_batch(
       '[{"ref_id":"a0000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb,
       '[{"ref_id":"10000000-0000-0000-0000-000000000003","quantity":1}]'::jsonb) $$,
  '22023', null, 'a factory item cannot be a batch output');

-- ========== start + complete -> posts both ledgers ==========
select lives_ok(
  $$ select public.set_batch_status((select id from public.production_batches), 'in_progress') $$,
  'factory manager starts the batch');
select lives_ok(
  $$ select public.set_batch_status((select id from public.production_batches), 'completed') $$,
  'factory manager completes the batch');
reset role;
select is(
  (select on_hand from public.raw_material_stock
     where raw_material_id = 'a0000000-0000-0000-0000-000000000001'),
  300::numeric, 'completion consumes 200 raw material (500 -> 300)');
select is(
  (select on_hand from public.item_stock where item_id = '10000000-0000-0000-0000-000000000001'),
  40::numeric, 'completion produces 40 warehouse items');
select is(
  (select reason from public.stock_movements
     where production_batch_id = (select id from public.production_batches)),
  'production', 'the output movement is tagged as production');

select * from finish();
rollback;
