create table if not exists public.proposal_response_tokens (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  token text not null unique,
  customer_email text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  response_status text,
  response_note text
);

alter table public.proposal_response_tokens enable row level security;

create policy "Organization members can view proposal response tokens"
on public.proposal_response_tokens
for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = proposal_response_tokens.organization_id
  )
);
