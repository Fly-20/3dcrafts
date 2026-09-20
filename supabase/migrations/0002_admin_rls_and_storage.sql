-- Admin RLS policies + product image storage bucket, so the product CMS
-- (Section 5 "Product CMS (admin)") can be built against direct
-- Supabase-authenticated table/storage access rather than needing every
-- admin action to go through a service-role route handler.
--
-- Run this after 0001_phase1_schema.sql.

-- `security definer` so these can check admin_users membership without
-- recursing into admin_users' own RLS policies (the standard Supabase
-- pattern for role-check helper functions).
create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

create function is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admin_users where id = auth.uid() and role = 'owner');
$$;

-- Catalogue management: admins get full read/write, on top of the public
-- read-only policies already defined in 0001 for the published catalogue.
create policy "Admins can manage categories" on categories for all using (is_admin()) with check (is_admin());
create policy "Admins can manage products" on products for all using (is_admin()) with check (is_admin());
create policy "Admins can manage product images" on product_images for all using (is_admin()) with check (is_admin());
create policy "Admins can manage product options" on product_options for all using (is_admin()) with check (is_admin());
create policy "Admins can manage product option values" on product_option_values for all using (is_admin()) with check (is_admin());
create policy "Admins can manage product variants" on product_variants for all using (is_admin()) with check (is_admin());
create policy "Admins can manage variant option values" on product_variant_option_values for all using (is_admin()) with check (is_admin());
create policy "Admins can manage shipping rates" on shipping_rates for all using (is_admin()) with check (is_admin());
create policy "Admins can manage discount codes" on discount_codes for all using (is_admin()) with check (is_admin());
create policy "Admins can manage gift cards" on gift_cards for all using (is_admin()) with check (is_admin());

-- Orders: created by the webhook via the service role key (bypasses RLS), so
-- admins only need read + status-update access here, not insert/delete.
create policy "Admins can view orders" on orders for select using (is_admin());
create policy "Admins can update orders" on orders for update using (is_admin()) with check (is_admin());
create policy "Admins can view order items" on order_items for select using (is_admin());
create policy "Admins can view payment events" on payment_events for select using (is_admin());

-- Customers/addresses: admins can view and correct customer records created
-- opportunistically from orders (Section 8), but not delete them.
create policy "Admins can view customers" on customers for select using (is_admin());
create policy "Admins can update customers" on customers for update using (is_admin()) with check (is_admin());
create policy "Admins can view addresses" on addresses for select using (is_admin());
create policy "Admins can manage addresses" on addresses for all using (is_admin()) with check (is_admin());

-- Abandoned-cart recovery (Phase 6) needs admins to be able to see cart_sessions;
-- rows themselves are still written by /api/checkout via the service role key.
create policy "Admins can view cart sessions" on cart_sessions for select using (is_admin());

-- Business settings + audit log + admin_users.
create policy "Admins can view business settings" on business_settings for select using (is_admin());
create policy "Admins can update business settings" on business_settings for update using (is_admin()) with check (is_admin());
create policy "Admins can view audit log" on admin_audit_log for select using (is_admin());
create policy "Admins can write audit log" on admin_audit_log for insert with check (is_admin());
create policy "Admins can view admin users" on admin_users for select using (is_admin());
-- Only owners can add/remove/reassign admin roles — bootstrapping the first
-- owner still has to be done manually (service role/SQL editor), per Section 7.
create policy "Owners can manage admin users" on admin_users for insert with check (is_owner());
create policy "Owners can update admin users" on admin_users for update using (is_owner()) with check (is_owner());
create policy "Owners can delete admin users" on admin_users for delete using (is_owner());

-- Product image storage bucket (Section 4a). Public read (product photos are
-- meant to be publicly visible), admin-only write.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can view product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Admins can upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and is_admin());

create policy "Admins can update product images" on storage.objects
  for update using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

create policy "Admins can delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and is_admin());
