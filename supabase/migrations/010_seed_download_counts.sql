-- Seed download counts so public tender cards don't read as a ghost town.
--
-- Two parts:
--   1. One-time backfill of existing tenders whose count is still 0.
--   2. BEFORE trigger that auto-seeds the count the first time a tender
--      is set to 'published' (whether on insert or on a draft -> published
--      status update). Drafts stay at 0 so they don't look engaged before
--      they're public.
--
-- Real downloads keep incrementing the count via the existing
-- increment_tender_download() RPC. The seed is just a baseline so the
-- "N Interest" pill appears the moment a tender goes live.
--
-- Range: 8-35 inclusive. Moderate baseline appropriate for a fresh
-- marketplace. Edit the formula in both places below to widen or narrow.
--
-- Idempotent: re-running this is safe. The UPDATE only touches rows
-- still at 0; the trigger function CREATE OR REPLACEs cleanly.

-- ─── One-time backfill of existing published tenders ──────────────
update public.tenders
   set download_count = 8 + floor(random() * 28)::int
 where status = 'published'
   and coalesce(download_count, 0) = 0;

-- ─── Trigger function: seed on publish ────────────────────────────
create or replace function public.seed_tender_download_count()
returns trigger language plpgsql as $$
begin
  -- Only seed if the row is becoming 'published' and the count hasn't
  -- already been set (by a manual admin edit, an organic increment, or
  -- an earlier publish/unpublish cycle that already seeded it).
  if new.status = 'published'
     and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'published')
     and coalesce(new.download_count, 0) = 0 then
    new.download_count := 8 + floor(random() * 28)::int;
  end if;
  return new;
end $$;

-- ─── Wire up the trigger ──────────────────────────────────────────
drop trigger if exists tenders_seed_download_count on public.tenders;
create trigger tenders_seed_download_count
before insert or update of status on public.tenders
for each row execute function public.seed_tender_download_count();
