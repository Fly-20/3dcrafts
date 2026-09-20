# 3D Crafts Platform Vision & Roadmap

## 1. Larger Vision

3D Crafts should grow from a simple 3D printing website into a full direct-to-consumer, custom-manufacturing, and business operations platform capable of serving customers throughout the UK.

The long-term goal is to make 3D Crafts a recognised UK 3D printing brand where customers can:

- Discover the business and understand what 3D Crafts does.
- Browse and purchase ready-made 3D printed products.
- Personalise selected products.
- Upload STL / 3MF / other supported files and request custom prints.
- Receive professional quotes.
- Approve and pay for custom work online.
- Track orders from payment through production and dispatch.
- Reorder previous custom products easily.
- Contact 3D Crafts for one-off, repeat, consumer, and business requirements.
- Discover 3D Crafts through search, leaflets, QR campaigns, referrals, social media, marketplaces, local advertising, and word of mouth.
- Build an ongoing relationship with the brand through useful transactional communication and consent-based marketing.

The platform should also become the internal operating system for the business.

It should allow 3D Crafts to manage:

- Products
- Product variants
- Pricing
- Margins
- Materials
- Customers
- Orders
- Quotes
- Uploaded files
- Print jobs
- Production queues
- Quality control
- Packing
- Dispatch
- Refunds
- Reprints
- Campaigns
- Email communication
- Analytics
- Customer acquisition
- B2B customers
- Repeat orders
- Referrals
- Production capacity

The platform should be designed around a simple long-term principle:

> 3D Crafts should be able to help anyone in the UK who needs something 3D printed, whether that is a ready-made product, a personalised item, a replacement part, a one-off prototype, a recurring business component, or a completely custom request.

The immediate objective is not to build every advanced feature before launch.

The objective is to build the correct foundations now so the platform can grow from a small operation with one printer into a large UK-wide 3D printing and manufacturing business without requiring a complete rebuild.

## 2. Core Business Model

The platform should support several complementary revenue and acquisition models.

### 2.1 Ready-Made Ecommerce

Customers browse products, configure options, add products to cart, pay online, and receive their order.

Typical categories may include home organisation, desk and office, kitchen, gifts, keychains, decor, personalised products, replacement parts, accessories, and seasonal products.

Products may be held in stock, made to order, personalised, available in multiple materials or colours, available in different sizes, or available with optional extras.

### 2.2 Promotions, Discounts & Gift Cards

To compete with Shopify-style stores, the platform should eventually support discount codes (percentage, fixed amount, free shipping), automatic promotions (e.g. spend thresholds, first-order discounts), and gift cards / store credit that can be purchased, redeemed, and partially spent across multiple orders. Discount and gift card usage should be tracked per customer and per order for reporting.

### 2.3 Custom 3D Printing

Customers should be able to submit their own requirements. They may upload an STL, 3MF, OBJ, or another supported design format, describe an item without having a print-ready file, request a replacement part, request a prototype, request a personalised design, request multiple quantities, or request recurring production.

The platform should support:

Request → Review → Quote → Customer Approval → Payment → Production → Quality Control → Dispatch → Completion

### 2.4 Local and UK-Wide Customer Acquisition

The business should support customers from Edinburgh initially while being designed to serve the whole UK.

Potential acquisition channels include Google Search, Google Business Profile, organic SEO, direct traffic, social media, leaflets, door-to-door campaigns, QR codes, packaging inserts, local events, markets, word of mouth, referrals, partnerships, B2B outreach, Etsy and other marketplaces, and repeat customers.

Each source should eventually be measurable.

### 2.5 Free Gift Acquisition Funnel

3D Crafts can use a complimentary mystery magnetic keychain as an acquisition and brand-awareness mechanism.

The objective is to introduce customers to the 3D Crafts brand, tell the story behind the business, explain how products are made, demonstrate print quality, encourage future brand recognition, capture fulfilment details, capture optional marketing consent, measure acquisition sources, encourage future direct purchases, and create referral and word-of-mouth opportunities.

Campaign pages should remain focused on thank you, brand story, how the product was made, local / UK identity, free gift, optional consent, and discovery of the wider 3D Crafts offering.

Gift claims should remain distinct from normal paid ecommerce orders in reporting.

## 3. Platform Principles

### 3.1 Seamless Product Management

Adding a new product must be simple. The business should never need code changes simply to launch a product.

An admin should be able to create a product, upload images, add video, set title and description, assign category, set price, set VAT behaviour, add material/colour/size options, create variants, set SKU, dimensions, weight and production time, set stock or made-to-order behaviour, add SEO data, add related products, publish, unpublish, duplicate, and archive products.

The goal should be:

> A new product can be created and published in minutes without touching the codebase.

### 3.2 Made-to-Order First

The platform should recognise that 3D Crafts is a manufacturing business, not just a warehouse.

The system should support in-stock, made-to-order, pre-order, custom quote, and temporarily unavailable states.

### 3.3 One Customer Record

Every customer should eventually have one central record containing name, email, phone, addresses, orders, quotes, gift claims, uploaded files, marketing consent, acquisition source, lifetime spend, refunds, reprints, notes, B2B status, and saved designs.

### 3.4 One Operating System

The platform should become the central source of truth for the business and bring together direct website orders, custom print requests, quotes, gift claims, B2B orders, manual/local orders, marketplace-originated jobs, referrals, and repeat production.

### 3.5 Measure Everything Important

The business should know where customers came from, which campaigns work, which products sell, which products are profitable, which products consume excessive printer time, which customers return, which quotes convert, how long production takes, and where fulfilment bottlenecks occur.

### 3.6 Scale Without Rebuilding

The architecture should support growth from one printer and a few orders per week to multiple printers, multiple operators, hundreds or thousands of monthly orders, UK-wide fulfilment, and consumer and B2B customers.

## 4. Proposed Technology Direction

- Frontend: Next.js, TypeScript, Tailwind CSS
- Hosting: Vercel
- Database: PostgreSQL through Supabase
- Authentication: Supabase Auth
- File Storage: Supabase Storage initially
- Payments: Stripe
- Transactional Email: Resend
- Website Analytics: GA4 or equivalent
- Internal Analytics: PostgreSQL / Supabase data powering custom dashboards
- CMS: Custom admin system inside the 3D Crafts platform

The architecture should remain modular enough to replace or expand individual services later if scale requires it.

## 5. Phase 1: Commerce Foundation

### Objective

Launch a reliable ecommerce platform capable of taking real customer orders while preserving the long-term architecture.

### Requirements

#### Public Website
- Homepage
- About
- Contact
- FAQ
- Shop
- Collection/category pages
- Product pages
- Cart
- Checkout entry point
- Delivery information
- Returns information
- Privacy policy
- Terms and conditions
- Product search with filtering and sorting (category, material, price, availability)
- Cookie consent banner (required before loading GA4 / non-essential analytics)

#### Product Management
- Create, edit, duplicate, archive product
- Product images and optional video
- Product description
- Price and VAT handling
- Category
- SKU
- Product status
- Material options
- Colour options
- Size options
- Variants
- Weight
- Dimensions
- Estimated production time
- Stock or made-to-order status
- Stock quantity tracking with oversell prevention for in-stock products
- SEO metadata
- Related products

#### Cart and Checkout
- Add/remove products
- Change quantity
- Variant selection
- Discount code redemption (percentage, fixed amount, free shipping)
- Gift card / store credit redemption
- Shipping calculation
- Stripe Checkout
- UK card support
- Apple Pay / Google Pay where supported
- Successful payment handling
- Failed payment handling
- Payment webhook processing

#### Orders
- Unique order number
- Customer details
- Products and variants
- Shipping
- VAT
- Discounts
- Payment reference
- Order status
- Internal notes

#### Order Statuses
New → Paid → Print Queue → Printing → Quality Check → Packing → Dispatched → Completed

#### Transactional Email
- Order confirmation
- Dispatch confirmation
- Refund confirmation
- Failed payment / action required where useful

#### Admin
- Secure admin login
- Dashboard
- Orders
- Products
- Customers
- Basic settings
- Role-based access control (e.g. owner, staff, production-only)
- Admin activity / audit log (who changed what, and when)

#### Analytics
- Revenue
- Orders
- Average order value
- Best-selling products
- Traffic source
- Conversion tracking

## 6. Phase 2: Custom Print & Quote System

### Objective

Allow customers anywhere in the UK to submit custom 3D-printing requirements and move from enquiry to paid production without relying on manual back-and-forth.

### Requirements

#### Custom Print Landing Page
- Explain service
- Explain supported materials
- Explain typical use cases
- Explain process
- Show examples
- Request quote CTA

#### Quote Request Form
- Name
- Email
- Phone
- Company
- Quantity
- Material preference
- Colour preference
- Dimensions
- Intended use
- Deadline
- Notes
- Delivery postcode
- File upload

#### Supported File Handling
Initial: STL, 3MF, OBJ. Later: STEP/STP/CAD formats where useful.

#### File Security
- Private storage
- Signed URLs
- Access control
- File ownership
- Retention policy
- Manual deletion
- Optional save-for-reorder

#### Quote Admin
- View request
- Download file
- Add internal notes
- Add print estimate
- Add material cost
- Add setup/design fee
- Add postage
- Add VAT
- Add discount
- Set expiry
- Send quote

#### Quote Journey
Requested → Under Review → Quote Ready → Quote Sent → Approved → Paid → Production

Additional states: Declined, Expired, Needs Information, Cancelled.

#### Customer Quote Page
- Quote breakdown
- Files
- Specification
- Delivery
- VAT
- Total
- Approve
- Decline
- Pay

#### Quote to Order
When paid, create order, preserve quote history, and move automatically into production workflow.

## 7. Phase 3: Free Gift & Acquisition Funnels

### Objective

Turn physical marketing, packaging, local campaigns, and other channels into measurable customer-acquisition funnels.

### Requirements

#### Gift Landing Page
- Thank-you message
- Brand story
- How products are made
- Edinburgh / UK positioning
- Example mystery keychains
- Claim CTA

#### Gift Claim
- Name
- Email
- Delivery address
- Optional phone if required

#### Marketing Consent
- Separate
- Unticked by default
- Timestamped
- Consent wording/version stored
- Source stored

#### Gift Order Type
Gift claims should be distinct from retail orders, e.g. `order_type = gift`.

#### Campaign Attribution
Store source, medium, campaign, QR identifier, landing page, first visit, and claim date.

#### Campaign Dashboard
- QR scans
- Landing-page visitors
- Gift claims
- Marketing opt-ins
- Paid orders
- Revenue
- Conversion rate
- Customer acquisition cost

#### Abuse Prevention
- Rate limiting
- Duplicate detection
- One claim per campaign/address rules
- Email validation
- Optional claim tokens
- Fraud monitoring

## 8. Phase 4: Production Management

### Objective

Make the platform useful for actually operating the manufacturing side of the business.

### Requirements

#### Production Queue
Show order, product, quantity, material, colour, printer requirement, estimated print time, priority, and deadline.

#### Job Status
- Waiting
- Scheduled
- Printing
- Failed
- Reprint Required
- Complete
- QC
- Packed

#### Print Batching
Group similar jobs by material, colour, product, printer, and deadline.

#### Printer Management
Support printer name, model, availability, current job, and maintenance state.

#### Production Capacity
Track estimated queue hours, available printer hours, daily capacity, production backlog, and estimated dispatch dates.

#### Dynamic Lead Times
Product pages should eventually use production capacity to show realistic dispatch estimates.

#### Failed Prints
Record reason, material wasted, time lost, reprint created, and related order.

## 9. Phase 5: Product Economics & Inventory

### Objective

Understand the true profitability of every product and prevent unprofitable growth.

### Requirements

#### Product Costing
Each product should support:
- Filament grams
- Filament cost per kg
- Material cost
- Print time
- Estimated electricity
- Machine cost allocation
- Packaging
- Postage
- Stripe fees
- VAT
- Failure allowance
- Labour allowance
- Target margin

#### Profitability
Show gross revenue, net revenue, estimated variable cost, contribution margin, margin percentage, and profit per printer hour.

#### Material Inventory
Track material type, brand, colour, spool quantity, weight remaining, cost per kg, supplier, and reorder level.

#### Finished Goods Inventory
Separately from raw material stock, track on-hand quantity for in-stock/ready-made products and variants, reserve stock against unfulfilled orders, prevent overselling, and trigger restock/production decisions when finished stock runs low.

#### Material Planning
Estimate material required for current orders, quotes, and the production queue.

#### Low Stock Alerts
Alert when materials fall below configured levels.

## 10. Phase 6: CRM, Customer Accounts & Retention

### Objective

Build lasting customer relationships and encourage repeat purchasing.

### Requirements

#### Customer Accounts
Customers can eventually view orders, tracking, quotes, saved addresses, saved designs, previous custom prints, and reorder options.

#### Reorder
Support reordering previous retail products, reprinting previous custom files, and repeating B2B jobs.

#### Customer CRM
Admin view should include total orders, lifetime value, last order, acquisition source, gift claims, quotes, marketing permission, notes, refunds, and support history.

#### Segmentation
Examples: Edinburgh, Scotland, UK, B2B, gift claimers, repeat customers, high-value customers, custom-print customers, and lapsed customers.

#### Marketing
Consent-based campaigns for new products, seasonal launches, offers, custom-print examples, educational content, giveaways, and re-engagement.

#### Abandoned Cart Recovery
Capture email at checkout before payment completes, detect abandoned carts, and send consent-based reminder emails with an option to resume checkout, including any active discount code.

## 11. Phase 7: B2B & Trade

### Objective

Allow 3D Crafts to serve recurring business customers and move beyond low-value consumer orders.

### Requirements
- Business accounts
- Company and VAT details
- Billing/delivery addresses
- Trade pricing
- Volume pricing
- Customer-specific pricing
- Saved production jobs
- Repeat-order workflows
- Purchase order support later
- B2B order history
- Batch fulfilment
- Direct-to-customer fulfilment where required

## 12. Phase 8: Referrals, Reviews & Community

### Objective

Turn existing customers into acquisition channels.

### Requirements
- Unique referral codes
- Referral URLs
- Reward tracking
- Product reviews
- Photo reviews
- Custom printing reviews
- Verified purchase indicator
- UGC image uploads
- Social tagging
- Permission to reuse
- Mystery gift variants and collectable editions later

## 13. Phase 9: Advanced Automation & Scale

### Objective

Reduce manual work as order volume grows.

### Possible Requirements
- Shipping API integration
- Label creation
- Tracking number generation
- Bulk label printing
- Printer assignment
- Automatic scheduling
- Print-farm dashboard
- STL analysis for indicative quoting
- Accounting integration
- VAT exports
- Stripe reconciliation
- Marketplace order consolidation where commercially appropriate

## 14. Admin Platform Structure

Suggested top-level admin navigation:

### Dashboard
Revenue, orders, quotes, production, alerts, campaigns.

### Orders
Retail, gift, custom, B2B, manual.

### Products
Products, categories, variants, materials, inventory.

### Quotes
New, reviewing, sent, accepted, expired.

### Production
Queue, jobs, printers, batches, failures, QC.

### Customers
Customers, businesses, segments, marketing consent.

### Campaigns
QR codes, leaflets, referrals, gift campaigns, attribution.

### Analytics
Revenue, products, customers, acquisition, production, profitability.

### Content
Homepage, pages, FAQs, SEO, blog/guides.

### Settings
Shipping, VAT, payments, email, materials, order statuses, admin users and roles, discount codes, gift cards.

## 15. Analytics Requirements

The platform should eventually answer:

### Sales
- Revenue today/month
- Average order value
- Net revenue after VAT
- Estimated margin

### Product
- Best sellers
- Most profitable products
- Highest printer-time products
- Highest failure-rate products

### Customer
- Repeat customer rate
- Lifetime value
- Most valuable customers
- Acquisition source

### Acquisition
- QR campaign performance
- Postcode performance
- Channel revenue
- Customer acquisition cost

### Quotes
- Quote requests
- Quote conversion
- Average quote value

### Production
- Current backlog
- Print hours queued
- Average fulfilment time
- Reprint rate
- Failure rate
- Material consumption

## 16. Legal, Security & Operational Requirements

### Customer Data
- Secure storage
- Access control
- Data minimisation
- Export/deletion process
- Privacy policy

### Marketing Consent
- Explicit where required
- Separate from fulfilment
- Timestamped
- Versioned
- Revocable

### Cookie & Analytics Consent
- Consent banner shown before non-essential analytics load
- Essential vs non-essential cookie categories
- Consent choice stored and respected on return visits

### File Security
- Private files
- Signed access links
- Retention rules
- Access logging where appropriate

### Payment Security
- Stripe-hosted payment flow where possible
- Do not store card details

### Reliability
- Idempotent payment webhooks
- Order/payment reconciliation
- Error logging
- Monitoring
- Retry handling

### Backups
- Database backups
- File backup strategy
- Recovery process

### Returns & Refunds
Support differences between standard products, personalised products, custom-manufactured items, defective products, and damaged deliveries.

## 17. SEO & National Growth

The platform should be built to support long-term organic acquisition across the UK.

Potential search themes include:
- 3D printing service UK
- 3D printing service Edinburgh
- custom 3D printing UK
- 3D printing Scotland
- replacement parts 3D printing
- prototype 3D printing UK
- custom STL printing
- personalised 3D printed gifts
- 3D printed organisers UK

### SEO Requirements
- Editable metadata
- Clean URLs
- Product structured data
- Organisation structured data
- Local business schema where appropriate
- Canonical URLs
- Sitemap
- Robots configuration
- Fast pages
- Image optimisation
- Category content
- Guides/blog capability

The website should ultimately support dedicated pages around services, materials, industries, locations, and common use cases.

## 18. UX Principles

The platform should always prioritise:
- Fast mobile experience
- Minimal friction
- Clear pricing
- Clear lead times
- Clear delivery information
- Strong imagery
- Easy product configuration
- Guest checkout
- Trust signals
- Local identity
- Clear custom-print CTA
- Accessibility
- Simple navigation

Customers should never need technical 3D-printing knowledge to purchase.

## 19. Product Launch Workflow

Adding products should be one of the fastest workflows in the platform.

Suggested flow:
1. Create product
2. Enter title
3. Choose category
4. Upload images
5. Add description
6. Set price
7. Configure materials
8. Configure colours
9. Configure variants
10. Set production time
11. Add cost data
12. Add SEO
13. Preview
14. Publish

Later improvements:
- Duplicate product
- Bulk upload
- CSV import/export
- AI-assisted descriptions
- AI-assisted SEO
- Bulk price changes
- Bulk category updates

## 20. Recommended Build Priority

### Phase 1 — Must Launch
- Product CMS
- Shop
- Product pages
- Cart
- Stripe
- Orders
- Customers
- Admin
- Transactional email
- Basic analytics

### Phase 2 — High Business Value
- Custom STL upload
- Quote system
- Quote payment
- Custom orders
- Secure file storage

### Phase 3 — Acquisition
- Free gift landing page
- QR campaigns
- Leaflet attribution
- Gift claim flow
- Consent tracking

### Phase 4 — Operations
- Production queue
- QC
- Batching
- Failed prints
- Capacity planning

### Phase 5 — Profitability
- Costing
- Material inventory
- Margin reporting
- Printer-hour profitability

### Phase 6 — Retention
- Customer accounts
- Reorder
- Marketing
- Segmentation

### Phase 7 — B2B
- Business accounts
- Repeat jobs
- Trade pricing
- Purchase orders

### Phase 8 — Growth
- Referrals
- Reviews
- UGC
- Loyalty

### Phase 9 — Automation
- Shipping integration
- Print-farm scheduling
- Automated quote assistance
- Accounting integration
- Marketplace consolidation

## 21. What Success Looks Like

The platform is successful when:

- A consumer can discover a product, buy it, receive updates, and receive it without manual intervention.
- A customer with an STL can submit it, receive a quote, approve it, pay, and receive the finished print through one connected journey.
- A business can reorder a recurring component without explaining the requirement again.
- A new product can be launched in minutes.
- A QR campaign can be measured from scan through to revenue.
- Every order can be tracked through production.
- The business can see exactly what needs printing today.
- The business knows which products generate real profit.
- The business knows when printer capacity is becoming constrained.
- Customers receive professional communication automatically.
- 3D Crafts can grow from Edinburgh into a recognisable UK-wide 3D printing brand without rebuilding the platform.

## 22. Long-Term North Star

The long-term ambition should be bigger than ecommerce.

3D Crafts should aim to become:

> A trusted UK platform for turning ideas, files, replacement parts, personalised products, business requirements, and everyday problems into professionally manufactured 3D-printed products.

A customer should eventually be able to think:

> "I need this 3D printed."

and immediately think:

> "Send it to 3D Crafts."

The platform should be built to support that ambition.
