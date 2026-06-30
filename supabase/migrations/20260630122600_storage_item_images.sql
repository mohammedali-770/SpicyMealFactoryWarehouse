-- Concern: item-images storage bucket + object policies.
-- SQL migration (not just config.toml) so it is reset- and deploy-safe.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read of objects in this bucket.
drop policy if exists item_images_public_read on storage.objects;
create policy item_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'item-images');

-- Only admins may write/replace/delete item images (master data is admin-managed).
drop policy if exists item_images_admin_write on storage.objects;
create policy item_images_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'item-images' and public.jwt_role() = 'admin')
  with check (bucket_id = 'item-images' and public.jwt_role() = 'admin');
