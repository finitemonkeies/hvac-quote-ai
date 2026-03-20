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
  vendor_strategy text,
  vendor_snapshot jsonb not null default '[]'::jsonb,
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

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  integration_mode text not null default 'mock',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  brand text not null,
  model_family text not null,
  quote_level text not null check (quote_level in ('good', 'better', 'best')),
  system_type text not null default 'Split system',
  equipment_factor numeric(8,4) not null default 1,
  lead_time_days integer not null default 3,
  availability text not null default 'in-stock',
  rebate_amount numeric(10,2) not null default 0,
  notes text not null default '',
  active boolean not null default true
);

create table if not exists public.vendor_quote_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  customer_name text,
  system_type text not null,
  job_type text not null,
  request_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_quote_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.vendor_quote_requests (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  quote_level text not null check (quote_level in ('good', 'better', 'best')),
  package_label text not null,
  brand text not null,
  model_family text not null,
  estimated_equipment_cost numeric(10,2) not null,
  estimated_installed_price numeric(10,2) not null,
  lead_time_days integer not null default 3,
  availability text not null default 'in-stock',
  rebate_amount numeric(10,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
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

alter table public.estimate_options
  add column if not exists vendor_strategy text;

alter table public.estimate_options
  add column if not exists vendor_snapshot jsonb not null default '[]'::jsonb;

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_options enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.estimate_approvals enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_products enable row level security;
alter table public.vendor_quote_requests enable row level security;
alter table public.vendor_quote_items enable row level security;

drop policy if exists "Users can view own organization" on public.organizations;
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

drop policy if exists "Managers can manage own organization" on public.organizations;
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

drop policy if exists "Users can manage own profile" on public.users;
create policy "Users can manage own profile"
on public.users
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can manage organization estimates" on public.estimates;
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

drop policy if exists "Users can manage estimate options for their estimates" on public.estimate_options;
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

drop policy if exists "Organization members can view pricing rules" on public.pricing_rules;
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

drop policy if exists "Managers can manage organization pricing rules" on public.pricing_rules;
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

drop policy if exists "Organization members can manage estimate approvals" on public.estimate_approvals;
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

drop policy if exists "Authenticated users can view vendors" on public.vendors;
create policy "Authenticated users can view vendors"
on public.vendors
for select
using (auth.uid() is not null);

drop policy if exists "Authenticated users can view vendor products" on public.vendor_products;
create policy "Authenticated users can view vendor products"
on public.vendor_products
for select
using (auth.uid() is not null);

drop policy if exists "Managers can manage vendor catalog" on public.vendors;
create policy "Managers can manage vendor catalog"
on public.vendors
for all
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'manager'
  )
);

drop policy if exists "Managers can manage vendor products" on public.vendor_products;
create policy "Managers can manage vendor products"
on public.vendor_products
for all
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'manager'
  )
);

drop policy if exists "Organization members can view vendor quote requests" on public.vendor_quote_requests;
create policy "Organization members can view vendor quote requests"
on public.vendor_quote_requests
for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = vendor_quote_requests.organization_id
  )
);

drop policy if exists "Organization members can create vendor quote requests" on public.vendor_quote_requests;
create policy "Organization members can create vendor quote requests"
on public.vendor_quote_requests
for insert
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.organization_id = vendor_quote_requests.organization_id
  )
);

drop policy if exists "Organization members can view vendor quote items" on public.vendor_quote_items;
create policy "Organization members can view vendor quote items"
on public.vendor_quote_items
for select
using (
  exists (
    select 1
    from public.vendor_quote_requests
    join public.users on users.organization_id = vendor_quote_requests.organization_id
    where vendor_quote_requests.id = vendor_quote_items.request_id
      and users.id = auth.uid()
  )
);

insert into public.vendors (slug, name, integration_mode, active)
values
  ('supply-pro', 'Supply Pro Distribution', 'mock', true),
  ('comfort-warehouse', 'Comfort Warehouse', 'mock', true),
  ('premier-hvac', 'Premier HVAC Supply', 'mock', true)
on conflict (slug) do update
set
  name = excluded.name,
  integration_mode = excluded.integration_mode,
  active = excluded.active;

insert into public.vendor_products (vendor_id, brand, model_family, quote_level, system_type, equipment_factor, lead_time_days, availability, rebate_amount, notes, active)
select v.id, seed.brand, seed.model_family, seed.quote_level, seed.system_type, seed.equipment_factor, seed.lead_time_days, seed.availability, seed.rebate_amount, seed.notes, true
from public.vendors v
join (
  values
    ('supply-pro', 'RunTru', 'Builder Series Split', 'good', 'Split system', 0.96, 2, 'in-stock', 0, 'Fast-turn regional stock with reliable standard replacements.'),
    ('supply-pro', 'RunTru', 'Performance Variable Fan', 'better', 'Split system', 0.96, 2, 'in-stock', 250, 'Fast-turn regional stock with reliable standard replacements.'),
    ('supply-pro', 'RunTru', 'Comfort Inverter Plus', 'best', 'Split system', 0.96, 2, 'in-stock', 450, 'Fast-turn regional stock with reliable standard replacements.'),
    ('comfort-warehouse', 'Goodman', 'GS Split Essentials', 'good', 'Split system', 1.01, 4, 'limited', 100, 'Strong rebate posture with homeowner-friendly upgrade packages.'),
    ('comfort-warehouse', 'Goodman', 'Two-Stage Comfort Pairing', 'better', 'Split system', 1.01, 4, 'limited', 300, 'Strong rebate posture with homeowner-friendly upgrade packages.'),
    ('comfort-warehouse', 'Goodman', 'Inverter QuietDrive', 'best', 'Split system', 1.01, 4, 'limited', 500, 'Strong rebate posture with homeowner-friendly upgrade packages.'),
    ('premier-hvac', 'Carrier', 'Comfort Standard Match', 'good', 'Split system', 1.08, 6, 'special-order', 0, 'Premium brand path for homeowners prioritizing perceived value and quiet operation.'),
    ('premier-hvac', 'Carrier', 'Performance Hybrid Match', 'better', 'Split system', 1.08, 6, 'special-order', 200, 'Premium brand path for homeowners prioritizing perceived value and quiet operation.'),
    ('premier-hvac', 'Carrier', 'Infinity Variable Platform', 'best', 'Split system', 1.08, 6, 'special-order', 350, 'Premium brand path for homeowners prioritizing perceived value and quiet operation.')
) as seed(slug, brand, model_family, quote_level, system_type, equipment_factor, lead_time_days, availability, rebate_amount, notes)
on v.slug = seed.slug
where not exists (
  select 1
  from public.vendor_products existing
  where existing.vendor_id = v.id
    and existing.quote_level = seed.quote_level
    and existing.model_family = seed.model_family
);
