-- Lock down allowed MIME types on storage buckets. Defense in depth:
-- the client already filters via accept=, and the API checks magic
-- bytes, but Supabase Storage can also enforce this at the bucket level
-- before the upload even hits our backend.
--
-- Run this in Supabase SQL editor. Idempotent.

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml'
]
where id = 'tender-pdfs';

update storage.buckets
set allowed_mime_types = array[
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'consultant-assets';
