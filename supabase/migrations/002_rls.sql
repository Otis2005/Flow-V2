-- Row-level security policies for TenderFlow.
-- Run AFTER 001_init.sql.

alter table public.tenders enable row level security;
alter table public.digest_subscribers enable row level security;
alter table public.tender_submissions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admin_emails enable row level security;

-- ─── tenders ─────────────────────────────────────────────────
-- Anyone (including anon) can read PUBLISHED tenders.
drop policy if exists "tenders public read" on public.tenders;
create policy "tenders public read" on public.tenders
  for select using (status = 'published');

-- Admins can read everything.
drop policy if exists "tenders admin read all" on public.tenders;
create policy "tenders admin read all" on public.tenders
  for select to authenticated using (public.is_admin());

-- Only admins can insert / update / delete.
drop policy if exists "tenders admin write" on public.tenders;
create policy "tenders admin write" on public.tenders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── digest_subscribers ──────────────────────────────────────
-- Anyone can subscribe (insert).
drop policy if exists "digest insert" on public.digest_subscribers;
create policy "digest insert" on public.digest_subscribers
  for insert to anon, authenticated with check (true);

-- Admins can read / update / delete.
drop policy if exists "digest admin all" on public.digest_subscribers;
create policy "digest admin all" on public.digest_subscribers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Allow upsert flow: subscribers can update their own row matched by email
-- (used by the unsubscribe flow). Restrict columns via app logic.
drop policy if exists "digest self upsert" on public.digest_subscribers;
create policy "digest self upsert" on public.digest_subscribers
  for update to anon, authenticated using (true) with check (true);

-- ─── tender_submissions ──────────────────────────────────────
drop policy if exists "submissions insert" on public.tender_submissions;
create policy "submissions insert" on public.tender_submissions
  for insert to anon, authenticated with check (true);

drop policy if exists "submissions admin read" on public.tender_submissions;
create policy "submissions admin read" on public.tender_submissions
  for select to authenticated using (public.is_admin());

drop policy if exists "submissions admin update" on public.tender_submissions;
create policy "submissions admin update" on public.tender_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── contact_messages ────────────────────────────────────────
drop policy if exists "contact insert" on public.contact_messages;
create policy "contact insert" on public.contact_messages
  for insert to anon, authenticated with check (true);

drop policy if exists "contact admin read" on public.contact_messages;
create policy "contact admin read" on public.contact_messages
  for select to authenticated using (public.is_admin());

-- ─── admin_emails ────────────────────────────────────────────
-- Read by authenticated users (so the client can verify), write only via SQL.
drop policy if exists "admin_emails read auth" on public.admin_emails;
create policy "admin_emails read auth" on public.admin_emails
  for select to authenticated using (true);
