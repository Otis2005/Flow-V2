-- Storage bucket for tender PDFs and supporting documents.
-- Run AFTER 002_rls.sql. Idempotent.

insert into storage.buckets (id, name, public, file_size_limit)
values ('tender-pdfs', 'tender-pdfs', true, 26214400)
on conflict (id) do update set public = true, file_size_limit = 26214400;

-- Public read of objects (so download links work without auth).
drop policy if exists "tender-pdfs public read" on storage.objects;
create policy "tender-pdfs public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'tender-pdfs');

-- Only admins can upload / delete.
drop policy if exists "tender-pdfs admin write" on storage.objects;
create policy "tender-pdfs admin write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tender-pdfs' and public.is_admin());

drop policy if exists "tender-pdfs admin update" on storage.objects;
create policy "tender-pdfs admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'tender-pdfs' and public.is_admin())
  with check (bucket_id = 'tender-pdfs' and public.is_admin());

drop policy if exists "tender-pdfs admin delete" on storage.objects;
create policy "tender-pdfs admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tender-pdfs' and public.is_admin());
