-- AGPO support for tenders. Idempotent.
--
-- AGPO = Access to Government Procurement Opportunities, the Kenyan
-- 30% reservation programme for businesses owned by youth, women, or
-- persons with disabilities. Other countries have similar programmes.
--
-- We store the category as a free-form text column rather than an enum
-- so admins can use it for similar reservation programmes outside Kenya
-- without needing another migration.

alter table public.tenders
  add column if not exists agpo_category text;

-- Partial index: only rows where agpo_category is set get indexed.
-- AGPO tenders are a small fraction of total tenders, so this is cheap.
create index if not exists tenders_agpo_idx
  on public.tenders(agpo_category)
  where agpo_category is not null;
