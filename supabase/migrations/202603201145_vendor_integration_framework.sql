alter table public.vendors
  add column if not exists priority integer not null default 100;

alter table public.vendors
  add column if not exists config jsonb not null default '{}'::jsonb;

alter table public.vendors
  add column if not exists connection_status text not null default 'needs-setup';

alter table public.vendors
  add column if not exists last_sync_at timestamptz;

alter table public.vendors
  add column if not exists last_error text;

update public.vendors
set
  connection_status = case
    when integration_mode = 'mock' then 'connected'
    when coalesce(config->>'endpointUrl', '') <> '' then 'connected'
    else 'needs-setup'
  end,
  priority = case
    when slug = 'supply-pro' then 10
    when slug = 'comfort-warehouse' then 20
    when slug = 'premier-hvac' then 30
    else priority
  end,
  config = case
    when slug = 'supply-pro' then jsonb_build_object(
      'supportedSystemTypes', jsonb_build_array('Split system', 'Heat pump'),
      'notes', 'Mock regional distributor seed data'
    )
    when slug = 'comfort-warehouse' then jsonb_build_object(
      'supportedSystemTypes', jsonb_build_array('Split system'),
      'notes', 'Mock rebate-focused distributor seed data'
    )
    when slug = 'premier-hvac' then jsonb_build_object(
      'supportedSystemTypes', jsonb_build_array('Split system', 'Dual fuel'),
      'notes', 'Mock premium-brand distributor seed data'
    )
    else config
  end
where slug in ('supply-pro', 'comfort-warehouse', 'premier-hvac');
