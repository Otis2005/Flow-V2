-- Track how many times a tender's documents have been downloaded.
-- We surface this on the public UI as "N Bids" (Kennedy's framing,
-- creates a soft competition signal for prospective bidders).
--
-- Run this in Supabase SQL editor. Idempotent.

-- Counter column (defaults to 0 so existing rows are sane).
alter table public.tenders
  add column if not exists download_count int not null default 0;

-- RPC that atomically increments the counter for a tender. Marked
-- SECURITY DEFINER so it can update the row regardless of who calls
-- it (anon or authenticated). Returns the new count so the client can
-- optimistically render it without a round-trip read.
create or replace function public.increment_tender_download(p_tender_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update public.tenders
    set download_count = download_count + 1
    where id = p_tender_id and status = 'published'
    returning download_count into new_count;
  return coalesce(new_count, 0);
end;
$$;

-- Allow any caller (anonymous browsing visitors included) to invoke it.
-- The function itself only touches published tenders so this is safe.
grant execute on function public.increment_tender_download(uuid) to anon, authenticated;
