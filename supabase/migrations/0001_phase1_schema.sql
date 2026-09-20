-- Phase 1 commerce schema.
-- See 3d-crafts-phase1-technical-plan.md, Section 4, for the design rationale.
-- Run this once in the Supabase SQL editor (or `supabase db push`) against a fresh project.

create extension if not exists "pgcrypto";

create table customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  phone text,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  type text not null check (type in ('shipping', 'billing')),
  line1 text not null,
  line2 text,
  city text not null,
  postcode text not null,
  country text not null default 'GB'
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references categories(id)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  category_id uuid references categories(id),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  fulfilment_type text not null check (fulfilment_type in ('stock', 'made_to_order', 'pre_order', 'quote_only', 'unavailable')),
  base_price_pence integer not null check (base_price_pence >= 0),
  vat_rate numeric not null default 0.20,
  seo_title text,
  seo_description text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_search_vector_idx on products using gin (search_vector);
create index products_category_id_idx on products (category_id);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0
);
create index product_images_product_id_idx on product_images (product_id);

create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references product_options(id) on delete cascade,
  value text not null,
  sort_order int not null default 0
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text unique not null,
  price_pence integer check (price_pence >= 0),
  weight_grams int not null check (weight_grams > 0),
  dimensions_mm jsonb,
  production_time_minutes int,
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  status text not null default 'active' check (status in ('active', 'archived'))
);
create index product_variants_product_id_idx on product_variants (product_id);

create table product_variant_option_values (
  variant_id uuid not null references product_variants(id) on delete cascade,
  option_value_id uuid not null references product_option_values(id) on delete cascade,
  primary key (variant_id, option_value_id)
);

create table shipping_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_weight_grams int not null default 0,
  max_weight_grams int,
  price_pence integer not null check (price_pence >= 0),
  free_shipping_threshold_pence integer,
  active boolean not null default true,
  sort_order int not null default 0
);

create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percentage', 'fixed', 'free_shipping')),
  value integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  times_used int not null default 0,
  active boolean not null default true
);

create table gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  initial_balance_pence integer not null check (initial_balance_pence >= 0),
  remaining_balance_pence integer not null check (remaining_balance_pence >= 0),
  issued_to_customer_id uuid references customers(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence order_number_seq start 10001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('3DC-' || nextval('order_number_seq')::text),
  customer_id uuid references customers(id),
  guest_email text,
  status text not null default 'new' check (status in ('new', 'paid', 'print_queue', 'printing', 'quality_check', 'packing', 'dispatched', 'completed', 'cancelled', 'refunded')),
  order_type text not null default 'retail' check (order_type in ('retail', 'gift', 'custom', 'b2b', 'manual')),
  subtotal_pence integer not null,
  discount_pence integer not null default 0,
  discount_code_id uuid references discount_codes(id),
  gift_card_id uuid references gift_cards(id),
  gift_card_applied_pence integer not null default 0,
  shipping_pence integer not null default 0,
  vat_pence integer not null default 0,
  total_pence integer not null,
  shipping_address_id uuid references addresses(id),
  billing_address_id uuid references addresses(id),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text unique,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_id_idx on orders (customer_id);
create index orders_guest_email_idx on orders (guest_email);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_variant_id uuid references product_variants(id),
  quantity int not null check (quantity > 0),
  unit_price_pence integer not null,
  line_total_pence integer not null
);
create index order_items_order_id_idx on order_items (order_id);

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff', 'production')),
  name text
);

create table business_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  company_address text,
  vat_number text,
  staff_notification_email text,
  staff_notification_discord_webhook text
);

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references admin_users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create table cart_sessions (
  id uuid primary key default gen_random_uuid(),
  email text,
  cart_payload jsonb not null default '{}'::jsonb,
  discount_code_id uuid references discount_codes(id),
  abandoned_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Atomic conditional stock decrement (Section 6b) — returns the updated row
-- only if there was enough stock, so callers can detect a failed decrement
-- (0 rows) without a read-then-write race.
create function decrement_variant_stock(variant_id uuid, qty int)
returns setof product_variants
language sql
as $$
  update product_variants
  set stock_quantity = stock_quantity - qty
  where id = variant_id and stock_quantity >= qty
  returning *;
$$;

create function increment_discount_code_usage(discount_code_id uuid)
returns void
language sql
as $$
  update discount_codes set times_used = times_used + 1 where id = discount_code_id;
$$;

create function decrement_gift_card_balance(gift_card_id uuid, amount_pence int)
returns void
language sql
as $$
  update gift_cards
  set remaining_balance_pence = greatest(0, remaining_balance_pence - amount_pence)
  where id = gift_card_id;
$$;

-- Row Level Security: server routes use the service role key (bypasses RLS) for
-- anything involving pricing/checkout logic. The public anon key is only granted
-- read access to the published catalogue.
alter table customers enable row level security;
alter table addresses enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table product_variant_option_values enable row level security;
alter table shipping_rates enable row level security;
alter table discount_codes enable row level security;
alter table gift_cards enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payment_events enable row level security;
alter table admin_users enable row level security;
alter table business_settings enable row level security;
alter table admin_audit_log enable row level security;
alter table cart_sessions enable row level security;

create policy "Public can read active categories" on categories for select using (true);
create policy "Public can read active products" on products for select using (status = 'active');
create policy "Public can read images of active products" on product_images for select using (
  exists (select 1 from products where products.id = product_images.product_id and products.status = 'active')
);
create policy "Public can read options of active products" on product_options for select using (
  exists (select 1 from products where products.id = product_options.product_id and products.status = 'active')
);
create policy "Public can read option values of active products" on product_option_values for select using (
  exists (
    select 1 from product_options
    join products on products.id = product_options.product_id
    where product_options.id = product_option_values.option_id and products.status = 'active'
  )
);
create policy "Public can read variants of active products" on product_variants for select using (
  status = 'active' and exists (select 1 from products where products.id = product_variants.product_id and products.status = 'active')
);
create policy "Public can read variant option values of active products" on product_variant_option_values for select using (
  exists (
    select 1 from product_variants
    join products on products.id = product_variants.product_id
    where product_variants.id = product_variant_option_values.variant_id and products.status = 'active'
  )
);
