# 3D Crafts

A Next.js App Router, TypeScript and Tailwind site for custom 3D-printing enquiries and a UK storefront. The public site includes product search, category filtering, product variants, a local-storage cart, Stripe-hosted checkout and guest order tracking. A Supabase-authenticated admin area manages products, categories, variants, images, discounts, gift cards, shipping rates, orders and customers.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and replace the example values needed for the features you are testing. Do not commit real credentials. If you already use an ignored `.env`, check it before adding `.env.local`: local values take precedence.
3. Set up a Supabase project and apply the SQL migrations in `supabase/migrations/` in numeric order. Configure an admin account in Supabase Auth and its `admin_users` record; there is no public admin sign-up.
4. Configure Stripe test-mode keys. For local webhook testing, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET` to its signing secret. Checkout completion creates orders from the verified webhook, not from the success page.
5. Run `npm run dev` and open http://localhost:3000. The admin login is at `/admin/login`.

The environment template documents Supabase, Stripe, Resend, Discord, site URL and Upstash variables. Quote submissions require Resend and a Discord webhook; without them the form directs customers to `hello@3dcrafts.uk`. Order email and staff notifications use the same services. Product images are stored in Supabase Storage, not in `public/`. Public cart, checkout and order-tracking rate limits **fail open** until the Upstash REST URL and token are configured.

## Checks

- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript
- `npm run build` — production build
- `npm audit --omit=dev` — production dependency advisories

There is currently no automated test script. The historical Stripe test-mode run is recorded in the [Phase 1 technical plan](3d-crafts-phase1-technical-plan.md), but it does not replace fresh end-to-end testing before launch.

## Next steps

**Before accepting live orders (owner and operations):**

- Complete Stripe live-mode verification, configure production keys and register the production webhook endpoint. Verify a real webhook reaches the deployed app before taking orders.
- Provision Upstash and check that cart, checkout and order-tracking rate limits are enforced.
- Add legal business details to `business_settings` for VAT invoices; confirm the Resend sender domain, staff notification destination and real shipping/product data.
- Supply and publish Privacy, Terms, Returns and Delivery content. These pages are not yet implemented.

**Engineering:**

- Add automated coverage for cart pricing, checkout, webhook retries/idempotency and order state changes, followed by a full test-mode purchase on the deployed integration.
- Harden webhook processing and monitoring, and extend admin audit-log writes beyond order-status updates.
- Track the remaining development-tooling advisories reported by `npm audit`; do not force a downgrade of `eslint-config-next` to an incompatible Next.js major version.
- Build analytics only after deciding on a consent approach for non-essential tracking.

The [Phase 1 technical plan](3d-crafts-phase1-technical-plan.md) contains the detailed implementation status and outstanding checklist; the [platform roadmap](3d-crafts-platform-vision-roadmap.md) describes later phases. Items marked as previously verified in those documents are historical reports, not a claim that production services were checked during this README update.
