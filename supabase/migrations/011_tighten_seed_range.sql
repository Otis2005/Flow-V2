-- Tighten the download_count seed range from 8-35 down to 5-25.
--
-- Why: 8-35 read as slightly too eager for a fresh marketplace. 5-25
-- is more credible while still avoiding the "ghost town" effect. The
-- Interest pill UI label is also being removed in the same change, so
-- the visible number stands alone, making lower values feel natural.
--
-- Behaviour:
--   - Re-seed every published row currently above 25 down into 5-25
--   - Leave rows already in 5-25 alone (no need to randomize them again)
--   - Leave organic (real downloads) below 5 alone
--   - Update trigger so new rows get the new range
--
-- Idempotent: re-running this is safe.

-- ─── Clamp existing high values into the new range ────────────────
update public.tenders
   set download_count = 5 + floor(random() * 21)::int
 where status = 'published'
   and download_count > 25;

-- ─── Update the trigger function with the new formula ─────────────
create or replace function public.seed_tender_download_count()
returns trigger language plpgsql as $$
begin
  -- Only seed if the row is becoming 'published' for the first time
  -- and the count is still 0.
  if new.status = 'published'
     and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'published')
     and coalesce(new.download_count, 0) = 0 then
    new.download_count := 5 + floor(random() * 21)::int;
  end if;
  return new;
end $$;

-- Trigger wiring itself is unchanged from migration 010.
