-- Issuer logo memory: a small lookup table that remembers the logo
-- previously attached to a given issuing organization. When the admin
-- types or extracts an issuer name in AdminUpload, the client looks
-- up this table and auto-fills the logo if there's a match.
--
-- Why a separate table instead of querying past tenders directly:
--   - Cleaner contract: one canonical mapping per issuer, no scanning
--   - Cheap upsert on save, cheap exact-match read on issuer change
--   - Decoupled from the tenders table — survives a tender being
--     deleted (logo still remembered for next time)
--
-- Idempotent: safe to re-run.

create table if not exists public.issuer_logos (
  issuer_name text primary key,
  logo_url text not null,
  logo_path text,
  updated_at timestamptz not null default now()
);

-- Index on lowercase name so the client can do case-insensitive
-- lookups (admin types "Ministry of Health" vs "ministry of health").
-- We intentionally do NOT lowercase the primary key itself; we keep
-- the original casing from whoever first added it, and use this
-- functional index for the lookup query.
create index if not exists issuer_logos_lower_name_idx
  on public.issuer_logos (lower(issuer_name));

-- updated_at refresh on upsert
drop trigger if exists issuer_logos_set_updated_at on public.issuer_logos;
create trigger issuer_logos_set_updated_at
  before update on public.issuer_logos
  for each row execute function public.set_updated_at();

-- RLS: admins can read + write; anonymous users have no business here.
alter table public.issuer_logos enable row level security;

drop policy if exists "issuer_logos_admin_read" on public.issuer_logos;
create policy "issuer_logos_admin_read" on public.issuer_logos
  for select to authenticated
  using (public.is_admin());

drop policy if exists "issuer_logos_admin_write" on public.issuer_logos;
create policy "issuer_logos_admin_write" on public.issuer_logos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Backfill from existing tenders ───────────────────────────────
-- For every tender that already has both an issuer and a logo set,
-- insert into issuer_logos. ON CONFLICT keeps whichever entry was
-- most recently updated (latest tender's logo wins).
insert into public.issuer_logos (issuer_name, logo_url, logo_path)
select distinct on (issuer)
  issuer,
  issuer_logo_url,
  issuer_logo_path
from public.tenders
where issuer is not null
  and issuer_logo_url is not null
  and issuer_logo_url <> ''
order by issuer, updated_at desc nulls last
on conflict (issuer_name) do update
  set logo_url = excluded.logo_url,
      logo_path = excluded.logo_path,
      updated_at = now();
