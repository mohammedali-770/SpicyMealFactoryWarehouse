-- pgTAP: items soft-delete + category constraint + order_index default.
begin;
select plan(4);

insert into public.items (id, name, is_active)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'SoftItem', true)
on conflict (id) do nothing;

update public.items set is_active = false
where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select is(
  (select is_active from public.items where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
  false,
  'item is deactivated (soft delete)'
);
select is(
  (select count(*) from public.items where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')::int,
  1,
  'soft-deleted item still exists (not hard-deleted)'
);

select throws_ok(
  $$ insert into public.items (name, category) values ('Bad', 'nope') $$,
  '23514',
  null,
  'category CHECK rejects an invalid value'
);

insert into public.items (id, name)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'NoIndex')
on conflict (id) do nothing;
select is(
  (select order_index from public.items where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  0,
  'order_index defaults to 0'
);

select * from finish();
rollback;
