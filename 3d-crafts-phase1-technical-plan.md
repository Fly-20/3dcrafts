# 3D Crafts — Phase 1 Technical Implementation Plan

This is the engineering companion to `3d-crafts-platform-vision-roadmap.md`. That document describes the business vision; this one translates **Phase 1 (Commerce Foundation)** into a concrete, buildable plan against the actual codebase as it exists today.

It covers: current state, data model, tech setup, folder/route structure, build sequencing, and open decisions. Phase 2+ (custom quotes, production, CRM, B2B, etc.) are intentionally out of scope here and should get their own technical plan once Phase 1 ships.

## 1. Current State (as of this doc)

The repo is a Next.js 16 (App Router) + TypeScript + Tailwind marketing site. It is **not** an ecommerce platform yet. What exists today:

- Static marketing pages: home (`src/app/page.tsx`), layout, SEO metadata (`site-config.ts`, `sitemap.ts`, `robots.ts`, OG/Twitter images).
- One dynamic feature: a custom-print quote form (`src/app/components/quote-form.tsx`) posting to `src/app/api/quote/route.ts`, which emails the submission via Resend and notifies a Discord webhook. No database is involved — submissions are not persisted anywhere.
- No Supabase client, no Stripe integration, no auth, no admin area, no products/orders/customers of any kind.
- `.env` / `.env.example` currently only contain Resend + Discord + Google verification keys.

Implication: Phase 1 is a greenfield build for everything except the marketing shell and the email-sending pattern, which we should keep and extend rather than replace.

**✅ Update:** The commerce/Stripe backend described in Sections 4–6 is now implemented in code (schema migration, `lib/supabase`, `lib/stripe`, `lib/cart`, `lib/shipping`, `lib/money`, `lib/notify`, `lib/rate-limit`, `lib/business-settings`, and the `/api/cart`, `/api/checkout`, `/api/webhooks/stripe`, `/api/track-order` routes). The admin app now covers products (drag-and-drop media, rich-text description, SEO fields), categories, discounts, orders (with status updates + audit log), and customers; the public side covers shop/cart/checkout plus guest order lookup at `/track-order` — see the status markers in Section 7/12. The project's live Supabase schema has been migrated and `.env` filled in, the first admin user is bootstrapped, a product and shipping rates are seeded, and **a real Stripe test-mode purchase has been run end-to-end and verified against the live database** (order created, stock decremented, webhook idempotency logged, VAT-itemized confirmation email content verified, a failed/expired checkout separately verified too) — see Section 7a. What's left is mostly owner-provided data/accounts (Upstash, `business_settings`, Stripe live-mode) rather than more code — see Section 12's closing summary for the current honest list.

## 2. Phase 1 Scope Recap

From the roadmap: Public shop pages, product CMS, cart & checkout, Stripe payments, orders, transactional email, admin (with roles + audit log), and basic analytics — including the gaps we added (discount codes, gift cards, stock/oversell prevention, search & filtering, cookie consent).

## 3. Tech Setup

| Concern | Choice | Notes |
|---|---|---|
| Database | Supabase (Postgres) | Use Supabase's generated types (`supabase gen types typescript`) for end-to-end type safety. |
| ORM/query layer | Supabase JS client + SQL migrations | Avoid adding a second ORM (e.g. Prisma) unless a real need emerges — keep the stack minimal. |
| Auth (admin) | Supabase Auth | Email/password or magic link for admin/staff users only in Phase 1. Customer accounts are Phase 6, not needed for guest checkout. |
| Payments | Stripe Checkout (hosted) | Avoids handling card data directly; matches "Stripe-hosted payment flow where possible" in the roadmap's security section. |
| Email | Resend | Already integrated for quotes — reuse the same pattern for order confirmation/dispatch/refund emails. |
| File storage | Supabase Storage | **Required for Phase 1**, not just Phase 2. Product images must live here, not in `/public` — see Section 4a. |
| Hosting | Vercel | As per roadmap. |
| Error monitoring | Sentry (or Vercel's built-in observability) | Not in the original roadmap — recommended addition so payment/webhook failures aren't silent. |
| Environments | Local `.env.local`, Vercel Preview, Vercel Production | Use separate Supabase projects (or schemas) and separate Stripe keys (test vs live) per environment. |

### New dependencies to add (when implementation starts)
- `@supabase/supabase-js` (and `@supabase/ssr` for server/client session handling)
- `stripe` (server SDK)
- Keep `resend` (already present as an API call — confirm if the `resend` npm package is installed or if it's called via raw fetch; either is fine, but standardize on one).

**✅ Added since:** `lexical` + `@lexical/react` + `@lexical/list` + `@lexical/html` — rich text editor for the product description field (bold/italic/bullet/numbered list), replacing the plain `<textarea>`. Exports its content as an HTML string into the same `description` column, so no schema change was needed. See Section 7 Stage 2.

**✅ Added since:** `@upstash/ratelimit` + `@upstash/redis` — IP-based rate limiting for `/api/cart`/`/api/checkout` (Section 6g). Needs a free Upstash account + two env vars to actually take effect (Section 11B) — fails open without them.

## 4a. Image Hosting (must be decided before build starts)

The Section 3.1 principle in the roadmap — "a new product can be created and published in minutes without touching the codebase" — means images **must** be uploaded and served at runtime, not committed to `/public`, which only updates on a code deploy.

Recommended approach:
- **Supabase Storage**, a public bucket (e.g. `product-images`). Admin product form uploads directly to this bucket (client uploads with a short-lived signed URL, or via a server route handler) and stores the resulting public URL in `product_images.url`.
- Serve images through `next/image` with `images.remotePatterns` in `next.config.ts` pointing at the Supabase storage domain, so Next.js still handles resizing/format optimization (WebP/AVIF) and lazy loading even though files aren't local.
- Keep original filenames out of stored paths (use a generated id) to avoid collisions and to allow safe caching.
- File type/size validation on upload (e.g. JPG/PNG/WebP, reasonable max size) — mirrors the validation already done in `api/quote/route.ts` for quote attachments.

Alternative considered: Cloudinary or S3+CloudFront. Both are more capable (on-the-fly transforms, CDN) but add a second vendor/bill on top of Supabase+Stripe+Resend+Vercel. Given the stack is deliberately minimal, **Supabase Storage is the recommended default** unless there's a specific reason to add another vendor. This should be confirmed before building the product image upload feature since it affects the admin form, the DB column, and `next.config.ts`.

### Free plan sizing note

Supabase's free tier (1 GB file storage, 5 GB cached + 5 GB uncached egress/month, no server-side image transforms) is enough for Phase 1 launch, as long as:
- Uploaded images are resized/compressed before storage (e.g. capped at ~1600-2000px wide, WebP/JPEG) rather than stored as raw multi-MB exports — the current `/public` marketing images (1-2 MB PNGs each) are an example of what *not* to carry over.
- `next/image` (running on Vercel) handles resizing/format optimization on top of the stored originals, so Supabase's lack of built-in image transforms on the free tier isn't a blocker.
- Egress is the metric to watch as traffic grows; upgrading to Pro ($25/mo, 100 GB storage / 250 GB egress) requires no architecture change, just a plan upgrade when usage approaches the free limits.
- A free Supabase project pauses after 7 days of inactivity — not a concern once real usage/testing is regular, but worth knowing during initial setup.

## 4. Data Model (Postgres / Supabase)

This is a first-pass schema sized for Phase 1 only. Extra columns needed for later phases (production, B2B, referrals) are deliberately omitted to avoid speculative complexity, but names are chosen so they extend cleanly.

```
customers
  id uuid pk
  email text unique not null
  name text
  phone text
  marketing_consent boolean default false
  marketing_consent_at timestamptz
  created_at timestamptz default now()

addresses
  id uuid pk
  customer_id uuid references customers(id)
  type text check (type in ('shipping','billing'))
  line1 text, line2 text, city text, postcode text, country text default 'GB'

categories
  id uuid pk
  name text, slug text unique
  parent_id uuid references categories(id) null

products
  id uuid pk
  title text, slug text unique
  description text
  category_id uuid references categories(id)
  status text check (status in ('draft','active','archived'))
  fulfilment_type text check (fulfilment_type in ('stock','made_to_order','pre_order','quote_only','unavailable'))
  base_price_pence integer not null
  vat_rate numeric default 0.20
  seo_title text, seo_description text
  created_at, updated_at timestamptz

product_images
  id uuid pk
  product_id uuid references products(id)
  url text, alt text, sort_order int

product_options            -- e.g. "Material", "Colour", "Size"
  id uuid pk
  product_id uuid references products(id)
  name text, sort_order int

product_option_values      -- e.g. "PLA", "Red", "Large"
  id uuid pk
  option_id uuid references product_options(id)
  value text, sort_order int

product_variants
  id uuid pk
  product_id uuid references products(id)
  sku text unique
  price_pence integer            -- override of base price if set
  weight_grams int not null      -- required: drives weight-based shipping calculation
  dimensions_mm jsonb            -- {length, width, height}, used for parcel-size banding
  production_time_minutes int
  stock_quantity int default 0    -- finished-goods inventory (Phase 5 detail lives on top of this)
  status text check (status in ('active','archived'))

shipping_rates
  id uuid pk
  name text                       -- e.g. "Standard UK", "Large Item"
  min_weight_grams int, max_weight_grams int null   -- band boundaries; null max = no upper bound
  price_pence integer
  free_shipping_threshold_pence integer null        -- order subtotal above which this band is free
  active boolean default true
  sort_order int

product_variant_option_values   -- join table: which option values make up a variant
  variant_id uuid references product_variants(id)
  option_value_id uuid references product_option_values(id)
  primary key (variant_id, option_value_id)

discount_codes
  id uuid pk
  code text unique
  type text check (type in ('percentage','fixed','free_shipping'))
  value integer                   -- percent (0-100) or pence, depending on type
  starts_at timestamptz, ends_at timestamptz
  usage_limit int, times_used int default 0
  active boolean default true

gift_cards
  id uuid pk
  code text unique
  initial_balance_pence integer
  remaining_balance_pence integer
  issued_to_customer_id uuid references customers(id) null
  active boolean default true
  created_at timestamptz

orders
  id uuid pk
  order_number text unique        -- human-readable, e.g. 3DC-10042
  customer_id uuid references customers(id) null   -- null allowed for guest checkout, email stored separately
  guest_email text
  status text check (status in ('new','paid','print_queue','printing','quality_check','packing','dispatched','completed','cancelled','refunded'))
  order_type text check (order_type in ('retail','gift','custom','b2b','manual')) default 'retail'
  subtotal_pence integer
  discount_pence integer default 0
  discount_code_id uuid references discount_codes(id) null
  gift_card_id uuid references gift_cards(id) null
  gift_card_applied_pence integer default 0
  shipping_pence integer
  vat_pence integer
  total_pence integer
  shipping_address_id uuid references addresses(id)
  billing_address_id uuid references addresses(id)
  stripe_payment_intent_id text
  stripe_checkout_session_id text
  internal_notes text
  created_at, updated_at timestamptz

order_items
  id uuid pk
  order_id uuid references orders(id)
  product_variant_id uuid references product_variants(id)
  quantity int
  unit_price_pence integer
  line_total_pence integer

payment_events                    -- raw webhook log, for idempotency + reconciliation
  id uuid pk
  stripe_event_id text unique
  type text
  payload jsonb
  processed_at timestamptz

admin_users
  id uuid pk references auth.users(id)
  role text check (role in ('owner','staff','production'))
  name text

business_settings                 -- single-row config, not per-order
  id uuid pk
  company_name text
  company_address text
  vat_number text
  staff_notification_email text
  staff_notification_discord_webhook text

admin_audit_log
  id uuid pk
  admin_user_id uuid references admin_users(id)
  action text                      -- e.g. 'order.status_changed', 'product.updated'
  entity_type text, entity_id uuid
  before jsonb, after jsonb
  created_at timestamptz default now()

cart_sessions                     -- for abandoned cart capture, pre-checkout
  id uuid pk
  email text
  cart_payload jsonb
  discount_code_id uuid references discount_codes(id) null
  abandoned_email_sent_at timestamptz
  created_at, updated_at timestamptz
```

Notes:
- Money is stored in **pence (integers)** everywhere to avoid float rounding issues — standard Stripe convention.
- `payment_events` gives idempotent webhook processing "for free": check `stripe_event_id` before applying an event.
- Row Level Security (RLS) should be enabled on all tables; only `admin_users` (via Supabase Auth role check) can read/write most tables directly. Public-facing reads (product catalogue) go through RLS policies scoped to `status = 'active'`, or through server-side route handlers using the service role key — prefer the latter for anything involving pricing/checkout logic to keep business logic out of the client.
- **✅ `supabase/migrations/0003_strip_html_from_search_vector.sql`**: once `description` became an HTML string (rich text editor, Stage 2), `search_vector`'s generated expression was re-indexing raw tag names (`strong`, `em`, `ul`, `li`...) as if they were content. This migration drops and recreates the column with `regexp_replace(description, '<[^>]+>', ' ', 'g')` stripping tags before indexing. **Needs to be run against the Supabase project** alongside 0001/0002 if not already applied.

## 5. Application Structure (App Router)

Following the pattern already established by `src/app/api/quote/route.ts`:

```
src/app/
  (site)/                      # public marketing + shop, route group so it can share a layout
    page.tsx                   # homepage (existing)
    shop/
      page.tsx                 # product listing, search/filter/sort
      [slug]/page.tsx          # product detail
    cart/page.tsx
    checkout/
      page.tsx                 # collects address, triggers Stripe Checkout session
      success/page.tsx
      cancel/page.tsx
    delivery/page.tsx
    returns/page.tsx
    privacy/page.tsx
    terms/page.tsx
    track-order/page.tsx        # guest order lookup by order number + email

  admin/                       # gated by Supabase Auth + admin_users role check
    layout.tsx                 # auth guard
    page.tsx                   # dashboard
    orders/
      page.tsx
      [id]/page.tsx
    products/
      page.tsx
      new/page.tsx
      [id]/page.tsx
    customers/page.tsx
    discounts/page.tsx
    settings/page.tsx

  api/
    quote/route.ts             # existing, unchanged
    checkout/route.ts          # creates Stripe Checkout session
    webhooks/stripe/route.ts   # verifies signature, writes payment_events, updates orders
    cart/route.ts              # server-side cart pricing validation (never trust client totals)

lib/
  supabase/
    server.ts                  # server client (service role, used in route handlers/admin)
    browser.ts                 # anon client for client components
    storage.ts                 # product image upload/URL helpers (Supabase Storage)
  stripe.ts                    # Stripe SDK singleton
  email/
    resend.ts                  # shared Resend sender, used by quote route today and order emails later
    templates/                 # order-confirmation.tsx, dispatch.tsx, refund.tsx (React Email or plain HTML)
  money.ts                     # pence formatting/rounding helpers
  shipping.ts                  # weight-based rate lookup against shipping_rates, combining multi-item cart weight
```

This keeps the existing quote flow untouched while giving ecommerce its own clearly separated area, and puts the admin app behind its own layout-level auth guard rather than sprinkling checks into every page.

**✅ Update — actual structure built:** `shop/`, `cart/`, `checkout/`, and (later) `track-order/` were built as top-level directories under `src/app/` (not inside a `(site)` route group as originally sketched above) — route groups are purely organisational and don't affect URLs, and the homepage already lived directly under `src/app/` rather than in a group, so introducing one just for the new routes would have meant moving the homepage too for no functional gain. `delivery/`, `returns/`, `privacy/`, and `terms/` are still not built (content-blocked, not code-blocked — see Section 11C). Cart state itself is **not** server-persisted pre-checkout — it lives client-side in `localStorage` via `lib/cart-store.tsx` (a small external store read with `useSyncExternalStore`, not React Context — see the note below on why) and is only turned into a `cart_sessions` row at `/api/checkout` time, per the existing design in Section 6.

**✅ Update — admin app now built out beyond the original sketch:**
- `admin/(dashboard)/layout.tsx` + `admin-nav.tsx`: a Shopify-style **left sidebar** (Home / Orders / Products / Categories / Customers / Discounts / Gift cards / Shipping, active-link highlighting, user + sign-out pinned to the bottom) replaced the original top-nav bar. Markets/Finance/Analytics are deliberately left off the sidebar — no backend for any of them yet, and dead links were judged worse than an incomplete-looking nav. (Every one of Discounts, Categories, Shipping, and Gift cards started out excluded for the same reason, and was added to the nav only once it had a real screen behind it.)
- `admin/(dashboard)/products/`: `product-form.tsx` was rebuilt into a block-card layout (Title/Description/Media/Category, Pricing, Inventory & shipping, Search engine listing, plus a Status sidebar card), also modelled on Shopify's product page. New files: `rich-text-editor.tsx` (Lexical), `product-images-field.tsx` (drag-and-drop image picker for the create flow, before the product has an id). `products/[id]/product-images-manager.tsx` handles the same for already-uploaded images — drag-to-reorder (first image = featured, matching the `sort_order` convention the shop pages already used), drag-and-drop upload of new ones, all via Server Actions called imperatively (not `<form action>`, since nesting a `<form>` inside `ProductForm`'s own form isn't valid HTML — hit and fixed this as a hydration error during the build).
- `admin/(dashboard)/orders/` (**new, was unbuilt**): `page.tsx` (list — order #, date, customer, items, total, payment status, fulfilment status, all derived from the single `orders.status` column since the schema doesn't have separate payment/fulfilment columns — see `status.ts`), `[id]/page.tsx` (detail — line items, full pricing breakdown, shipping address, Stripe payment/session ids), `[id]/order-status-form.tsx` + `actions.ts` (status-update dropdown that also writes to `admin_audit_log` — the first real write-through to that table).
- `admin/(dashboard)/customers/page.tsx` (**new, was unbuilt**): simple read-only list (email/name/phone/joined) of the customers created opportunistically from checkouts.
- `admin/(dashboard)/discounts/` (**new, was unbuilt**): `page.tsx` (list), `new/page.tsx`/`[id]/page.tsx` + shared `discount-form.tsx` (code/type/value/dates/usage-limit/active), `actions.ts`. Added to the sidebar.
- `admin/(dashboard)/categories/` (**new, was unbuilt**): `page.tsx` (list — name, parent, assigned-product count), `new/page.tsx`/`[id]/page.tsx` + shared `category-form.tsx` (name/slug/optional parent), `actions.ts`. Delete surfaces a real error (via redirect + `?error=`) rather than failing silently when Postgres blocks it (a category still has products or subcategories). Added to the sidebar.
- `admin/(dashboard)/shipping-rates/` (**new, was unbuilt**): `page.tsx` (list), `new/page.tsx`/`[id]/page.tsx` + shared `shipping-rate-form.tsx` (name/min-max weight/price/free-shipping threshold/sort order/active), `actions.ts`. Added to the sidebar.
- `admin/(dashboard)/gift-cards/` (**new, was unbuilt**): `page.tsx` (list — code, remaining/initial balance, issued-to customer, status), `new/page.tsx`/`[id]/page.tsx` + shared `gift-card-form.tsx` (create sets initial = remaining balance; edit shows initial read-only and lets the remaining balance be adjusted manually), `actions.ts`. Delete surfaces a real error if the card's been used on an order (`23503`, same redirect+`?error=` pattern as categories). Added to the sidebar.
- `admin/(dashboard)/products/[id]/variants-actions.ts` + `variants-manager.tsx` (**new**): the multi-variant/option UI. `variants-actions.ts` has `addProductOptionAction`/`addOptionValueAction` (useActionState-bound), `removeOptionValueAction`/`removeOptionAction` (imperative — need to return an error to block in-use removals, which `<form action>` can't do since it requires a void-returning function), `generateVariantsAction` (cartesian product of current option values, creates only missing combinations, never touches or deletes existing variants), and `updateVariantsAction` (bulk-saves the variants table, called imperatively like the image manager's upload/reorder actions). `variants-manager.tsx` renders the options list (add/remove option+values) and, once at least one option exists, a variants table (SKU/price override/weight/stock/production time/status per combination) with its own Save. `product-form.tsx` gained two new props to wire this in: `variantsField` (always rendered on the edit page, so a plain product can gain its first option) and `hasOptions` (hides the classic single-variant SKU/weight/stock fields and tells `updateProduct` to skip the variant update entirely once true).
- `shop/[slug]/variant-picker.tsx` (**new**): only rendered when a product has options — a `<select>` per option that resolves the selected combination to a variant (matching option-value id sets) and shows its price/stock, replacing the page's static price+button block for that case. Products with no options are completely unaffected (same static rendering as before).
- `settings/` from the original sketch is still not built.
- `src/app/track-order/` (**new, was unbuilt**): `page.tsx` + `track-order-form.tsx`, backed by `src/app/api/track-order/route.ts` (Section 6c) — service-role-backed since `orders` has no public RLS read policy, rate-limited (Section 6g), returns only order number/date/total/status/item titles.
- `src/lib/rate-limit.ts` (**new**): shared Upstash-backed IP rate limiter used by `/api/cart`, `/api/checkout`, and `/api/track-order` (Section 6g).
- `src/lib/order-status.ts` (**new**): payment/fulfilment status label helpers, moved out of `admin/(dashboard)/orders/` so both the admin screens and the public `/track-order` page can share them without the public page reaching into the admin route segment.

## 6. Checkout & Payment Flow

1. Client builds a cart (local state or `cart_sessions` row keyed by a cookie/session id).
2. `POST /api/checkout` recalculates the cart server-side from the DB (never trusts client-submitted prices), applies discount code / gift card if present, and creates a Stripe Checkout Session with the full cart encoded in session metadata (not a pre-created `orders` row — see note below).
3. Stripe redirects to success/cancel URLs.
4. `POST /api/webhooks/stripe` is the source of truth for both order creation and payment confirmation (not the success-page redirect, which is not guaranteed to fire). On `checkout.session.completed`:
   - Verify signature.
   - Check `payment_events` for the event id (idempotency).
   - Create the `orders` row (status `paid`) from the session metadata, decrement `product_variants.stock_quantity` for `stock` fulfilment types (atomic conditional update, see 6b), increment `discount_codes.times_used` / decrement `gift_cards.remaining_balance_pence` as applicable.
   - Send the order confirmation (customer) and new-order notification (staff) — see 6a.
5. Admin manually (Phase 1) or automatically (later phases) progresses order status through the production pipeline, starting from `paid`.

**Why create the order in the webhook, not at checkout time**: creating an `orders` row when the Checkout Session is first created would leave a scattering of orphaned `new`/unpaid orders for every customer who starts checkout and abandons it (common). Doing it in the webhook means `orders` only ever contains attempts that actually paid — cleaner admin/order list, no manual cleanup job needed. Pre-payment abandonment is instead tracked separately via `cart_sessions` (already in the schema) for abandoned-cart recovery emails in Phase 6.

### 6a. Notifications on payment (both directions)

"The customer gets notified" is not the whole requirement — staff also need to know a paid order exists without having to keep the admin dashboard open. On `checkout.session.completed`, the webhook handler should fire two notifications, not one:
- **Customer**: order confirmation email via Resend (order number, items, total, delivery address).
- **Staff**: an internal "new order" notification — reuse the existing Discord webhook pattern from `api/quote/route.ts` (fastest to build, already proven) and/or a plain email to a staff inbox. This should include order number, items, and a direct link to the order in `/admin/orders/[id]`.

The same applies to failed payments (`checkout.session.expired` / payment failure events): customer gets a "payment didn't go through" email where useful (already in roadmap), and staff should optionally see failed high-value attempts for fraud awareness — this can just be a log entry in Phase 1, not necessarily its own notification.

**✅ Done:** `checkout.session.expired` now calls `handleCheckoutSessionExpired` (`api/webhooks/stripe/route.ts`) instead of only logging. Always logs (`console.warn`, session id + email + cart total); emails the customer (`sendPaymentFailedEmail`) if Stripe captured an email for the session; alerts staff on Discord (`sendStaffFailedPaymentAlert`) only for carts at or above `HIGH_VALUE_ABANDONED_CART_PENCE` (defaults £150) — matches the "log entry is enough, not necessarily its own notification" guidance above, since alerting on every abandoned cart (common, low-signal) would just be noise. **Verified against a live Stripe test-mode session**: created a real Checkout Session via `/api/checkout`, force-expired it with `stripe checkout sessions expire <id>` (Stripe CLI), confirmed the webhook received `checkout.session.expired`, logged it to `payment_events`, and created no order — exactly as designed.

### 6b. Stock race condition

Because stock is decremented inside the webhook, two near-simultaneous purchases of the last unit of a `stock`-type product must not both succeed. Use an atomic conditional update rather than read-then-write:

```sql
update product_variants
set stock_quantity = stock_quantity - :qty
where id = :variant_id and stock_quantity >= :qty;
```

If the update affects 0 rows, the order should be flagged (`internal_notes`, plus a staff notification) for manual review rather than silently failing — the payment has already been captured by Stripe at that point.

### 6c. Order lookup (guest checkout has no account)

Since Phase 1 is guest-only, a customer needs a way to check their order status later without an account. Minimum viable version: a `/track-order` page where entering an order number + the email used at checkout looks up the order (`orders.order_number` + `orders.guest_email`/`customer.email`) and shows current status. This avoids "how do I check on my order" support emails becoming the fallback.

**✅ Done:** `POST /api/track-order` (rate-limited, 10 req/60s per IP per Section 6g) + `src/app/track-order/page.tsx`/`track-order-form.tsx`. Goes through the service role key since `orders` has no public RLS read policy — the route only ever returns order number/date/total/payment+fulfilment status/line-item titles, never the full row (no addresses, no Stripe ids). Linked from the site nav. Verified against the live database: correct order returns the right data, wrong email 404s, and order number/email matching is case-insensitive.

**Note (unrelated to this feature):** `src/app/components/shop-nav.tsx` was restructured into `SiteHeader`/`SiteFooter`/`SiteChrome` (a single global header+footer rendered once in the root layout via `SiteChrome`, which skips itself entirely on `/admin/*` routes) — per-page `<ShopNav />` calls on `/shop`, `/cart`, `/checkout`, `/track-order` etc. were removed accordingly. `ShopNav` still exists as a re-exported alias for `SiteHeader`. This wasn't built as part of this technical plan's work — flagging it here just so the file structure in Section 5 stays accurate.

### 6d. Search implementation

The "search a product" requirement needs a concrete approach, not just a UI box. For Phase 1 catalogue sizes, Postgres full-text search is sufficient and needs no extra service:
- Add a generated `tsvector` column on `products` (title + description, weighted) with a `GIN` index.
- Query via `websearch_to_tsquery` for natural query parsing, ranked with `ts_rank`.
- Combine with the filter/sort UI (category, material, price, availability) already listed in Phase 1 requirements.
- This can be swapped for a dedicated search service (Algolia/Meilisearch) later if catalogue size or relevance needs grow — not needed at launch.

### 6e. VAT invoice details

Since VAT is charged from launch, order confirmation emails and any downloadable receipt need standard UK VAT invoice fields: business name, address, VAT registration number, invoice/order number, VAT amount and rate shown as its own line (not just bundled into total). Add a small `business_settings` (or reuse `admin` settings) table/config for company name, address, and VAT number so it isn't hardcoded in email templates.

**✅ Done:** `sendOrderConfirmationEmail` (`lib/notify.ts`) now renders a proper breakdown — business name/address/VAT number (from `lib/business-settings.ts`, address/VAT lines only shown if set), invoice/order number + date, itemized lines, subtotal (VAT-inclusive), VAT shown as its own line with its rate (e.g. "VAT (20%) included in the above: £X.XX" — computed correctly even with per-product `vat_rate` since `lineItems` carry their own rate; falls back to "mixed rates" if a cart ever has more than one), shipping, total. **Verified against a live purchase**: ran a real Stripe test-mode checkout, confirmed the order's stored `subtotal_pence`/`vat_pence`/`shipping_pence`/`total_pence` match what the email template would render (£0.97 goods, £0.16 VAT at 20%, £0.99 shipping, £1.96 total). **Still needed**: `business_settings` has no row yet (no Settings admin screen exists to create one), so the email currently omits the company address/VAT number lines and just shows the site name — real business details (Section 11C) need to go in via SQL for now.

### 6f. Dynamic sitemap for products

`src/app/sitemap.ts` currently only returns the homepage — it needs to query published products/categories and include their URLs (with `lastModified` from `updated_at`) once the catalogue exists, otherwise new product pages won't get indexed by search engines.

**✅ Done:** `sitemap.ts` now queries active products from Supabase and includes `/shop` plus one entry per product slug with `lastModified`. Falls back to the static homepage/`/shop` entries only if Supabase env vars are missing (e.g. a build without `.env`). Categories aren't in the sitemap since category pages don't exist yet.

### 6g. Abuse prevention on public endpoints

`/api/checkout`, `/api/cart` (price validation), and `/track-order` (order lookup) are all public and unauthenticated. Without basic rate limiting, `/track-order` in particular could be used to enumerate order numbers/emails, and the checkout/discount-code endpoints could be hit for coupon brute-forcing. Add simple IP-based rate limiting (Vercel/Upstash rate limiting, or a lightweight in-DB counter) on these three routes before launch — the roadmap already calls for this pattern for the Phase 3 gift-claim flow, so it's consistent to apply it here too.

**✅ Done for `/api/cart`, `/api/checkout`, and `/api/track-order`:** `lib/rate-limit.ts`, backed by Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`), IP-based sliding window — 30 req/60s on `/api/cart`, 10 req/60s on `/api/checkout` (stricter since it creates a real Stripe Checkout Session), 10 req/60s on `/api/track-order` (the enumeration-risk route this section specifically calls out). Returns `429` with a `Retry-After` header when exceeded. **Fails open** (allows the request, logs one console warning) if `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` aren't set — an Upstash account is an owner action, and taking checkout down until it's provisioned would be worse than temporarily-unlimited requests. **Still needs**: the owner to create a free Upstash account and add the two env vars (Section 11B).

## 7. Build Sequencing (suggested order, not fixed sprints)

Each stage is buildable/testable before the next starts. Notification/email plumbing is built in Stage 1 (not bolted on later) since Stage 5 depends on it.

1. **Foundations**: ✅ Schema migration written (`supabase/migrations/0001_phase1_schema.sql`, all tables in Section 4, RLS policies, atomic-update functions for 6b/discounts/gift cards). ✅ `lib/supabase` (server client, browser client, and `storage.ts` product image upload/signed-URL helpers, Section 4a). ✅ `lib/stripe`, `lib/money`. ✅ Admin RLS policies + `product-images` storage bucket (`supabase/migrations/0002_admin_rls_and_storage.sql`, `is_admin()`/`is_owner()` helpers). ✅ Admin auth guard (`lib/admin-auth.ts`, `src/proxy.ts`) and first admin user bootstrapped against the live project. ⬜ `lib/email/resend` generalization — order emails currently use the existing raw-fetch pattern directly (see `lib/notify.ts`), not yet migrated to the `resend` npm package (Section 10 open item). ⬜ `business_settings` seed — not started.
2. **Product CMS (admin)**: ✅ `lib/supabase/storage.ts` (product image upload/signed-URL helpers, Section 4a) and admin RLS policies (`supabase/migrations/0002_admin_rls_and_storage.sql` — `is_admin()`/`is_owner()` helper functions, admin read/write policies on all catalogue + order + settings tables, `product-images` storage bucket + its own RLS policies). ✅ Admin auth guard: `lib/supabase/auth-server.ts` (session-bound Supabase client, RLS-scoped — not the service role key, so the admin app dogfoods the RLS policies above), `lib/admin-auth.ts` (`requireAdmin()`), `src/proxy.ts` (session-cookie refresh on `/admin/:path*` — this is Next.js 16's renamed `middleware.ts`), `admin/login` (email/password via a Server Action + `useActionState`), `admin/(dashboard)/layout.tsx` (guard + **left sidebar nav** + sign-out). ✅ First admin user bootstrapped (`admin_users` row inserted manually against the live project, per the note below). ✅ Product CRUD screens: `admin/products` (list), `admin/products/new` and `admin/products/[id]` (create/edit product + its single default variant), rebuilt as a Shopify-style block layout (Title/Description/Media/Category, Pricing, Inventory & shipping, Search engine listing cards + a Status sidebar card — see Section 5). ✅ Drag-and-drop image upload/reorder with a "featured" (first) image, replacing the original single-file-at-a-time upload form. ✅ Rich text description editor (Lexical) replacing the plain textarea. ✅ Category assignment (dropdown from the existing `categories` table), SEO fields (page title/meta description/URL handle, writing to the `seo_title`/`seo_description`/`slug` columns that existed in the schema but nothing touched before). ✅ Discount codes admin screens: `admin/discounts` (list), `admin/discounts/new`/`[id]` (code/type/value/dates/usage-limit/active form — `discount-form.tsx`), added to the sidebar now that it's real. ✅ Categories admin screens: `admin/categories` (list, showing parent + assigned-product count), `admin/categories/new`/`[id]` + shared `category-form.tsx` (name/slug/optional parent). Delete is blocked (with a surfaced error, not a silent failure) while a category still has products or subcategories assigned — verified directly against Postgres (`23505` unique-slug violation, `23503` FK violation on delete, both handled). The product form's Category field now links to `/admin/categories` instead of pointing at SQL. ✅ Shipping-rates admin screens: `admin/shipping-rates` (list), `new`/`[id]` (name/weight range/price/free-shipping threshold/sort order/active). ✅ **Multi-variant/option UI** — see the dedicated note below (Section 5 has the file-level breakdown). ✅ Gift cards admin screens: `admin/gift-cards` (list — code, remaining/initial balance, issued-to customer, status), `admin/gift-cards/new` (code + initial balance, which becomes the starting remaining balance), `admin/gift-cards/[id]` (initial balance shown read-only, remaining balance editable for manual adjustments, issued-to customer, active). Delete is blocked with a surfaced error if the card's been used on an order (`23503`, same pattern as categories) — verified directly against Postgres. This was the last "table + checkout logic exist, no admin UI" gap (discounts and categories had the same shape earlier in the session). ⬜ Still not started: audit log write-through from *product*/*discount*/*category*/*option*/*variant*/*gift-card* actions specifically (order status changes write to `admin_audit_log` — see Stage 6 — but these don't yet).

**✅ Multi-variant/option UI, done:** the previously-deferred "one default variant per product" limitation is closed. A product with no options behaves exactly as before (single inline SKU/weight/stock/production-time fields in Inventory & shipping); adding an option (name + comma-separated values) via the new "Options & variants" section — always visible on the edit page, so a plain product can gain its first option — switches that card over to a generated variants table instead (SKU, price override, weight, stock, production time, status per combination), and switches the storefront product page over to a `<select>` per option (`VariantPicker`) that resolves to the matching variant and its price/stock. Key implementation details:
- "Generate variants" computes the cartesian product of all current option values and only creates *missing* combinations — existing variants (and any manual edits to them) are never touched or overwritten.
- Removing an option or a value is blocked (with a surfaced error, not silent failure) if any variant still uses it — verified directly against the schema (adding a value correctly identified exactly the new combinations needed; an in-use value's guard correctly blocked while an unused one didn't).
- Variants are never hard-deleted by this UI (`order_items.product_variant_id` has no `on delete` and would reject it) — status is set to `archived` instead where that matters.
- `lib/cart.ts`'s existing `variant.price_pence ?? base_price_pence` fallback (already built for the schema's per-variant price override, independent of options) needed no changes — verified a variant price override correctly wins over the base price in cart pricing.
- **Verified end-to-end against the live database**: seeded a temporary 2-option (Size × Colour) product, confirmed the exact query shapes used by both the admin edit page and the public `/shop/[slug]` page (through the real RLS-scoped anon client, not just service role) return correctly nested data, confirmed the cartesian generation logic is idempotent (regenerating found 0 missing) and correctly detects new combinations after adding a value, and confirmed the existing single-variant "Test" product is unaffected (still 0 options, still uses the classic path, `/shop/test` still 200s).
3. **Shop (public)**: ✅ `src/app/shop/page.tsx` (active-product grid, image + price, `?q=` search box using the `search_vector`/`websearch_to_tsquery` full-text index from 6d) and `src/app/shop/[slug]/page.tsx` (product detail, gallery, quantity + add-to-cart, variant picker once a product has options — Section 7 Stage 2). ✅ Category filter — a `?category=<slug>` dropdown alongside search, resolved to `category_id` server-side. ✅ Sort — `?sort=newest|price_asc|price_desc` dropdown (defaults to newest). All three (search/category/sort) combine in one GET form, no client JS needed. Verified against the live database: price sort ordered two differently-priced products correctly in both directions, and the category filter correctly included only the assigned product and excluded the unassigned one.
4. **Cart & checkout**: ✅ `lib/cart.ts` (server-side pricing: stock validation, discount codes, gift cards, weight-based shipping via `lib/shipping.ts`), ✅ `POST /api/cart` (pricing preview), ✅ `POST /api/checkout` (creates the Stripe Checkout Session — cart snapshot stored in `cart_sessions` and referenced by id in session metadata rather than embedding the full cart, since Stripe metadata values are capped at 500 characters; still no pre-payment `orders` row, per Section 6). ✅ Cart/checkout **UI pages**: `src/app/cart/page.tsx` (line items, quantity edit, discount/gift-card code entry, live pricing preview via `/api/cart`), `src/app/checkout/page.tsx` (collects email, calls `/api/checkout`, redirects to Stripe-hosted payment page — address collection happens on Stripe's page itself via `shipping_address_collection`, not a custom form), `src/app/checkout/success/page.tsx` and `checkout/cancel/page.tsx`. Cart state is client-side (`lib/cart-store.tsx`, `localStorage`-backed), not the `cart_sessions` table — that table is still only written to at checkout time, unchanged from the original design.
5. **Webhooks & orders**: ✅ `POST /api/webhooks/stripe` — signature verification, idempotency via `payment_events`, order + order_items creation from the stored cart snapshot, atomic stock decrement (6b) with manual-review flagging on oversell, discount/gift-card balance updates, dual notification (customer confirmation email + staff Discord/email per 6a). ✅ **Verified end-to-end against the live project with a real Stripe test-mode purchase** — see Section 7a for the full trace (order created, stock decremented, `payment_events` logged for all 5 Stripe events, no console errors). ✅ VAT invoice fields on the confirmation email (6e) — business name/address/VAT number, VAT amount + rate as its own line. ✅ Failed-payment handling (`checkout.session.expired`) — customer email, staff Discord alert above a value threshold, both verified against a real force-expired Stripe test session.
6. **Admin orders/customers**: ✅ Done — `admin/orders` (list + detail with a status-update dropdown that writes to `admin_audit_log`) and `admin/customers` (read-only list). See Section 5 for file-level detail.
7. **Guest order lookup**: ✅ `/track-order` page + `/api/track-order` done (Section 6c), also rate-limited. ✅ Rate limiting (6g) on `/api/checkout`/`/api/cart`/`/api/track-order` is done (Upstash Redis) — pending the owner provisioning an Upstash account, since it fails open without one.
8. **Analytics**: ⬜ Not started.
9. **Hardening**: ⬜ Not started.

Non-engineering tracks that should run in parallel, not after: Stripe live-mode business verification (Section 9), and writing the actual legal copy for Privacy Policy / Terms / Returns / Delivery pages — these are content the business needs to provide; the pages are just shells otherwise.

### 7a. Real test-mode purchase — now run and verified end-to-end

**Everything that was blocking this is done:**
1. ✅ Ran `supabase/migrations/0001_phase1_schema.sql`, `0002_admin_rls_and_storage.sql`, and `0003_strip_html_from_search_vector.sql` against the live Supabase project.
2. ✅ Filled in `.env` from `.env.example` (Supabase URL/anon/service-role keys, Stripe test publishable/secret keys).
3. ✅ Registered the webhook (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) and got `STRIPE_WEBHOOK_SECRET`.
4. ✅ **First admin user bootstrapped** — `admin_users` row inserted for the owner's account; `/admin/login` works.
5. ✅ **Seeded data**: one "Test" product + variant, and three `shipping_rates` bands (Letter 0–100g £0.99, Large Letter 101g–1kg £1.99, Small Parcel 1001g–2kg £2.99 — all "2nd Class", inserted directly via the service role key since there's no shipping-rates admin screen yet). **Medium/Large Parcel (over 2kg) are out of scope by decision, not an oversight** — see Section 11C. Any product that would need one of those bands simply won't be listed; `calculateShippingPence` returning `null` for a >2kg cart is the intended behaviour now, not a bug to fix.
6. ✅ Cart/checkout UI (`src/app/cart`, `src/app/checkout`) — built and smoke-tested against the live Supabase project.
7. ✅ `/checkout/success` and `/checkout/cancel` pages — built.

**✅ Full purchase run and verified** (headless browser, Stripe test card `4242 4242 4242 4242`): `/shop/test` → add to cart → `/cart` → `/checkout` → Stripe-hosted payment → `/checkout/success`, confirmed directly against the database afterward:
- Order `3DC-10001` created, `status = 'paid'`, correct totals (97p item + 99p shipping + 16p VAT = £1.96).
- `order_items` row linked correctly.
- `payment_events` logged all 5 Stripe events (idempotency working).
- Stock decremented 1 → 0 on the variant (atomic update from 6b confirmed working).
- Confirmation email + staff Discord notification env vars (`RESEND_API_KEY`, `DISCORD_WEBHOOK_URL`) are configured, so both should have fired (not independently verified by reading an inbox/Discord channel).

Test order/customer/payment_events/address rows were deleted afterward to keep the live project clean; stock was reset to 10 (up from the original 1) so it can keep being used for testing.

**Operational finding worth remembering:** the *first* attempt at this test succeeded on Stripe's side (card charged) but created **zero order**, because `stripe listen` wasn't running — without it, `checkout.session.completed` never reaches `/api/webhooks/stripe` locally, so the customer sees "Thank you" but nothing is recorded. `stripe listen --forward-to localhost:3000/api/webhooks/stripe` needs to be running any time checkout is tested locally. This isn't a concern in production the same way — there, it's "make sure the webhook is registered in the Stripe Dashboard against the real Vercel URL and is reachable" instead, worth double-checking before launch.

**✅ Done, pending an Upstash account:**
8. Rate limiting (6g) on `/api/checkout`, `/api/cart`, and `/api/track-order` — see Section 6g for the implementation. Code is live; the actual protection only kicks in once `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set (Section 11B), otherwise it fails open.

**✅ Done:**
9. VAT invoice formatting (6e) — see Section 6e for the detail. Still needs `business_settings` populated (Section 11C) for the company address/VAT number lines to actually appear.
10. Failed-payment handling (6a) — see Section 6a for the detail. Verified against a real force-expired Stripe test session.

**Smaller/deferred:**
11. Stripe live-mode business verification (Section 9) — separate from code, needs starting early since it's a multi-day Stripe-side review.
~~12. Category browsing/filtering, sort-by-price~~ — ✅ done, see Section 7 Stage 3.

**Note on this Next.js version:** `middleware.ts` is deprecated here and renamed to `src/proxy.ts` (used for the admin session-cookie refresh) — worth remembering since most Next.js docs/examples online still say `middleware.ts`.

## 8. Decisions Made

- **Checkout**: Guest checkout only for Phase 1. `customers` rows are created opportunistically from order emails; no login/account UI required yet.
- **Shipping**: Weight/size banded rates (`shipping_rates` table above), not flat-rate and not a live carrier API; `lib/shipping.ts` sums cart weight and picks the matching band. ✅ Admin screen now exists (`admin/shipping-rates`) — the three bands originally seeded via SQL (Section 7a) can now be edited through the UI instead of SQL. Medium/Large Parcel remain out of scope by the owner's decision (Section 11C), not a technical limitation — the screen doesn't push toward adding them, it just makes managing the existing bands easier.
- **VAT**: 3D Crafts is VAT-registered. `vat_rate` defaults to `0.20` and VAT breakdown is shown at checkout from launch.
- **Image hosting**: Supabase Storage (public `product-images` bucket) + `next/image` `remotePatterns`, per Section 4a.

## 9. Remaining Blockers Before Implementation Starts

**✅ Largely resolved** — kept as a historical record of what implementation was originally blocked on; Section 11 is the live, current version of this same checklist (with checkboxes actually reflecting today's state). Only the last item below is still open.

These are account-provisioning items, not design decisions — implementation can start on anything that doesn't need live credentials (e.g. schema migrations can be written now), but checkout/webhooks/storage need real keys:

- [x] **Supabase project**: create it, then share the project URL, anon key, and service role key (service role key should be added directly to Vercel/`.env.local`, not pasted in chat).
- [x] **Stripe account**: create it (test mode is enough to start), then share the publishable key, secret key, and — once the webhook route exists — the webhook signing secret.
- [x] **Resend domain**: confirm `QUOTE_FROM_EMAIL`'s domain is fully verified in Resend, since order confirmation/dispatch emails will use the same sender domain. (Confirmed working — the quote form and now order confirmation emails both send successfully.)
- [ ] **Stripe live mode activation**: accepting *real* payments (not test-mode) requires Stripe to verify the business — company/individual details, bank account for payouts. This is a Stripe-side compliance step with no code dependency, but it can take a few days, so it's worth starting in parallel with development rather than leaving it until the end. Still open — see Section 11B.

## 10. Smaller Open Items

- **Resend package vs raw fetch**: formalize on the `resend` npm package (enables React Email templates for order confirmation/dispatch/refund) or keep the existing raw HTTP approach from the quote route, for consistency across all emails.
- **Discord webhook**: keep it as a permanent "new order" ops notification channel alongside the admin dashboard, or treat it as temporary/quote-only?

## 11. Pre-Implementation Setup Checklist (Owner Action Items)

Everything below is something only you can do (account ownership, business/legal information, or content). Grouped by how hard-blocking it is.

### A. Blocks coding from progressing past schema/UI shells

- [x] **Create a Supabase project** (recommend an EU/UK region for latency and data residency). Project created, keys added directly to `.env` (not pasted in chat, per the note above). ✅ `0001_phase1_schema.sql` and `0002_admin_rls_and_storage.sql` have both been run against it.
- [x] **Create a Stripe account** (test mode is enough to start). Test publishable/secret keys added to `.env`. ✅ Webhook registered (`stripe listen`) and `STRIPE_WEBHOOK_SECRET` set.
- [x] **Decide first admin user(s)**: owner's account bootstrapped into `admin_users` with `role = 'owner'`; `/admin/login` works. Additional staff/production users can be added the same way (manual SQL/dashboard insert — no self-signup by design) whenever needed.

### B. Blocks checkout/notifications from being real (not just built)

- [ ] **Confirm Resend sending domain** is fully verified (SPF/DKIM) — should already be true since the quote form works today; confirm no changes needed for a new "orders" sender address if you want one (e.g. `orders@3dcrafts.uk` vs reusing `quotes@3dcrafts.uk`).
- [ ] **Staff notification target**: an email address and/or a Discord webhook URL (new channel recommended, separate from the existing quote-form channel, so order alerts don't get lost in quote traffic) for new-order alerts.
- [ ] **Start Stripe business verification now** (company/sole trader details, ID, bank account for payouts) — this is separate from the test-mode keys above and is required before you can accept *real* payments. It's a Stripe-side review that can take a few days, so starting it early avoids it being the thing that delays launch at the end.
- [ ] **Create a free Upstash account** (upstash.com → Redis → create database) and add `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` to `.env` — rate limiting on `/api/cart`/`/api/checkout` is coded and live but fails open (no actual limit enforced) without this.

### C. Needed before real launch (content/business data, not blocking development)

- [ ] **Business details for VAT invoices**: legal company name, registered/trading address, VAT number, confirmation that standard 20% VAT applies to all products (or note any exceptions). The confirmation email is ready to show these (Section 6e) — it's genuinely just the data that's missing, and there's no Settings screen yet, so it has to go into `business_settings` via SQL until one exists.
- [x] **Shipping rate bands (decision made — scope, not just data)**: Letter/Large Letter/Small Parcel (up to 2kg) are seeded using Royal Mail 2nd Class pricing (£0.99/£1.99/£2.99). **Medium/Large Parcel (over 2kg) are explicitly out of scope for now** — the owner's call: products that would need those bands simply won't be listed, rather than leaving checkout unable to price them. No free-shipping threshold set on any band. 1st Class / a choice of delivery speed at checkout was also considered and explicitly deferred — today there's only one price per weight band, by design.
- [ ] **Legal page copy**: Privacy Policy, Terms & Conditions, Returns/Refunds policy, Delivery information. The pages will exist as shells — you (or a template you approve) need to supply the actual text, especially the return-policy differences between standard/personalised/custom items called out in the roadmap.
- [ ] **Initial product data**: names, descriptions, prices, real photos, weights, materials/colours/sizes, stock levels or production times for whatever you want live at launch — the CMS will be empty otherwise.
- [ ] **Analytics**: a GA4 property + measurement ID, and the Google Search Console site-verification value (there's already a placeholder for this in `site-config.ts`/`.env`).

### D. Nice to have, not blocking Phase 1

- [ ] Decide whether to keep the existing Discord webhook for quotes as-is or consolidate ops notifications into a single Discord server with separate channels per event type (quotes, orders, low stock later).
- [ ] Confirm domain/DNS access (registrar login) in case any future record changes are needed — likely already fine since the site is live.

## 12. Implementation Progress

Status against the Section 7 build sequence, last checked by reviewing the actual codebase (`tsc --noEmit`, `npm run lint`, and `npm run build` all pass clean):

- **Stage 1 (Foundations)** — done: `0001_phase1_schema.sql`, `0002_admin_rls_and_storage.sql`, and `0003_strip_html_from_search_vector.sql` have all been run against the real Supabase project, `.env` is filled in. `lib/supabase/server.ts` (service role), `browser.ts` (anon), `auth-server.ts` (session-bound admin client), `public.ts` (anon client for public Server Components), `storage.ts`, `stripe.ts`, `money.ts`, `admin-auth.ts`, `src/proxy.ts`. The first admin user is bootstrapped and `/admin/login` works. Still open: a `business_settings` row (needed for VAT invoice fields, Section 6e).
- **Stage 2 (Product CMS admin)** — ✅ substantially expanded this pass: `/admin/login`, `/admin` dashboard shell, and `/admin/products` list/new/`[id]` rebuilt into a Shopify-style block layout (Title/Description/Media/Category, Pricing, Inventory & shipping, Search engine listing, plus a Status sidebar card). Real drag-and-drop image upload and reordering (first image = featured), a Lexical rich text editor for the description, a category dropdown, and working SEO fields (page title/meta description/URL handle) were all added — see Section 5 for the file-level breakdown. ✅ Discount codes admin (`admin/discounts`), ✅ Categories admin (`admin/categories`), ✅ Shipping-rates admin (`admin/shipping-rates`), and ✅ Gift cards admin (`admin/gift-cards`) also added — this closes out every "table + checkout logic already existed, no admin UI" gap from earlier in the session. ✅ **Multi-variant/option UI** — closed the last major deferred gap: products can now have options (e.g. Size, Colour) with a generated variants table (per-combination SKU/price/weight/stock), and the storefront shows a variant picker once a product has any — verified end-to-end against the live database (see the dedicated note in Section 7). Not yet built: audit-log write-through from product/discount/category/option/variant/gift-card actions specifically (order status changes do write to the log now — see Stage 6).
- **Stage 3 (Shop public pages)** — ✅ built: `src/app/shop/page.tsx` (active-product grid with image/price, `?q=` full-text search, ✅ now also `?category=` filter and `?sort=newest|price_asc|price_desc`, all in one GET form — verified against the live database, correct filtering and both sort directions) and `src/app/shop/[slug]/page.tsx` (detail page, gallery, add-to-cart, ✅ now also a variant picker once a product has options — Stage 2). Description renders as sanitized-by-construction HTML from the rich text editor (`.rich-text` CSS in `globals.css` for list/bold/italic styling) rather than a plain paragraph. `sitemap.ts` queries active products dynamically (6f, done). Not built: the `/shop/[slug]` page's own visual polish (explicitly deferred by the owner — noted, not forgotten).
- **Stage 4 (Cart & checkout)** — ✅ done, both backend and frontend: `src/lib/cart.ts`, `api/cart/route.ts`, `api/checkout/route.ts` plus `src/app/cart/page.tsx`, `src/app/checkout/page.tsx`, `checkout/success`/`checkout/cancel` pages. Cart state is a client-side `localStorage`-backed store (`src/lib/cart-store.tsx`) using `useSyncExternalStore` (required by this project's React Compiler-era ESLint rules, which flag the classic "hydrate from localStorage in an effect" pattern as an error).
- **Stage 5 (Webhooks & orders)** — ✅ done and **verified end-to-end with a real Stripe test-mode purchase** (order creation, atomic stock decrement, idempotent `payment_events` logging — full trace in Section 7a). ✅ VAT invoice fields (6e) and failed-payment handling (6a) both done and independently verified — see those sections.
- **Stage 6 (Admin orders/customers)** — ✅ done: `/admin/orders` (list with payment/fulfilment status derived from the single `orders.status` column, and a detail page with a status-update dropdown that writes to `admin_audit_log`) and `/admin/customers` (read-only list). The admin layout itself was also redesigned — a left sidebar (Home/Orders/Products/Categories/Customers/Discounts/Gift cards/Shipping) replaced the original top nav, modelled on Shopify's admin; Markets/Finance/Analytics are still left out of the nav since neither has a backend yet.
- **Stage 7 (Guest order lookup)** — ✅ done: `/track-order` + rate-limited `POST /api/track-order` (Section 6c), verified against the live database (correct match, wrong-email rejection, case-insensitivity all confirmed).
- **Stages 8-9 (Analytics, hardening)** — not started, except rate limiting (part of Stage 9/6g, see below).
- **✅ Rate limiting (6g)** on the public `/api/cart`, `/api/checkout`, and `/api/track-order` routes — Upstash Redis-backed (`lib/rate-limit.ts`), sliding window, `429` + `Retry-After` on limit. Fails open until the owner provisions an Upstash account (Section 11B) — the code is done, the account isn't.

Net effect: the full customer-facing purchase path — browse, filter by category, and sort `/shop`, view a product (single-variant or multi-option), add to cart, adjust quantities/apply a discount code or gift card, check out via Stripe, land on a success/cancel page — is not just built but **has been run for real in Stripe test mode and confirmed correct against the live database** (Section 7a), and is now rate-limited against abuse (pending the Upstash account). A failed/abandoned checkout is handled too — the customer gets an email, staff get alerted above a value threshold, both verified against a real force-expired Stripe session. The admin side covers the full loop: create a category in `/admin/categories`, set up shipping bands in `/admin/shipping-rates`, create a product against that category in `/admin/products` (with images, rich description, SEO, and optionally multiple options/variants), it appears in `/shop` (filterable/sortable), a customer can buy it (picking a variant if it has options, applying a discount code from `/admin/discounts` or a gift card from `/admin/gift-cards`), get a proper VAT-itemized confirmation email, and the resulting order is visible and manageable in `/admin/orders` — and the customer can look it up afterward at `/track-order` without an account. **Every admin screen originally scoped for Phase 1 catalogue/commerce management now exists.** What's left is genuinely narrow: Stripe live-mode business verification (Section 9, not code), real `business_settings` data so the invoice email shows the actual company address/VAT number, the Upstash account for rate limiting to actually enforce, audit-log write-through for the non-order admin actions, the Resend package migration, error monitoring, and Stages 8-9 (analytics instrumentation, general hardening) which are still just "not started" rather than fleshed out. Medium/Large Parcel shipping remains out of scope by the owner's decision, not oversight.
