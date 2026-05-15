-- Duplicate-upload prevention (Layer 1: byte-exact match).
--
-- When an admin uploads a tender PDF, the client computes the SHA-256 of
-- the file bytes and stores it on the tender row. On future uploads, the
-- client looks up `file_hash` before extracting; if a row exists, the
-- admin is offered the choice to open the existing tender or force a new
-- upload. The DB also enforces uniqueness as a defense in depth.
--
-- Notes:
--   - Hash is the first / primary PDF used to create the tender. Multi-
--     document tenders only dedupe on the primary. Layer 2 (ref_no /
--     fuzzy match) will catch the rest.
--   - `file_hash` is nullable so existing rows remain valid and admins
--     can still create tenders by manual entry (no upload).
--   - Unique constraint is "partial" (where not null) so multiple rows
--     without a hash don't collide.
--   - Idempotent; safe to re-run.

alter table public.tenders
  add column if not exists file_hash text;

-- Index for the duplicate lookup query (SELECT ... WHERE file_hash = ?)
create index if not exists tenders_file_hash_idx
  on public.tenders (file_hash)
  where file_hash is not null;

-- Defense in depth: enforce uniqueness at the DB level. Drop and recreate
-- so this migration can re-run cleanly if the column was added before.
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'tenders_file_hash_unique'
  ) then
    create unique index tenders_file_hash_unique
      on public.tenders (file_hash)
      where file_hash is not null;
  end if;
end $$;
