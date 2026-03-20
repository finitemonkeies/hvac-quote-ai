create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  owner_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  full_name text,
  company_name text,
  phone text,
  role text not null default 'manager',
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists role text not null default 'manager';

alter table public.users
  add column if not exists organization_id uuid references public.organizations (id) on delete set null;

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete cascade,
  customer_name text,
  property_address text,
  job_type text not null,
  system_type text not null,
  project_scope text not null,
  notes text,
  selected_option_id text,
  approval_status text default 'not-required',
  approval_note text,
  delivery_method text,
  proposal_company_name text not null,
  proposal_company_email text,
  proposal_company_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.estimate_options (
  id bigint generated always as identity primary key,
  estimate_id uuid not null references public.estimates (id) on delete cascade,
  level text not null check (level in ('good', 'better', 'best')),
  title text not null,
  system_name text not null,
  description text not null,
  features jsonb not null default '[]'::jsonb,
  estimated_price numeric(10,2) not null,
  price_range_low numeric(10,2) not null,
  price_range_high numeric(10,2) not null,
  is_recommended boolean not null default false,
  hard_cost numeric(10,2) not null default 0,
  gross_margin_percent numeric(6,2) not null default 0,
  policy_status text not null default 'approved',
  policy_reason text,
  estimated_monthly_payment numeric(10,2),
  unique (estimate_id, level)
);

create table if not exists public.pricing_rules (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  labor_rate_per_hour numeric(10,2) not null default 125,
  margin_floor_percent numeric(6,2) not null default 35,
  max_discount_percent numeric(6,2) not null default 10,
  default_financing_apr numeric(6,2) not null default 9.99,
  thermostat_upgrade_price numeric(10,2) not null default 325,
  iaq_bundle_price numeric(10,2) not null default 1350,
  surge_protection_price numeric(10,2) not null default 425,
  maintenance_plan_price numeric(10,2) not null default 290,
  extended_labor_warranty_price numeric(10,2) not null default 1150,
  updated_at timestamptz not null default now()
);

create table if not exists public.estimate_approvals (
  estimate_id uuid primary key references public.estimates (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  approval_status text not null default 'pending',
  approval_note text,
  updated_at timestamptz not null default now()
);

alter table public.estimates
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.estimate_approvals
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.estimates
  add column if not exists approval_status text default 'not-required';

alter table public.estimates
  add column if not exists approval_note text;

alter table public.estimate_options
  add column if not exists hard_cost numeric(10,2) not null default 0;

alter table public.estimate_options
  add column if not exists gross_margin_percent numeric(6,2) not null default 0;

alter table public.estimate_options
  add column if not exists policy_status text not null default 'approved';

alter table public.estimate_options
  add column if not exists policy_reason text;

alter table public.estimate_options
  add column if not exists estimated_monthly_payment numeric(10,2);

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_options enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.estimate_approvals enable row level security;

create policy "Users can view own organization"
on public.organizations
for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = organizations.id
  )
);

create policy "Managers can manage own organization"
on public.organizations
for all
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = organizations.id
      and users.role = 'manager'
  )
)
with check (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = organizations.id
      and users.role = 'manager'
  )
);

create policy "Users can manage own profile"
on public.users
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can manage organization estimates"
on public.estimates
for all
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = estimates.organization_id
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = estimates.organization_id
  )
);

create policy "Users can manage estimate options for their estimates"
on public.estimate_options
for all
using (
  exists (
    select 1
    from public.estimates
    join public.users on users.organization_id = estimates.organization_id
    where estimates.id = estimate_options.estimate_id
      and users.id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.estimates
    join public.users on users.organization_id = estimates.organization_id
    where estimates.id = estimate_options.estimate_id
      and users.id = auth.uid()
  )
);

create policy "Organization members can view pricing rules"
on public.pricing_rules
for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = pricing_rules.organization_id
  )
);

create policy "Managers can manage organization pricing rules"
on public.pricing_rules
for all
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = pricing_rules.organization_id
      and users.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = pricing_rules.organization_id
      and users.role = 'manager'
  )
);

create policy "Organization members can manage estimate approvals"
on public.estimate_approvals
for all
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = estimate_approvals.organization_id
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = estimate_approvals.organization_id
  )
);
