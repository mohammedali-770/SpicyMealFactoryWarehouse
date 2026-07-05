-- pgTAP: orders Row Level Security (Phase 1 Definition of Done).
-- Run locally with `supabase test db`, or in CI with `pg_prove` against a migrated DB.
begin;
select plan(7);

-- ---- Fixtures (run as the migration owner; RLS is bypassed for setup) ----
insert into auth.users (id, email, raw_app_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'cust1@test.local', '{"role":"customer"}'),
  ('22222222-2222-2222-2222-222222222222', 'cust2@test.local', '{"role":"customer"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.local',  '{"role":"admin"}'),
  ('44444444-4444-4444-4444-444444444444', 'acct@test.local',   '{"role":"accountant"}')
on conflict (id) do nothing;

-- handle_new_user() created the matching profiles; seed one order per customer.
insert into public.orders (id, customer_id, status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'pending'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'pending')
on conflict (id) do nothing;

-- Become a logged-in (non-owner) user so RLS is enforced from here on.
set local role authenticated;

-- ---- Customer #1 ----
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}',
  true
);

select is(
  (select count(*) from public.orders where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int,
  1, 'customer can read their own order'
);
select is(
  (select count(*) from public.orders where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::int,
  0, 'customer CANNOT read another customer''s order'
);
select is(
  (select count(*) from public.orders)::int,
  1, 'customer sees only their own orders'
);

-- ---- Accountant (staff) ----
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);
select is(
  (select count(*) from public.orders)::int,
  2, 'accountant (staff) can read all orders'
);

-- ---- Admin ----
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);
select is(
  (select count(*) from public.orders)::int,
  2, 'admin can read all orders'
);

-- ---- Customer insert rules ----
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"role":"customer"}}',
  true
);
select lives_ok(
  $$ insert into public.orders (customer_id, status)
       values ('11111111-1111-1111-1111-111111111111', 'draft') $$,
  'customer can insert an order for themselves'
);
select throws_ok(
  $$ insert into public.orders (customer_id, status)
       values ('22222222-2222-2222-2222-222222222222', 'draft') $$,
  '42501',
  null,
  'customer CANNOT insert an order for another customer'
);

select * from finish();
rollback;
