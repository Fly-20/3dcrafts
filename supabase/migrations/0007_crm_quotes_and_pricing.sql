-- HQ Phase 0/1: pricing settings and the first CRM tables, for the admin
-- "New quote" page (HQ technical brief §6.4, §9, §10; backlog B3/G1).
--
-- Additive only: two new columns on customers, four new tables. Nothing
-- existing is changed. Every new table is admin-only through is_admin().
-- Take a backup before running it (brief §15 rule 6). Run after 0001-0006.

-- Etsy enquirers often have no email (0006 made it optional), so keep their
-- Etsy username and where they came from.
alter table customers add column etsy_username text;
alter table customers add column source text;
create index customers_etsy_username_idx on customers (lower(etsy_username));

-- One settings row (id = 1). The app merges it over its built-in defaults,
-- so a key missing here just uses the default. Seeded with the brief §9.1
-- figures (labour/design £15/h, filament £10/kg inc VAT, VAT 20%, ...).
create table pricing_settings (
  id smallint primary key default 1 check (id = 1),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id)
);

insert into pricing_settings (id, settings) values (1, '{
  "vatRate": 0.2, "labourPerHour": 15, "designPerHour": 15, "setupMinutes": 10,
  "filamentPerKgIncVat": 10, "filamentWaste": 0.1,
  "printerPrice": 700, "printerLifetimeHours": 5000, "printerElectricityPerHour": 0.04, "printerMaintenancePerHour": 0.05,
  "printFailureShort": 0.05, "printFailureMedium": 0.1, "printFailureLong": 0.15,
  "printFailureShortHours": 6, "printFailureLongHours": 15, "printerBedMm": 256,
  "laserPrice": 1000, "laserLifetimeHours": 3000, "laserElectricityPerHour": 0.03, "laserMaintenancePerHour": 0.1,
  "laserFailure": 0.1, "laserConsumables": 0.3, "laserBedWidthMm": 430, "laserBedHeightMm": 390,
  "plywoodSheetPriceIncVat": 16.7, "plywoodSheetWidthMm": 1830, "plywoodSheetHeightMm": 607,
  "plywoodWaste": 0.25, "plywoodMarginMm": 5,
  "packaging": 1, "postage": 3.99,
  "etsyPercentFee": 0.105, "etsyFixedFee": 0.36, "etsyAcquisition": 1,
  "websitePercentFee": 0.015, "websiteFixedFee": 0.2, "websiteAcquisition": 0.5,
  "targetMarkup": 0.3, "floorMarkup": 0.1, "minimumOrder": 10, "roundTo": 0.5,
  "premiumPrintTimeFactor": 1.3, "premiumFinishingFactor": 1.5, "expressUplift": 0.3,
  "bigJobPrice": 150, "bigJobUnits": 20
}'::jsonb);

-- One project per job, whatever the channel (brief §6.4). For now the pasted
-- enquiry is stored on the project; a messages table comes with the Inbox.
create table projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  channel text not null check (channel in ('etsy', 'website', 'other')),
  status text not null default 'enquiry' check (status in (
    'enquiry', 'needs_info', 'quoting', 'awaiting_approval', 'quote_sent', 'accepted',
    'awaiting_payment', 'paid', 'in_design', 'in_production', 'post_processing', 'packed',
    'shipped', 'delivered', 'review_requested', 'completed', 'lost'
  )),
  title text not null,
  enquiry_text text not null,
  -- What was pulled out of the message: size, colours, deadline, missing info, flags.
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_customer_id_idx on projects (customer_id);
create index projects_status_idx on projects (status, created_at desc);

-- A quote version. `inputs` and `settings` are stored so the price can be
-- recomputed to the penny later (brief §5 "price recompute" check).
create table quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  version integer not null,
  inputs jsonb not null,
  settings jsonb not null,
  total_pence integer not null,
  direct_cost_pence integer not null,
  floor_pence integer not null,
  profit_pence integer not null,
  draft_reply text,
  checks jsonb not null default '[]'::jsonb,
  created_by uuid references admin_users(id),
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

-- The options offered on a quote (Standard / Premium / Express).
create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  option text not null check (option in ('standard', 'premium', 'express')),
  description text not null,
  quantity integer not null check (quantity > 0),
  total_pence integer not null,
  unit_pence integer not null,
  cost_pence integer not null,
  floor_pence integer not null,
  profit_pence integer not null,
  unique (quote_id, option)
);

alter table pricing_settings enable row level security;
alter table projects enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;

create policy "Admins can view pricing settings" on pricing_settings for select using (is_admin());
create policy "Admins can update pricing settings" on pricing_settings for update using (is_admin()) with check (is_admin());
create policy "Admins can manage projects" on projects for all using (is_admin()) with check (is_admin());
create policy "Admins can manage quotes" on quotes for all using (is_admin()) with check (is_admin());
create policy "Admins can manage quote items" on quote_items for all using (is_admin()) with check (is_admin());

-- Explicit table privileges for signed-in users (RLS above still limits
-- every row to admins). Hosted Supabase grants these by default; newer
-- local/CLI databases don't, so state them rather than rely on it.
grant select, update on pricing_settings to authenticated;
grant select, insert, update, delete on projects, quotes, quote_items to authenticated;
