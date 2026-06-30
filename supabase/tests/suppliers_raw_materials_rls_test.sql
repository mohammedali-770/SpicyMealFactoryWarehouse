-- pgTAP: suppliers + raw_materials RLS role matrix.
begin;
select plan(8);

set local role authenticated;

-- warehouse_manager: manages suppliers, but NOT raw_materials.
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"role":"warehouse_manager"}}',
  true
);
select lives_ok(
  $$ insert into public.suppliers (name) values ('WH Supplier') $$,
  'warehouse_manager can insert a supplier'
);
select throws_ok(
  $$ insert into public.raw_materials (name) values ('rm-by-wh') $$,
  '42501',
  null,
  'warehouse_manager CANNOT insert a raw material'
);

-- factory_manager: manages raw_materials and suppliers.
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"role":"factory_manager"}}',
  true
);
select lives_ok(
  $$ insert into public.raw_materials (name) values ('FM raw') $$,
  'factory_manager can insert a raw material'
);
select lives_ok(
  $$ insert into public.suppliers (name) values ('FM Supplier') $$,
  'factory_manager can insert a supplier'
);

-- customer: read-only.
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"role":"customer"}}',
  true
);
select throws_ok(
  $$ insert into public.suppliers (name) values ('by-customer') $$,
  '42501',
  null,
  'customer CANNOT insert a supplier'
);
select ok((select count(*) from public.suppliers) >= 1, 'customer can read suppliers');

-- accountant: read-only on raw_materials.
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);
select throws_ok(
  $$ insert into public.raw_materials (name) values ('by-accountant') $$,
  '42501',
  null,
  'accountant CANNOT insert a raw material'
);
select ok((select count(*) from public.raw_materials) >= 1, 'accountant can read raw materials');

select * from finish();
rollback;
