-- Timelapse video sharing for Etsy orders. See the project's timelapse
-- planning notes for context. Kept deliberately minimal: one new table,
-- joined to the existing `customers` table rather than duplicating their
-- name/email, plus one new column (`tags`) on `customers` itself instead of
-- a separate tags + tag-assignments pair of tables.
--
-- Run this after 0001-0004.

alter table customers add column tags text[] not null default '{}';

create table order_timelapses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  customer_id uuid not null references customers(id),
  etsy_order_id text not null,
  video_url text not null,
  created_at timestamptz not null default now()
);
create index order_timelapses_etsy_order_id_idx on order_timelapses (etsy_order_id);
create index order_timelapses_customer_id_idx on order_timelapses (customer_id);

alter table order_timelapses enable row level security;

-- Admin-only. The public /timelapse/[slug] page looks a row up with the
-- service-role client (bypassing RLS), the same way /track-order already
-- looks up orders — the slug itself is what gates access, not a table policy.
create policy "Admins can manage timelapses" on order_timelapses for all using (is_admin()) with check (is_admin());

-- Video storage bucket, separate from product-images (different content
-- type and lifecycle). Public read (so a <video> tag can play it directly),
-- admin-only write — same shape as the product-images policies in
-- 0002_admin_rls_and_storage.sql.
insert into storage.buckets (id, name, public) values ('order-timelapses', 'order-timelapses', true) on conflict (id) do nothing;

create policy "Public can view timelapse videos" on storage.objects
  for select using (bucket_id = 'order-timelapses');

create policy "Admins can upload timelapse videos" on storage.objects
  for insert with check (bucket_id = 'order-timelapses' and is_admin());

create policy "Admins can update timelapse videos" on storage.objects
  for update using (bucket_id = 'order-timelapses' and is_admin())
  with check (bucket_id = 'order-timelapses' and is_admin());

create policy "Admins can delete timelapse videos" on storage.objects
  for delete using (bucket_id = 'order-timelapses' and is_admin());
