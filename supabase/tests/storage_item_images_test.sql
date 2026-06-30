-- pgTAP: item-images storage bucket + object policies.
begin;
select plan(3);

select is(
  (select public from storage.buckets where id = 'item-images'),
  true,
  'item-images bucket exists and is public'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'item_images_public_read'
  ),
  'public-read policy exists on storage.objects'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'item_images_admin_write'
  ),
  'admin-write policy exists on storage.objects'
);

select * from finish();
rollback;
