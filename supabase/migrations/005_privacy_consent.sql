-- Track explicit privacy policy + terms acceptance per user and per
-- consultant profile. Idempotent.
--
-- We do this for two reasons:
--   1. Audit trail in case of a privacy regulator inquiry.
--   2. Easy way to detect users who signed up before a policy revision and
--      need to be prompted to re-accept on next login.

alter table public.user_profiles
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists terms_accepted_at timestamptz;

alter table public.consultants
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists terms_accepted_at timestamptz;
