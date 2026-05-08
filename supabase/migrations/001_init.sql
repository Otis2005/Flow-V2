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
