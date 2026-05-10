-- TenderFlow initial schema.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Idempotent: safe to re-run.

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Helper: updated_at trigger ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── Admin allowlist ─────────────────────────────────────────
create table if not exists public.admin_emails (
  email text primary key,
  added_at timestamptz not null default now()
);

insert into public.admin_emails (email) values ('kennedynange@gmail.com')
on conflict (email) do nothing;

-- ─── Tenders ─────────────────────────────────────────────────
create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  title text not null,
  issuer text not null,
  country text not null,
  region text,
  source text not null check (source in ('Government','Private','SME')),
  sector text not null,
  ref_no text,
  value numeric(18, 2),
  currency text default 'USD',
  published_at date,
  closes_at date not null,
  summary text,
  scope text,
  eligibility text,
  submission text,
  documents jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenders_status_idx on public.tenders(status);
create index if not exists tenders_closes_at_idx on public.tenders(closes_at);
create index if not exists tenders_published_at_idx on public.tenders(published_at);
create index if not exists tenders_country_idx on public.tenders(country);
create index if not exists tenders_source_idx on public.tenders(source);
create index if not exists tenders_sector_idx on public.tenders(sector);

drop trigger if exists tenders_set_updated_at on public.tenders;
create trigger tenders_set_updated_at
before update on public.tenders
for each row execute function public.set_updated_at();

-- ─── Digest subscribers ──────────────────────────────────────
create table if not exists public.digest_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  sectors text[] not null default '{}',
  countries text[] not null default '{}',
  cadence text not null default 'weekly' check (cadence in ('weekly','daily')),
  skip_empty boolean not null default true,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists digest_subscribers_set_updated_at on public.digest_subscribers;
create trigger digest_subscribers_set_updated_at
before update on public.digest_subscribers
for each row execute function public.set_updated_at();

-- ─── Tender submissions (public form) ────────────────────────
create table if not exists public.tender_submissions (
  id uuid primary key default gen_random_uuid(),
  name text,
  org text,
  email text not null,
  tender_url text,
  notes text,
  status text not null default 'new' check (status in ('new','reviewed','published','rejected')),
  created_at timestamptz not null default now()
);

-- ─── Contact messages ────────────────────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ─── Helper: is_admin() ──────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from public.admin_emails ae
    join auth.users u on lower(u.email) = lower(ae.email)
    where u.id = auth.uid()
  );
$$;
grant execute on function public.is_admin() to authenticated, anon;
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
