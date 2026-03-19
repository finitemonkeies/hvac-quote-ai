create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  customer_name text,
  property_address text,
  job_type text not null,
  system_type text not null,
  project_scope text not null,
  notes text,
  selected_option_id text,
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
  unique (estimate_id, level)
);

alter table public.users enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_options enable row level security;

create policy "Users can manage own profile"
on public.users
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can manage own estimates"
on public.estimates
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage estimate options for their estimates"
on public.estimate_options
for all
using (
  exists (
    select 1
    from public.estimates
    where estimates.id = estimate_options.estimate_id
      and estimates.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.estimates
    where estimates.id = estimate_options.estimate_id
      and estimates.user_id = auth.uid()
  )
);
