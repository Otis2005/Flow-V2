-- v2 schema additions for TenderFlow.
-- Run AFTER 003_storage.sql. Idempotent (safe to re-run).
--
-- Adds: source taxonomy change (Private -> NGO), bid_security field,
-- issuer_rating, issuer_logo_url, checklist field on tenders;
-- consultants directory; user_profiles for non-admin accounts;
-- watchlist for saved tenders; hire_requests for "do this tender for me".

-- ─── Source taxonomy: replace Private with NGO ──────────────
-- Drop old check constraint, migrate any existing Private rows to NGO,
-- then add the new check constraint.
alter table public.tenders drop constraint if exists tenders_source_check;
update public.tenders set source = 'NGO' where source = 'Private';
alter table public.tenders
  add constraint tenders_source_check
  check (source in ('Government', 'NGO', 'SME'));

-- ─── New columns on tenders ────────────────────────────────
alter table public.tenders
  add column if not exists bid_security text,
  add column if not exists issuer_rating numeric(2,1) check (issuer_rating is null or (issuer_rating >= 1 and issuer_rating <= 5)),
  add column if not exists issuer_logo_url text,
  add column if not exists issuer_logo_path text,
  add column if not exists checklist jsonb default '[]'::jsonb;

-- ─── User profiles (non-admin accounts) ────────────────────
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Watchlist (logged-in users save tenders) ──────────────
create table if not exists public.watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  tender_id uuid not null references public.tenders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tender_id)
);

create index if not exists watchlist_user_idx on public.watchlist(user_id);

-- ─── Consultants ───────────────────────────────────────────
create table if not exists public.consultants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  bio text,
  specialties text[] not null default '{}',
  countries text[] not null default '{}',
  cv_url text,
  cv_path text,
  photo_url text,
  photo_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paused')),
  rating numeric(2,1),
  jobs_completed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consultants_status_idx on public.consultants(status);
create index if not exists consultants_user_idx on public.consultants(user_id);

drop trigger if exists consultants_set_updated_at on public.consultants;
create trigger consultants_set_updated_at
before update on public.consultants
for each row execute function public.set_updated_at();

-- ─── Hire requests ─────────────────────────────────────────
create table if not exists public.hire_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  user_name text,
  user_phone text,
  tender_id uuid references public.tenders(id) on delete set null,
  consultant_id uuid references public.consultants(id) on delete set null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  rating_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hire_requests_user_idx on public.hire_requests(user_id);
create index if not exists hire_requests_consultant_idx on public.hire_requests(consultant_id);
create index if not exists hire_requests_tender_idx on public.hire_requests(tender_id);

drop trigger if exists hire_requests_set_updated_at on public.hire_requests;
create trigger hire_requests_set_updated_at
before update on public.hire_requests
for each row execute function public.set_updated_at();

-- ─── Recompute consultant rating after a hire is rated ─────
create or replace function public.recompute_consultant_rating()
returns trigger language plpgsql security definer as $$
declare
  cid uuid;
  avg_rating numeric;
  job_count int;
begin
  cid := coalesce(new.consultant_id, old.consultant_id);
  if cid is null then return new; end if;
  select avg(rating)::numeric(2,1), count(*) filter (where status = 'completed')
    into avg_rating, job_count
    from public.hire_requests
    where consultant_id = cid and rating is not null;
  update public.consultants
    set rating = avg_rating, jobs_completed = coalesce(job_count, 0)
    where id = cid;
  return new;
end $$;

drop trigger if exists hire_requests_rating on public.hire_requests;
create trigger hire_requests_rating
  after insert or update of rating, status on public.hire_requests
  for each row execute function public.recompute_consultant_rating();

-- ─── RLS for new tables ────────────────────────────────────
alter table public.user_profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.consultants enable row level security;
alter table public.hire_requests enable row level security;

-- user_profiles: own row read/write, admins read all.
drop policy if exists "profiles self read" on public.user_profiles;
create policy "profiles self read" on public.user_profiles
  for select to authenticated using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles self update" on public.user_profiles;
create policy "profiles self update" on public.user_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles self insert" on public.user_profiles;
create policy "profiles self insert" on public.user_profiles
  for insert to authenticated with check (auth.uid() = id);

-- watchlist: user manages their own rows.
drop policy if exists "watchlist self all" on public.watchlist;
create policy "watchlist self all" on public.watchlist
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- consultants:
--   - Public can read APPROVED consultants only
--   - Logged-in user can read their own row regardless of status
--   - Admin can read all and update any
--   - Anyone authenticated can insert (= apply); status defaults to 'pending'
drop policy if exists "consultants public read approved" on public.consultants;
create policy "consultants public read approved" on public.consultants
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "consultants self read" on public.consultants;
create policy "consultants self read" on public.consultants
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "consultants admin all" on public.consultants;
create policy "consultants admin all" on public.consultants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "consultants self insert" on public.consultants;
create policy "consultants self insert" on public.consultants
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "consultants self update" on public.consultants;
create policy "consultants self update" on public.consultants
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- hire_requests:
--   - Anyone (including anon) can create a hire request
--   - The user who made it can read it; the consultant can read theirs; admin reads all
drop policy if exists "hire insert" on public.hire_requests;
create policy "hire insert" on public.hire_requests
  for insert to anon, authenticated with check (true);

drop policy if exists "hire user read" on public.hire_requests;
create policy "hire user read" on public.hire_requests
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.consultants c where c.id = consultant_id and c.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "hire user update" on public.hire_requests;
create policy "hire user update" on public.hire_requests
  for update to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.consultants c where c.id = consultant_id and c.user_id = auth.uid())
    or public.is_admin()
  )
  with check (true);

-- ─── Storage bucket for consultant assets ──────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('consultant-assets', 'consultant-assets', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "consultant-assets public read" on storage.objects;
create policy "consultant-assets public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'consultant-assets');

drop policy if exists "consultant-assets self write" on storage.objects;
create policy "consultant-assets self write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'consultant-assets');

drop policy if exists "consultant-assets self update" on storage.objects;
create policy "consultant-assets self update" on storage.objects
  for update to authenticated
  using (bucket_id = 'consultant-assets')
  with check (bucket_id = 'consultant-assets');
