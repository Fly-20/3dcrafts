# 3DCRAFTS HQ: All-in-One Business System, Technical Brief

*v0.6 · 2026-11-15 · Draft for review. Nothing is built until you sign this off.*

**Changes since v0.5:**
- Labour and design raised to **£15/h**; all examples recalculated (§9).
- New **Product Lab** area for testing scalable products every week (§12).
- New **Sales channels** section: Amazon Handmade, Facebook Marketplace, TikTok Shop, craft fairs (§13).
- New **Business readiness & risks** section (§14), **build rules** (§15) and **running costs** (§16).
- Etsy capture starts in **passive mode** (§6.1).
- Phases reordered by hours saved (§11).
- The single prioritised to-do list is now in the [action backlog](3d-crafts-action-backlog.md).

**Changes from v0.4 to v0.5:**
- Filament treated as £10/kg **inc VAT**, so £8.33 ex VAT.
- xTool cost £1,000, so the laser rate is now £0.46/h. All examples recalculated.
- Card postage is charged separately, so the current card price is profitable (§9.3).
- **Time-lapse module reviewed**: three issues to fix in Phase 0 (§7.1).
- New **Marketing → Plan** module (tasks, deadlines, scorecard, streak) backed by the [90-day marketing plan](3d-crafts-marketing-plan.md).
- Single user (you); Discord confirmed; P2S Developer mode OK.

**Changes from v0.3 to v0.4:**
- Design rate set to £10/h.
- Stripe is in sandbox (not live yet), so HQ **uses the same Supabase project as the website**, with backups before every migration (§3).
- Laser costing added for the **xTool D1 Pro 20W**, including sheet wastage (§9.1, example D).
- **FreeAgent** stays your accounts and VAT system, and HQ feeds it (§9.5).

Related documents: [Platform vision & roadmap](3d-crafts-platform-vision-roadmap.md) · [Phase 1 technical plan](3d-crafts-phase1-technical-plan.md)

**Business:** 3DCRAFTS (Edinburgh), 3D printing, laser cutting and engraving · **VAT registered (20%)**
**Channels:** Etsy *TheKeepsakeAndCo* · 3dcrafts.uk (this repo: Next.js 16, Supabase, Stripe, Resend, Discord, Upstash, on Vercel)
**Kit:** Bambu Lab P2S (£700; PLA/PETG, several colours) · xTool D1 Pro 20W laser (work area ~430 × 390 mm) · 3.6 mm hardwood plywood
**Accounts:** FreeAgent · **Stripe:** sandbox mode (site not taking live payments yet)

**Earlier changes (v0.2 → v0.3):**
- Reworked from "a CRM" into **3DCRAFTS HQ**, one system with separate areas for CRM, Workshop, Marketing, Website and Finance (§2).
- **Built into the existing `/admin` app** rather than a separate app, now that I've reviewed the repo (§3).
- Your figures applied (P2S £700, labour £10/h, Royal Mail £3.99, box £1.00), with all pricing examples recalculated and verified (§9).
- Notifications use your existing **Discord** setup instead of Telegram (§6.3).

---

## 1. Goals

### North star: keep the printers busy, profitably

> **Success = printers running ~18 hours a day on profitable jobs, with you spending ~5% of the time and the printer ~95%. Profit is reinvested in more printers (2 → 3 → 5), run as a 1–2 person business.**

| Measure | Now (Etsy, 15 Oct–14 Nov) | Month 3 (Feb 2027) | Month 6 (May 2027) | Month 12 (Nov 2027) |
|---|---|---|---|---|
| Revenue / month (all channels) | ~£617 (25 orders, avg £24.68) | £1,500–£2,000 | £3,000–£4,000 | £8,000–£10,000 |
| Printers | 1 (P2S), **busy ~4–5 h/day (~25%)** | **2** (2nd bought end Nov if the trigger is met) | **3** | **5+** |
| Average printer use | ~25% | 50% | 60% | 65–70% |
| Your minutes per printer-hour | ~5–10 (estimate) | ≤ 6 | ≤ 4 | ≤ 3 |
| Share of revenue from bulk (10+ units) and products | low | 25% | 40% | 50%+ |

*Printer targets are yours; revenue targets are my estimate of what those printers produce at the planned use.*

**What the numbers say (estimates, to be replaced by real data):**
- **One fully booked printer** (18 h × 30 days = 540 printer-hours) at ~£5–6 per printer-hour is about **£2,700–£3,200/month in sales**. After paying you £15/h for your time, it makes about £1 profit per printer-hour (~£540/month). **A new P2S (~£700) pays for itself in about 6 weeks of full use.**
- **Your time runs out before the printers do.** At 3–4 h/day, with about 40% kept for marketing and admin, you have ~60 making hours a month. Today's job mix needs 5–10 of your minutes per printer-hour, which is roughly one printer's worth. **Running 3–5 printers means getting down to ~2–3 minutes per printer-hour**: bulk runs (one design, 30–100 prints), batch plates, standard products, and HQ taking over the admin.
- **Etsy converts well (4.5% of visits become orders); the limit is traffic.** More listings and more visitors matter more than changing the shop.

**The jobs we want more of:** bulk and repeat orders where one design is printed many times: business and club orders, event favours, promotional items, short production runs for makers, Product Lab products. **The jobs we price to avoid losing money on:** design-heavy one-offs. The full design time is charged at £15/h+ and only waived above a set quantity.

**When to buy another printer:**
- **Normal rule:** existing printers average **≥ 12 h/day (~65%) for 2 weeks**, **or** confirmed orders would keep the new printer ≥ 6 h/day for the next month. Plus your minutes per printer-hour ≤ 5.
- **Printer 2 (end Nov 2026) can be bought earlier than the rule**, at today's ~25% use, because it also gives **backup** (a breakdown in December stops the business), **two colours/materials at once**, and Christmas capacity. Check on **Fri 27 Nov**: if bookings for December average ≥ 8 h/day, buy it.
- Printer use is shown on the HQ Today page from the workshop agent; until then, from Bambu print history.

### System goals

1. **One place to run the business:** open HQ, see what needs doing today, act on it.
2. **Every enquiry captured** from Etsy and the website, answered quickly with an accurate, competitive quote.
3. **Every project tracked** from first message through payment, production, delivery, time-lapse and review.
4. **Nothing reaches a customer or goes public without your approval.**
5. **Marketing runs on work you already do:** every job produces a time-lapse that becomes a customer keepsake and social content.
6. **Numbers you can trust:** cost, price, margin, VAT and channel performance for every job.

---

## 2. HQ structure (what you see when you open the system)

Yes, your structure makes sense. Here's how it maps out, including where today's admin pages move:

```
3DCRAFTS HQ  (/admin)
│
├── 🏠 Today ............ approvals waiting · new enquiries · SLA timers · jobs printing
│                         · posts scheduled today · alerts (capture failed, webhook errors)
│
├── 👥 CRM
│   ├── Inbox ........... every conversation: Etsy, website quote form, email replies
│   ├── Enquiries ....... pipeline board: new → quoting → quote sent → accepted → paid
│   ├── Projects ........ one record per job: specs, files, quotes, payment, production,
│   │                     delivery, tracking, time-lapse, review (everything about that job)
│   ├── Orders .......... all orders from every channel (web shop, custom, Etsy)   [existing, extended]
│   ├── Customers ....... full customer history: projects, orders, messages, consents, tags [existing, extended]
│   └── Approvals ....... everything waiting for your OK: replies, quotes, emails, posts
│
├── 🏭 Workshop
│   ├── Production queue  paid jobs by due date and machine; print/laser/finish/pack stages
│   ├── Machines ........ P2S live status and progress; laser
│   ├── Materials ....... filament and sheet stock, cost per kg/sheet, low-stock alerts
│   └── Time-lapses ..... capture, renders, QR labels, customer links             [existing, moved]
│
├── 📣 Marketing
│   ├── Plan ............ 90-day goals, weekly tasks with deadlines, overdue alerts, posting
│   │                     streak, Friday scorecard (auto-filled, posted to Discord)
│   ├── Overview ........ enquiries and revenue by source, cost per acquisition, top content
│   ├── Content ......... video/photo library generated from jobs; captions; renders
│   ├── Calendar ........ scheduled posts per platform, pillar balance, seasonal plan
│   ├── Campaigns ....... QR cards, leaflets, free-gift funnel, discount campaigns, UTMs
│   ├── Reviews ......... review requests and results (Etsy, Google)
│   ├── Email ........... opt-in lists, occasion reminders, newsletters
│   └── Etsy listings ... listing plan, keyword research (EverBee), listing performance
│
├── 🧪 Product Lab
│   ├── Pipeline ........ idea → researched → prototyping → test listing → traction? → scale / kill
│   ├── Research ........ EverBee findings, scorecard per idea (demand, competition, margin,
│   │                     minutes per unit, postage weight, safety rules, content potential)
│   ├── Batches ......... molds, casting/print batches, finished stock per product
│   └── Channel listings  where each product is listed (Etsy, website, Amazon, Marketplace)
│                         and how it performs per channel
│
├── 🌐 Website
│   ├── Products / Categories / Discounts / Gift cards / Shipping               [existing]
│   ├── Pages & SEO ..... homepage sections, FAQs, testimonials, sitemap status
│   └── Site health ..... Stripe webhook status, failed jobs, email delivery, rate limiting
│
├── 💷 Finance
│   ├── Pricing ......... quote calculator + cost settings (filament, machine, labour, fees)
│   ├── Profit .......... margin per project, product and channel
│   └── VAT ............. quarterly VAT summary (sales VAT; fees/expenses for reclaim); exports
│
└── ⚙️ Settings ......... business details, users & roles, integrations (Etsy, Stripe,
                          Resend, Discord, Claude, social), notification rules, style guide,
                          message templates, device tokens
```

This follows the admin structure in the roadmap (§14 of the vision doc) and pulls Quotes, Production, Campaigns, Analytics and Settings into these areas.

**Roles:** the existing `admin_users.role` values (owner / staff / production) control access. **Only the owner can approve outbound items.** A future helper with the `production` role would see Workshop only.

---

## 3. Architecture decision: extend the existing admin

v0.2 suggested a separate app. Having reviewed the repo, **HQ should be built into the existing `/admin` area of this app:**

| Reason | Detail |
|---|---|
| Foundations already exist | Supabase Auth with `admin_users` roles, `requireAdmin()`, `admin_audit_log`, `customers`, `orders` (already includes `custom` / `b2b` / `manual` order types), time-lapses with QR label PDFs, Resend and Discord helpers (`lib/notify.ts`), Upstash rate limiting, Stripe webhook with idempotency |
| One login, one place | What you asked for: open one system |
| Shared code | Pricing, money (`lib/money.ts`), VAT, shipping logic used by both shop and quotes |

**Keeping the shop safe while HQ grows:**
- **Additive migrations only** (`0006_…` onwards). No existing column is removed. The one loosening, `customers.email` becoming nullable, is backwards-compatible.
- **One database:** HQ uses the **same Supabase project as the website**. That's safe now because Stripe is in sandbox and no live orders exist yet. Safeguards:
  - a **backup before every migration**
  - additive-only changes
  - every change tried on a **Vercel preview deployment** first
  - test data clearly marked so it can be cleared before launch

  Once live orders start, a Supabase branch or a small dev project can be added for risky changes. No code changes are needed for that.
- **Heavy work runs off Vercel:** video rendering, printer connection and slicing run on a small **workshop agent** (laptop now, Raspberry Pi later). Background jobs use **Vercel Cron** plus **Upstash QStash** (Upstash is already in use).
- **Automated tests** for pricing, VAT and approval rules (money logic gets tests before it gets UI), extending the existing `tests/` setup.
- The Next.js 16 conventions in `AGENTS.md` are followed (e.g. `proxy.ts`, not middleware).

```
 ETSY ──notification email──▶ GMAIL ── Apps Script (every 1 min) ──┐
   ▲                                                               │ POST + secret
   │ reads pages · you press Send                                  ▼
┌──┴──────────────────┐   capture jobs / approved drafts   ┌──────────────────────────────┐
│ Chrome extension    │◀──────────────────────────────────▶│ 3dcrafts.uk (this repo)      │
└─────────────────────┘                                    │  public site + shop          │
┌─────────────────────┐   alerts + Approve/Reject buttons  │  /admin  = HQ                │──▶ Resend (approved only)
│ Discord (existing)  │◀──────────────────────────────────▶│  /api/*  webhooks, cron      │──▶ Etsy API (receipts, listings)
└─────────────────────┘                                    │                              │──▶ Claude API (draft/extract)
┌─────────────────────┐   print events, time-lapses,       └──────────────┬───────────────┘──▶ Social scheduler (approved only)
│ Workshop agent      │   render jobs                                     │
│ (P2S MQTT/FTPS,     │◀─────────────────────────────────────────────────▶│ Supabase: Postgres, Storage, Auth
│  ffmpeg, slicer CLI)│                                                   │ (existing project, shared with the site)
└─────────────────────┘
```

---

## 4. Constraints (unchanged from v0.2, summarised)

| # | Constraint | Design response |
|---|---|---|
| C1 | Etsy's API has no messaging endpoints | Chrome extension reads conversations in your logged-in browser |
| C2 | Etsy prohibits bots; automated **sending** is high risk | Extension reads only. **You press Send** |
| C3 | Etsy buyers must pay on Etsy; no steering off-platform | Reserved listings for Etsy jobs; Etsy drafts checked for links and off-Etsy wording |
| C4 | Etsy buyers can't be added to marketing lists without opt-in | Opt-in via the QR time-lapse page only |
| C5 | Extension needs Chrome open | Jobs queue up; Discord alerts arrive immediately from the email trigger |
| C6 | Bambu third-party LAN access needs LAN/Developer mode | Automatic time-lapse download needs it; manual upload fallback exists today |
| C7 | TikTok public posting needs an audited app | Post through a scheduling service |
| C8 | UK GDPR / PECR | Consent records for marketing and for featuring customer items |

---

## 5. The approval gate

Every outbound item (Etsy reply, quote, email, social post, review request, newsletter) is an `outbound_items` row:

```
draft → checked → approved → sent / posted        (rejected; any edit after approval → checked)
```

- **Enforced in the database.** Only an owner can approve. Approval stores `approved_by`, `approved_at` and a **hash of the exact content**. Send and post functions refuse anything whose content doesn't match the approved hash.
- **No auto-send setting exists.** Adding one would be a deliberate code change.
- Every action is written to the existing `admin_audit_log`.

**Automatic checks** run before anything reaches you:

| Check | |
|---|---|
| Price recompute | Quote recalculated from stored inputs; must match to the penny |
| Text vs numbers | Every £ figure, quantity, material, colour and date in the message matches the quote |
| VAT & totals | Lines + postage = total; VAT correct |
| Margin guard | Warns below floor margin; blocks below cost |
| Etsy policy | No external links, emails, phone numbers, Stripe links or "order on our website" in Etsy drafts |
| Missing info | Lists anything unspecified (size, colour, deadline, file) |
| Feasibility | Fits the P2S (256 × 256 × 256 mm) or laser bed; suitable material for the use |
| Tone & spelling | UK English, your style guide |
| Big job flag | Over £150 or more than 20 units: highlighted for a second look |

**Where you approve:** HQ → Approvals (main), or the **✅ Approve / ✏️ Open in HQ / ❌ Reject** buttons on the Discord alert for simple items. For Etsy, an approved draft appears in the extension's panel on that conversation: **Insert**, then **you press Send**.

---

## 6. CRM in detail

### 6.1 Etsy enquiries

1. **Trigger:** Gmail filter labels Etsy message notifications → **Google Apps Script** (inside your Google account) POSTs them to `/api/inbound/etsy-email` every minute.
2. HQ resolves the conversation link → creates or updates customer, conversation and enquiry → queues a **capture job** → Discord alert.
3. **Chrome extension** (Manifest V3), rolled out in two steps to protect the Etsy account:
   - **Step 1, passive mode (Phase 1):** when *you* open an Etsy conversation, the extension saves the full thread and attachments to HQ and shows the reply panel. No automatic tabs or background activity. The Discord alert from the email reminds you to open it.
   - **Step 2, background capture (optional, later):** only after a few weeks of passive mode working cleanly. Queued conversations are opened in background tabs, one at a time with random pauses.
   - Page selectors are served from HQ, so Etsy layout changes don't need an extension update.
4. AI extracts the specs → pricing engine builds the options → AI drafts the reply → checks → **Approvals**.
5. On acceptance, HQ gives you the **reserved listing** details (or tells the customer to buy quantity N of your £1.01 custom listing). The **Etsy receipts API** (polled every 15 min) marks the project paid and creates the order with `channel = etsy`.

### 6.2 Website enquiries

Today `/api/quote` only sends an email and a Discord message; nothing is stored. HQ changes that:

1. The form submission is **saved first** (customer, conversation, project in `new`), then notifications go out as they do now.
2. **Files go to a private Storage bucket** through signed upload URLs (the pattern already used for product images). This lifts the current 4 MB limit to ~50 MB, which matters for STL/STEP files.
3. Add **"How did you hear about us?"** and UTM capture for attribution.
4. A fixed acknowledgement email (you approve the template once; it contains no prices).
5. Approved quote → **Stripe Checkout link** for that quote → the existing webhook creates the order (`order_type = custom`) linked to the project.

### 6.3 Notifications: Discord

You already use Discord webhooks for quotes and orders, so HQ builds on that rather than adding Telegram:
- Channels: `#enquiries`, `#approvals`, `#production`, `#alerts`.
- A small **Discord bot** (an interactions endpoint at `/api/discord/interactions`) adds **Approve / Reject** buttons, checked against your Discord user ID and the owner role.

### 6.4 Projects (the centre of the CRM)

One **project** per job, whatever the channel:

`enquiry → needs_info → quoting → awaiting_approval → quote_sent → accepted → awaiting_payment → paid → in_design → in_production → post_processing → packed → shipped → delivered → review_requested → completed` (or `lost` with a reason)

The project page shows the message thread, specs, files (STL viewer), quote versions, approval history, linked order, production job, tracking, time-lapse and review. **SLA timers:** Discord nudge after 1 h in `enquiry`/`needs_info` (working hours), and a follow-up draft after 48 h in `quote_sent`.

### 6.5 Customers

The existing `customers` table becomes the full customer record:
- add `etsy_username`, `source`, `business_name`, `notes`, `first_seen_at`
- `email` becomes **nullable** (Etsy enquirers often have no email until they buy)
- existing `tags` and `marketing_consent` are kept and joined by a detailed `consents` table

---

## 7. Workshop

- **Production queue:** paid projects and shop orders by due date, machine, material and colour. Stages mirror the existing order statuses (`print_queue → printing → quality_check → packing → dispatched`), so web orders and custom projects appear in one queue.
- **P2S live status** (through the workshop agent, needs Developer mode): progress %, time remaining, finished/failed. Failed prints log material and time against the job's cost.
- **Job codes:** name plates `J1234_…` in Bambu Studio so time-lapses and print events match the right project automatically.
- **Materials:** spools and sheets with cost; grams used deducted per job; low-stock alerts.
- **Time-lapses** (existing module, extended):
  - linked to a project or order, not just an Etsy order ID
  - automatic download from the P2S
  - **ffmpeg renders** on the workshop agent: customer cut 16:9, vertical 9:16 for social, square with stills
  - the existing QR label PDF and email flow are kept

### 7.1 Existing time-lapse module: review (2026-11-15)

**What it does today:** admin uploads an MP4 (≤ 20 MB) with customer name, email and Etsy order ID. The customer is found or created and tagged *"Etsy — timelapse"*. A public `/timelapse/<slug>` page plays the video (not indexed; blocked in robots). A 4×6" **QR label PDF** is generated to print next to the Royal Mail label. An optional "watch your timelapse" email goes via Resend. The code is clean and follows the same patterns as the rest of the admin.

**Issues to fix in Phase 0** (before HQ builds on it):

| # | Issue | Effect | Fix |
|---|---|---|---|
| T1 | **Upload goes through a Server Action, but Vercel caps function request bodies at 4.5 MB.** `bodySizeLimit: "20mb"` only raises Next's own limit, not Vercel's platform limit. | Works locally, but on the live site **videos over ~4.5 MB will fail** (your notes say typical exports are ~5 MB) | Same approach you already used for product images: **signed upload URL, browser uploads straight to Supabase Storage**, Server Action only saves the record. Raise the cap to ~100 MB so uncompressed P2S time-lapses work too. |
| T2 | **The link slug defaults to the customer's name** (e.g. `/timelapse/sarah-smith`) | Guessable: someone could try names and see a stranger's first name, order number and video. Common names also clash. | Default to name + random suffix (`sarah-k7q2m9`). Existing links keep working. |
| T3 | **Customer email is required** | Etsy often doesn't share buyer emails, which blocks creating a time-lapse for those orders | Make email optional (QR card only); link to the Etsy order/project instead |

Phase 2 adds: linking to projects and orders (not just an Etsy order ID), the review link on the page (Etsy for Etsy orders; Google for local and website orders), optional opt-in for occasion reminders, and view tracking.

---

## 8. Marketing

### 8.1 Starting point (EverBee estimates)

- Etsy ~£140–£360/month; **86% from the top 3 listings**.
- **The "Custom 3D Print from STL" listing is now the top seller** (~17/month).
- **~0.5 new listings/month.**
- **4.9★, 100+ reviews, 260+ orders**: strong social proof.
- The website targets businesses; Etsy reaches gift buyers and custom work.

### 8.2 Positioning

> **"Tell us what you need. We'll design it, make it, and show you it being made."**

### 8.3 Content pillars

| Pillar | Channels |
|---|---|
| Made-for-you time-lapses | TikTok, Reels, Shorts |
| Problem → fixed (replacement parts, before/after) | TikTok, Shorts, Facebook groups |
| Personalised gifts & occasions | Pinterest, Instagram, Etsy video |
| For businesses (bakers, cafés, trades, events) | Instagram, LinkedIn, Google Business Profile |
| Behind the scenes & tips (PLA vs PETG, laser vs print) | Shorts, TikTok |
| Social proof (reviews over the finished item) | All |

### 8.4 Cadence

| Channel | Target |
|---|---|
| TikTok / Reels / Shorts (one video, three platforms) | 5 per week |
| Pinterest | 1–3 pins per day, batch-scheduled |
| Google Business Profile | 1 post per week |
| Facebook | 2 per week |
| LinkedIn | 1 per week |
| Etsy | 2–4 new listings per month |
| Email (opt-in only) | Monthly, plus occasion reminders |

### 8.5 Automated pipeline

Job finished → time-lapse rendered → AI drafts captions, hashtags and hook text per platform → **Approvals** → scheduler posts → performance pulled back into Marketing → Overview.

- The calendar auto-fills open slots with approved content.
- Weekly Discord nudge if fewer than 7 posts are queued.
- Best performers are offered again after 60–90 days.

### 8.6 Customer keepsake loop

QR card in every parcel → `/timelapse/<slug>` (existing page, extended):
- the video
- care tips
- **review link** (Etsy or Google)
- share button
- optional opt-in, including **occasion reminders** ("remind me before next year's birthday", sent 14 days before), a natural fit for the wooden cards

### 8.7 Seasonal plan

Prep starts about 6 weeks ahead of each date:

| When | Occasion |
|---|---|
| Now → ~18 Dec | Christmas (check Royal Mail last posting dates) |
| 14 Feb 2027 | Valentine's (wooden cards) |
| 7 Mar 2027 | Mother's Day (UK) |
| 28 Mar 2027 | Easter |
| May–Sep | Weddings |
| 20 Jun 2027 | Father's Day |
| Aug–Sep | Back to school |

### 8.8 Campaigns

QR cards, leaflets and the **free mystery keychain funnel** from the roadmap all share one campaign/UTM model, so Marketing → Overview shows enquiries, orders and cost per acquisition by source. **Acquisition cost feeds straight into pricing** (§9).

### 8.9 Publishing and consent

- Publishing goes through a scheduler with an API (e.g. Ayrshare; ~£20–£50/month). Until then, HQ produces a download pack of files and captions.
- "Happy for us to share a video of your item being made?" is **off by default**.
- Personalised items with names are never posted without explicit permission.
- Marketing email is opt-in only, with one-click unsubscribe.

---

## 9. Finance: pricing engine

Lives in `src/lib/pricing/`, used by quotes, website estimates and the checks, and **fully unit-tested**.

### 9.1 Settings (your figures applied)

| Setting | Value |
|---|---|
| Filament PLA / PETG | **£10/kg inc VAT = £8.33 ex VAT** (VAT reclaimed) · +10% waste · + AMS purge per colour change |
| P2S machine rate | depreciation £700 ÷ 5,000 h = £0.14 + electricity £0.04 + maintenance £0.05 = **£0.23/h** |
| Failure buffer | 5% (<6 h) · 10% (6–15 h) · 15% (>15 h) |
| Labour | **£15/h** (minimum; above the National Living Wage) · setup 10 min/job · post-processing 5–30 min/part. **Replaced by your real logged minutes** once you've tracked a month of jobs. |
| Design | **£15/h** · presets 0.5 / 2 / 5 h · business or high-value jobs can be priced on value (manual override with a note) |
| Packaging | **£1.00** per box (sizes can be added later) |
| Postage | **Royal Mail £3.99** (more services can be added) |
| Etsy fees | 6.5% transaction + 4% + £0.20 processing + ~£0.16 listing *(check current rates before go-live)* |
| Stripe fees | 1.5% + £0.20 *(check)* |
| Acquisition | Etsy £1.00/order, web £0.50/order (replaced by real figures from Marketing) |
| VAT | **Registered, 20%**, prices include VAT. VAT on fees treated as reclaimable |
| Markup | target 30% · floor 10% · minimum order **£10** |
| Rounding | round up to the next 50p |

**Laser (xTool D1 Pro 20W)**

| Setting | Value |
|---|---|
| Plywood 3.6 mm, 1830 × 607 mm (B&Q) | £16.70 inc VAT → **£13.92 ex VAT** (VAT reclaimed) = £12.53/m² before waste |
| **Sheet wastage** | **25% default**: offcuts too small to use, knots/warps, test burns, cutting the sheet down to the ~430 × 390 mm bed. Becomes **£16.70/m² of usable plywood (≈ £0.0017/cm²)** |
| Material per job | part bounding box + 5 mm margin per piece × pieces, at the usable rate (so waste is included automatically) |
| Laser machine rate | depreciation £1,000 ÷ 3,000 h = £0.33 + electricity incl. air assist ~£0.03 + maintenance (lens, honeycomb, air assist) £0.10 = **≈ £0.46/h** |
| Failure buffer | 10% (mis-cuts, fire marks) |
| Consumables | per job: masking tape, finishing oil, envelope, etc. (default £0.30) |
| Labour | setup + finishing (clean soot, sand, assemble) at £15/h |

Waste is a setting per material. HQ also tracks real usage (sheets bought vs jobs made), so after a couple of months the 25% can be replaced with your actual figure.

### 9.2 Formula

```
direct_cost = material + machine + labour + design + packaging + postage + acquisition
P (inc VAT) = (direct_cost × (1 + markup) + fixed_fees) / (1/1.2 − pct_fees)
final       = max(P, £10) rounded up to the next 50p
```

### 9.3 Worked examples (verified by script)

| Job | Direct cost | Etsy target | Etsy floor | Web target | Web floor |
|---|---|---|---|---|---|
| **A.** Small part from customer STL: 80 g PLA, 4 h, 20 min labour | £12.69 (web £12.19) | **£23.50** (profit £4.07) | £19.66 | **£20.00** (profit £3.98) | £16.63 |
| **B.** 20 keyrings: 240 g, 5 h plate, 50 min labour | £21.90 (web £21.40) | **£40.00** (£2.00 each, profit £6.88) | £33.57 | **£34.50** | £29.01 |
| **C.** Designed PETG piece: 600 g, 18 h, 2 h design, 45 min labour | £57.50 (web £57.00) | **£103.50** (profit £17.52) | £87.34 | **£91.00** | £76.86 |
| **D.** Laser wooden card: ~700 cm² plywood, 25 min laser, 25 min setup/finishing, envelope | £13.92 (web £13.42) | **£25.50** (profit £4.29) | £21.52 | **£22.00** | £18.29 |

All at £15/h labour and design. "Profit" is on top of paying yourself £15/h.

*Prices include postage. On Etsy, where postage is charged separately, the item price is the total minus the postage charge.*

Example A breakdown: filament £0.73 + machine £0.97 + labour £5.00 + box £1.00 + postage £3.99 + acquisition £1.00.
Example D breakdown: plywood £1.17 + laser £0.21 + labour £6.25 + consumables £0.30 + box £1.00 + postage £3.99 + acquisition £1.00.

**Check on your current card prices** (postage charged separately): at £15/h, £16.18 + £3.99 postage **pays you £15/h for the 25 minutes but leaves the business only ~£0.41 per card**.
- 30% needs an item price of about **£21.35**; the 10% floor is about **£17.53**.
- This assumes 25 minutes per card. **Batching** cards (several engraved per laser session, finished together) could roughly halve that, which matters more than the price.
- Suggested test: log real minutes for 10 cards, try **£18.99** on one card listing for a month, and compare conversion. Also check whether cards qualify for a cheaper Large Letter rate than £3.99.

**What the numbers show:**
- **Postage and the box are about 45% of the cost of a small job.** Charging postage separately on Etsy, or offering combined postage, would make small quotes look much more competitive.
- **Website prices come out ~12–17% cheaper** than Etsy for the same job because of lower fees. That's a good reason to grow the website channel, but **don't advertise the difference to Etsy buyers** (C3).
- **Labour is the biggest cost on small jobs** (Example A: £5.00 of £12.69). That's why scalable products (§12) and batching matter more than shaving material costs.
- **Design time drives larger jobs** (Example C: £30 of £57.50). Showing the design fee separately, and crediting it on bigger orders, helps acceptance.

### 9.4 Quote options

- Each quote offers **Standard / Premium (PETG or finer finish) / Express (+25–40%, priority, 1st class)**.
- Quantity breaks are calculated automatically.
- **"Kept on file" reorder price**: no setup or design on repeat orders.
- An EverBee market check of comparable listings sits next to each quote.

### 9.5 Profit & VAT

- Actual cost per project (real grams and hours, failed-print losses) against the quoted cost.
- Margin by channel, product and job type.
- **FreeAgent stays the system of record** for bookkeeping and VAT returns. HQ doesn't file anything. HQ's job is management numbers (real profit per job/channel, VAT estimate so there are no surprises) plus sending FreeAgent clean data:
  - **Phase 2:** CSV export of orders (date, channel, net, VAT, fees) in a FreeAgent-friendly format.
  - **Phase 4:** FreeAgent API integration. Paid website and custom orders create **FreeAgent invoices marked as paid** (Stripe payouts then match them in FreeAgent's bank feed). Etsy sales are summarised monthly with the fees split out. Materials bought (filament, plywood) can be logged in HQ and pushed as **bills**, which also keeps stock levels right.

---

## 10. Data model changes (additive migrations from `0006`)

| Change | Purpose |
|---|---|
| `customers`: email nullable; add `etsy_username`, `source`, `business_name`, `notes` | Etsy enquirers, attribution |
| `orders`: add `channel` (web/etsy/manual), `external_ref` (Etsy receipt), `project_id` | One order list across channels |
| `order_timelapses`: `etsy_order_id` nullable; add `project_id`, `order_id`, render fields | Link time-lapses to any project |
| **New:** `conversations`, `messages`, `capture_jobs`, `device_tokens` | Inbox, Etsy capture |
| **New:** `projects`, `project_files`, `quotes`, `quote_items` | Enquiries, quoting |
| **New:** `outbound_items` (+ existing `admin_audit_log`) | Approval gate |
| **New:** `machines`, `materials`, `material_movements`, `production_jobs` | Workshop |
| **New:** `content_assets`, `social_posts`, `campaigns`, `consents`, `occasion_reminders`, `review_requests` | Marketing |
| **New:** `pricing_settings`, `channel_fees`, `packaging`, `postage_services` (or extend `business_settings` / `shipping_rates`) | Finance |

All new tables use admin-only RLS through the existing `is_admin()`. The extension, Apps Script and workshop agent get **separate revocable tokens** (never the service-role key).

---

## 11. Delivery phases

| Phase | Scope | Result |
|---|---|---|
| **0: Groundwork** | **Fix time-lapse issues T1–T3** (§7.1); backup routine; HQ navigation shell (Today, CRM, Workshop, Product Lab, Marketing, Website, Finance, Settings) with existing pages moved in; pricing library + tests; **standalone quote calculator page** (useful from day one, before the rest of the CRM exists); **job time log** (start/stop per job); migration 0006 | Faster, consistent quoting now; real labour data starts |
| **Website go-live** *(milestone, mostly ops)* | Stripe live mode + production webhook; Upstash rate limiting; business/VAT details; legal pages reviewed (§14) | Site can take real orders before the SEO pages and social links go live |
| **1: CRM core** | Website quote form saved to the database + private file uploads; Projects; Inbox; quote builder; **approval gate + checks**; Discord alerts and buttons; Gmail Apps Script; **Chrome extension in passive mode** + reply panel | Every enquiry captured, priced, drafted and approved by you |
| **2: Orders, Workshop & Product Lab** | Stripe quote checkout; Etsy receipts sync; all-channel Orders; production queue; materials and finished stock; time-lapses linked to projects; QR keepsake page with reviews; **Product Lab pipeline and batches** | Every job tracked; product tests run in a structured way |
| **3: Marketing engine** | Marketing → Plan (tasks, deadlines, scorecard); workshop agent (P2S status, automatic time-lapse download, ffmpeg renders); captions; content calendar; scheduler publishing; consents; campaigns & attribution; occasion reminders | Regular, mostly automated posting from real jobs |
| **4: Finance, channels & optimisation** | Profit and VAT reports; FreeAgent integration; extra channel order import (Amazon); acceptance analytics and pricing suggestions; auto-slicing estimates; optional background Etsy capture; ads tracking | Data-driven pricing, less admin |

**Order of building** follows hours saved per week. After each phase, check: *did this save time or bring in money?* If not, adjust before starting the next phase.

---

## 12. Product Lab: testing scalable products every week

**Why:** custom one-offs pay well per job but cost the most labour, and labour is your biggest cost. Products made **in batches from a reusable master or mold** spread design and setup time over many units, can be listed on several channels, and become content. The goal is a portfolio: custom work (high value) + proven products (steady, scalable).

### 12.1 Product families to explore

| Family | How | Notes |
|---|---|---|
| **Printed products** | Print directly: planters, organisers, lamps, articulated/fidget items, personalised keyrings, cake toppers | Simplest; P2S time is the limit. Lamps need **electrical safety** (buy certified fittings). |
| **Cast from printed molds** | Print a master → **silicone mold** → cast many | Print once, cast dozens; frees the printer |
| ↳ Concrete / Jesmonite pots, trays, coasters | Pour, cure, demould, seal | **Heavy**: postage eats margin. Strong for local sales (Marketplace, fairs). Jesmonite is lighter and more premium. |
| ↳ Candles (soy/rapeseed wax) | Pour into molds or vessels | **Scented candles must carry CLP safety labelling** (fragrance hazard pictograms, UFI where required). Unscented sculptural candles are simpler. |
| ↳ Resin (coasters, keyrings) | Pour, cure | Ventilation and PPE; coasters must be heat-safe |
| **Laser products** | Engrave or cut in batches: cards, coasters, signs, ornaments, wedding sets | Batching per sheet is the key to labour cost |
| **Hybrid** | Laser-engraved lid + cast pot, printed stand + engraved plaque | Harder to copy, more premium |

### 12.2 Weekly testing loop

| Day | Step | Who / tool |
|---|---|---|
| **Monday** | **Research** with EverBee (bestsellers, niche demand, keyword volume, competition, price range) → score 3–5 ideas → pick **1 to test** this week | You + me (weekly session) |
| Tue–Thu | Prototype: design, print the master/mold, make 2–3 units, time every step | You; times logged in HQ |
| **Friday** | Photos + a short video, cost the product in HQ, **list it** (Etsy + website; Marketplace if local/bulky) | You; HQ pricing |
| **Weeks 2–4 after listing** | Measure views, favourites, add-to-baskets, sales, conversion | HQ + Etsy stats |
| **Day 30 decision** | **Scale** (more variants, more channels, batch stock) · **Iterate** (photos/title/price) · **Kill** (archive, keep the learning) | Scorecard below |

**Idea scorecard** (1–5 each; test only ideas scoring 25+ of 40): demand · competition gap · profit per unit · **minutes per unit at batch size** · postage size/weight · safety and compliance burden (5 = none) · fits our kit/skills · content potential.

**Kill/scale guide (first 30 days):** fewer than ~100 views means a listing/SEO problem (iterate once). Views but no favourites or sales means a product or price problem (iterate once, then kill). 3+ sales means scale: add variants, list on more channels, make a batch.

**Capacity guard:** at most **1 new test per week**, and never during peak custom weeks (e.g. 7–20 Dec). Custom orders always come first.

---

## 13. Sales channels

**Principle:** go deeper before wider. Every new channel adds listings, messages, stock and fulfilment to keep in sync. Add a channel when a **proven product** (≥3 sales elsewhere) is ready for it, not before.

| Channel | Verdict | When | Notes |
|---|---|---|---|
| **Etsy** | Core | now | Keep growing listings (Product Lab output) |
| **Website** | Core | after go-live | Lowest fees; your own customers |
| **Google Business Profile** | Core (local) | now | Not a shop, but drives local enquiries |
| **Facebook Marketplace (local)** | ✅ Use for testing and bulky items | now | Free, local Edinburgh buyers, collection or cash. Ideal for **concrete pots and other heavy items** and quick demand tests. Marketplace checkout/shipping isn't available in the UK, so it's local only. |
| **Amazon Handmade** | ✅ Worth applying, **amazon.co.uk first, not amazon.de** | after 3–5 proven products | Application and approval required (they check that items are made by you; confirm 3D-printed/laser items qualify for your categories). ~15% referral fee; monthly fee waived for approved Handmade sellers. **Selling into Germany/EU first means extra obligations as a UK seller**: an EU Responsible Person (GPSR), EU VAT handling, German packaging registration (LUCID), and slower, costlier shipping post-Brexit. Revisit the EU once UK works. |
| **TikTok Shop (UK)** | 🔜 Later | once videos regularly get traction | Fits the video-led plan: buy straight from the video. Set up when one product is selling on its own. |
| **Craft fairs / Edinburgh Christmas markets** | 🔜 Try one | spring | Fast real-world feedback, content, local B2B contacts |
| Not on the High Street, eBay | ⏸ Not now | — | High fees (NOTHS) / wrong audience (eBay) for now |

HQ treats each as an `orders.channel` value. Amazon orders get imported (Phase 4); Marketplace sales are entered manually as quick orders. Stock for batch products is shared across channels so nothing oversells.

---

## 14. Business readiness & risks

| Area | Risk | Action | When |
|---|---|---|---|
| **Insurance** | Liability if a part fails (appliance, car, child's item) or a product causes harm | Get **public + product liability** quotes (maker/craft policies) | Before go-live |
| **"Parts we don't make" list** | Safety-critical requests | Written policy in terms + quote form; HQ flags: vehicle brakes/steering/suspension, gas appliances, medical/PPE, load-bearing, child seats, weapons | Before go-live |
| **Food contact** | The site advertises cookie cutters and cake toppers; standard printed PLA isn't food-safe for repeated use | Food-safe filament for these lines; "single use / not for direct food contact" product wording; topper stems sleeved | Before go-live |
| **Children's items** | Small parts/choking; toy safety rules | Don't market as toys unless toy safety requirements are met; age warnings | Before go-live |
| **Candles** (Product Lab) | Legal labelling | CLP labels for scented candles; fire safety warning label | Before selling candles |
| **Copyright/trademarks** | Licensed characters, club badges, brand logos; Etsy takedowns | Decline policy; HQ flags likely-copyrighted requests | Phase 1 |
| **EU sales on Etsy** | Etsy requires product safety (GPSR) details for EU buyers | Check Etsy GPSR settings | This month |
| **Data protection** | HQ stores Etsy conversations and uses AI on them | Pay **ICO data protection fee** (set `NEXT_PUBLIC_ICO_REGISTRATION`); privacy policy covers AI processing, retention (e.g. delete enquiry data 2 years after last contact) | Before Phase 1 |
| **Returns on custom items** | Made-to-order/personalised items are exempt from the 14-day cancellation right | Confirm terms say so clearly | Before go-live |
| **Design ownership** | "Kept on file", reusing designs | Terms: you keep design files; customer owns the object; ask before turning a customer design into a product | Before go-live |
| **Etsy account safety** | Main income source | Passive extension first (§6.1); no automated sending; no off-Etsy steering | Always |
| **Backups** | Losing customer files breaks "kept on file" | Customer files in Supabase Storage (backed up) + weekly offsite copy of design files | Phase 0 |
| **Single point of failure** | Illness, holiday, machine breakdown | Etsy holiday mode + website notice; HQ pauses SLA timers; spares kit (nozzles, build plate, laser lens); filament low-stock alerts | Phase 2 (spares now) |

---

## 15. Build rules (agreed)

1. **Marketing doesn't wait for software.** The marketing plan runs by hand from 16 Nov.
2. **Build in order of hours saved per week**, and check after each phase that it saved time or brought in money.
3. **Time limit:** HQ building takes at most **half of your business hours** in any week; customer work comes first.
4. **Etsy safety first:** passive capture, human sending, no off-platform steering.
5. **Approval gate on everything outbound**, enforced in the database.
6. **Additive, tested, reversible changes**; backup before every migration; preview deploys.
7. **Real data over assumptions:** logged minutes, real fees and real channel costs replace defaults as soon as they exist.

---

## 16. Running costs

| Item | Why | Approx. |
|---|---|---|
| **Vercel Pro** | The Hobby plan is non-commercial only; a business site taking payments needs Pro | ~$20/month |
| **Supabase Pro** | Free plan pauses inactive projects and has no daily backups | ~$25/month |
| Claude API | Classify, extract, draft, check | a few £/month at current volume |
| Social scheduler | Phase 3 | £20–£50/month |
| Resend, Upstash, Discord | Free tiers sufficient for now | £0 |
| EverBee | Already subscribed | existing |
| **Total new** | | **~£60–£100/month** (≈ 15–25 orders' profit) |

Each is a deliberate decision; HQ's Finance area will show these as a monthly overhead line.

---

## 17. Open questions

**Answered:**
- labour and design £15/h (raised from £10)
- Stripe in sandbox
- same Supabase project
- xTool D1 Pro 20W (£1,000) with B&Q 3.6 mm plywood
- FreeAgent
- Etsy postage charged separately
- filament price inc VAT
- Discord
- single user
- TikTok exists, Instagram to add (channel plan in the [marketing plan](3d-crafts-marketing-plan.md))
- P2S Developer mode OK

**Still open:**
1. **Past jobs and Etsy replies:** you'll send these later.
2. **Have you uploaded a time-lapse over ~4.5 MB on the live site?** It should fail (T1). Confirming that tells us whether any customers have been affected.
3. **Current Google review count** and the baselines in week 1 of the marketing plan.
4. **Do you already have business insurance** (public/product liability)?
5. **Cake toppers and cookie cutters:** what filament are they made from today, and are they sold as reusable?
6. **Have you already set up Etsy's EU product safety (GPSR) details?**
