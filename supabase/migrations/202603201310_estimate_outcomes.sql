alter table public.estimates
  add column if not exists outcome_status text default 'draft';

alter table public.estimates
  add column if not exists outcome_note text;
