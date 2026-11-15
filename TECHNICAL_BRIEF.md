# 3DCRAFTS Studio: CRM, Quoting & Marketing Automation, Technical Brief

*v0.2 · 2026-11-15 · Draft for review. Nothing is built until you sign this off.*

**Business:** 3DCRAFTS (Edinburgh), 3D printing, laser cutting and engraving
**Channels:** Etsy shop *TheKeepsakeAndCo* · website 3dcrafts.uk (Next.js on Vercel, Supabase, Stripe)
**Kit:** Bambu Lab P2S (PLA, PETG, several colours) · laser cutter/engraver (plywood, acrylic)

**Changes since v0.1:** your answers are built in (§2); a **strict approval gate** on every outbound message and post (§5); laser jobs added to pricing (§9); new sections on the **time-lapse pipeline** (§11) and **marketing strategy and automation** (§12); worked pricing examples (§9.4).

---

## 1. Goals

1. **One CRM** for every enquiry and order, from Etsy, the website, and later social media and email.
2. **Fast response:** you hear about each enquiry within about a minute, with a checked draft ready.
3. **Accurate, competitive quotes:** every cost is counted (filament, machine, labour, design, VAT, box, postage, platform fees, acquisition), and prices are set to win jobs while protecting margin.
4. **Nothing reaches a customer or goes public without your approval.**
5. **Marketing runs on what you already make:** every job yields a time-lapse that becomes a customer keepsake and social content.

**Measures:** time to first response · quote acceptance rate · margin per job · enquiries by source · repeat customers · posts per week.

---

## 2. Your answers and the decisions they lead to

| Question | Your answer | Decision |
|---|---|---|
| UK / VAT | Yes | GBP, **VAT registered at 20%**. Prices to customers include VAT. VAT on Etsy/Stripe fees is treated as reclaimable. *(If you're actually not VAT registered yet, it's one switch in Settings.)* |
| Etsy notification mailbox | Gmail | **Google Apps Script** inside your Gmail account forwards new Etsy notifications to the CRM webhook every minute. It's free, needs no domain or DNS changes, and your Gmail login never leaves Google (§6.1). |
| Etsy purchase link | Reserved/custom listing | The CRM prepares the reserved listing details. You create it in Etsy. Paid orders are matched automatically via the Etsy API. |
| Printer & filament | Bambu Lab P2S, £10/kg | Defaults in §9.1. The P2S camera and LAN connection drive the time-lapse pipeline (§11). |
| Separate app or inside the site? | Asked me to recommend | **A separate Next.js app at `studio.3dcrafts.uk` on the same Supabase project** (§4.1). |
| Notifications | Asked me to recommend | **A Telegram bot**: instant, free, rich messages with **Approve / Edit / Reject** buttons, works on phone and laptop (§5.3). |
| Materials / job size | PLA & PETG, £10–£200 (max so far), up to £300 | Pricing tuned for that range, with a quantity-discount curve and an automatic "big job" flag above £150 to trigger extra checking. |
| Verification | You check everything and have final say | **A hard approval gate built into the database.** Unapproved content cannot be sent or posted by any part of the system (§5). |

---

## 3. Key constraints

| # | Constraint | Impact on design |
|---|---|---|
| C1 | Etsy's Open API has **no messaging endpoints**. | Etsy messages are read by a **Chrome extension** in your logged-in browser. |
| C2 | Etsy prohibits scraping and bots. Low-volume reading of your own inbox is low risk; automated **sending** is high risk. | The extension **reads** automatically and **never sends**. You press Send in Etsy. This also suits your approval rule. |
| C3 | Etsy buyers must pay through Etsy and must not be steered to buy off Etsy in messages. | Etsy jobs are paid via reserved listings. Etsy message drafts are **automatically checked for off-Etsy links and prices** before you see them. |
| C4 | You may not add Etsy buyers to marketing lists without their opt-in. | Marketing emails go only to website customers who opt in. Etsy buyers get the time-lapse page via the QR card in the parcel (§11.4) and can opt in there. |
| C5 | The extension runs only while Chrome is open on the laptop. | Captures queue up and run when the laptop wakes. Telegram still alerts you immediately from the email. |
| C6 | Bambu printers allow third-party LAN access (MQTT, FTPS) only with **LAN mode / Developer mode** enabled (Bambu firmware policy since 2025). | Auto time-lapse download needs Developer mode on the P2S. Fallback: manual upload in the CRM (§11.2). |
| C7 | TikTok's posting API only allows **public** posts after TikTok audits the app. | Social posting goes through a scheduling service, or a direct API where it's simple (§12.6). |
| C8 | UK GDPR / PECR. | Explicit consent for marketing emails and for featuring a customer's item in public content (§12.7). |

---

## 4. Architecture

```
 ETSY                                   GMAIL                          WEBSITE 3dcrafts.uk
 buyer message ──notification email──▶ Apps Script (1-min trigger)     quote form, shop, Stripe,
      ▲                                       │ POST + secret          track-order + time-lapse
      │ reads DOM / you press Send            ▼                              │  enquiries, orders,
┌─────┴──────────────┐  capture jobs   ┌──────────────────────────────┐      │  Stripe webhooks
│ Chrome extension   │◀──────────────▶│  STUDIO app (Next.js/Vercel)  │◀─────┘
│ (MV3, your Chrome) │  approved drafts│  studio.3dcrafts.uk           │
└────────────────────┘                 │  · inbox · pipeline · quotes  │
                                       │  · approval queue · content   │──▶ Resend (email, approved only)
┌────────────────────┐  approve/edit   │  · settings · dashboards      │──▶ Social scheduler (approved only)
│ Telegram bot       │◀──────────────▶│  API routes + cron jobs       │──▶ Etsy API (read receipts)
│ (your phone)       │                 └──────────────┬────────────────┘──▶ Claude API (extract, draft, check)
└────────────────────┘                                │
                                        ┌─────────────▼────────────────┐
┌────────────────────┐  print events,   │ Supabase (existing project)  │
│ Workshop agent     │  time-lapse files│  schema `public`: website    │
│ (laptop or Pi on   │─────────────────▶│  schema `crm`: everything new│
│  workshop Wi-Fi)   │  render jobs     │  Storage: files, videos      │
│ MQTT + FTPS to P2S │◀─────────────────│  Auth · Realtime · pg_cron   │
│ ffmpeg rendering   │                  └──────────────────────────────┘
└────────────────────┘
```

### 4.1 Why a separate app (studio.3dcrafts.uk)

- **Safety:** CRM deploys and experiments can never break the shop or checkout.
- **Different needs:** admin-only auth, heavier libraries (AI, video, PDFs) kept out of the public site bundle.
- **Shared data:** same Supabase project. The website keeps writing to its own tables; small additions make the quote form, Stripe webhook and order tracking also write to or read from `crm.*`.
- Both apps live in **one Git repo** (pnpm workspace: `apps/web`, `apps/studio`, `packages/db`, `packages/pricing`), so pricing logic and database types are shared, and the website's instant estimates use exactly the same calculation as your quotes.

### 4.2 Components

| Component | Tech | Runs where |
|---|---|---|
| Studio app + API | Next.js (App Router), TypeScript, Tailwind, Supabase JS | Vercel |
| Database, files, auth, schedules | Supabase Postgres, Storage, Auth, pg_cron | Supabase |
| Email trigger | Google Apps Script | Your Google account |
| Etsy capture & reply panel | Chrome extension (Manifest V3) | Your Chrome |
| Workshop agent | Node.js service: Bambu MQTT + FTPS client, ffmpeg, upload queue | Laptop now; a Raspberry Pi 5 on the workshop network later (~£80, always on) |
| AI | Claude API: `claude-haiku-5-5` (classify/extract/check), `claude-sonnet-5-5` (drafts, captions) | Called from Studio API |
| Notifications & quick approvals | Telegram Bot API | Telegram |
| Email to customers | Resend (from `hello@3dcrafts.uk`) | Approved messages only |
| Payments | Stripe (web) · Etsy reserved listings (Etsy) | existing |

---

## 5. Approval gate ("nothing goes out unless you approve it")

### 5.1 Rule

Every outbound item (Etsy reply draft, quote, customer email, social post, review request, newsletter) is an **`outbound_item`** row with a status:

```
draft → checked → approved → sent / posted
            ↘ rejected       (any edit after approval → back to checked)
```

- **Enforced in the database, not just the UI.** Only the approval action (your logged-in user) can set `approved`. It records `approved_by`, `approved_at` and a **hash of the exact content**. The send/post functions refuse anything whose current content hash doesn't match the approved one.
- There is no "auto-send" setting. If you want one later, it's a deliberate code change, not a toggle.
- Every send is written to an audit log: what, to whom, when, which version.

### 5.2 Automatic checks before you see it ("checked")

The system verifies everything it can, so your review is quick:

| Check | What it does |
|---|---|
| **Price recompute** | Quote recalculated from the stored inputs; must match to the penny. |
| **Text vs numbers** | Every £ figure, quantity, material, colour and delivery date in the message is compared against the quote record. Mismatches block approval. |
| **VAT & totals** | Line items + postage = total; VAT shown correctly. |
| **Margin guard** | Warns below your floor margin; blocks below cost. |
| **Etsy policy** | Etsy drafts must not contain external links, emails, phone numbers, Stripe links or "buy on our website" wording. |
| **Missing info** | Lists anything the customer didn't specify (size, colour, deadline, file), so the draft asks rather than assumes. |
| **Feasibility** | Fits the P2S build volume (256 × 256 × 256 mm) or the laser bed; material suits the use (e.g. PETG for outdoor/heat). |
| **Tone & spelling** | UK English, your style guide, no over-promising on dates. |
| **Big job flag** | Over £150 or quantity over 20: highlighted for a second look. |

### 5.3 How you approve

- **Studio (main):** Approval queue with each draft, quote breakdown, check results and the customer's thread side by side. **Approve**, **Edit** or **Reject (with note)**.
- **Telegram (quick):** a message with the summary, price and check results plus **✅ Approve · ✏️ Open in Studio · ❌ Reject**. Good for simple replies on the go. Anything flagged opens in Studio.
- **Etsy delivery:** an approved draft appears in the extension's side panel on that Etsy conversation. **Insert** puts it into Etsy's reply box and **you press Send**. Website and email delivery: approval sends it via Resend.

---

## 6. Etsy flow

### 6.1 Trigger (Gmail → CRM)

1. Gmail filter: from Etsy + "message" in subject → label `etsy/new-message`.
2. Apps Script runs every minute: finds labelled, unprocessed threads; POSTs `{subject, html, receivedAt, messageId}` to `/api/inbound/etsy-email` with a secret header; relabels `etsy/processed`.
3. Studio extracts the buyer name and conversation link (resolving Etsy's tracking redirect), dedupes, creates or updates **contact → conversation → lead (stage `new`)** and a **capture job**, and sends a Telegram alert: *"New Etsy message from Sarah: capturing."*

### 6.2 Capture (Chrome extension)

- `chrome.alarms` every 2–3 min fetches pending capture jobs, opens each conversation in a **background tab**, one at a time with random 5–20 s gaps, captures, then closes the tab.
- The content script reads every message (sender, time, text), attachments (photos/STL, uploaded to Supabase Storage) and any linked listing or order.
- **Passive mode:** any Etsy conversation you open is captured too.
- Idempotent (content hashes). Failures (logged out, page layout changed) trigger a Telegram alert.
- Page selectors live in remote config served by Studio, so a fix for an Etsy layout change doesn't need an extension update.

### 6.3 After capture

AI classifies and extracts specs → pricing engine builds the quote options → AI drafts the reply → automatic checks → **approval queue** + Telegram. Target: ready for your review **within 3–5 minutes** of the Etsy email, while the laptop is on.

### 6.4 Payment and order

On acceptance, Studio shows the **reserved listing details** to copy (title, price, quantity, description, buyer). Your current £1.01 "Custom 3D Print from Your STL File" listing (bought as quantity N) is also supported as a payment method. A cron job polls Etsy **receipts** via the Open API v3 (OAuth app) every 15 min and matches them to the lead → `paid` → production queue.

---

## 7. Website flow

1. The existing **quote form** (name, email, business, quantity, service, description, files) also writes to `crm.*`, with UTM/source captured and an optional **"How did you hear about us?"** field.
2. **Instant automated acknowledgement** ("Got it, we'll reply within X hours"). This is a fixed template **you approve once**; it contains no prices.
3. If an STL is attached and auto-analysis works (§9.3), the draft quote is ready immediately for your approval.
4. Approved quote email → **Stripe Checkout link** per quote (line items, VAT, shipping).
5. `checkout.session.completed` → order paid → production queue. Shop products (e.g. Name Keyring) also become CRM orders.
6. Customer email replies come back via a reply-to address on Resend Inbound to the same conversation.
7. **Track-order** page also shows production stage and the **time-lapse** (§11).

---

## 8. Pipeline

```
new → capturing → needs_info → quoting → awaiting_approval → quote_sent → accepted
    → awaiting_payment → paid → in_design → in_production (printing/lasering)
    → post_processing → packed → shipped → delivered → review_requested → completed
                                                      (any) → lost (reason)
```

- **SLA timers:** Telegram nudge if a lead sits in `new`/`needs_info` past 1 h (working hours), or `quote_sent` with no reply after 48 h (follow-up draft generated for approval).
- **Lost reasons** (price, speed, no reply, went elsewhere) feed the pricing analytics (§9.6).
- **Production view:** paid jobs by due date, machine (P2S / laser), filament and colour, with links to files and the print job name (used for time-lapse matching).

---

## 9. Pricing engine

One shared package (`packages/pricing`) used by Studio quotes, website estimates and the checks.

### 9.1 Settings (all editable; defaults below)

| Group | Setting | Default |
|---|---|---|
| **Filament** | PLA, PETG £/kg | **£10/kg** each (per spool brand later) |
| | Waste/support allowance | 10%, plus **multicolour purge** per colour change (AMS) ~0.5–1.5 g |
| **P2S machine rate** | Electricity: avg ~0.15 kW × £0.25/kWh | £0.04/h |
| | Depreciation: printer cost ÷ 5,000 h *(enter actual price paid)* | ~£0.12/h |
| | Maintenance (nozzles, plates, belts) | £0.05/h |
| | **Machine rate** | **≈ £0.21/h** |
| | Failure buffer | 5% (<6 h) · 10% (6–15 h) · 15% (>15 h) |
| **Laser** | Machine rate £/min; material sheet costs (plywood 3 mm, acrylic) per cm² | to set |
| **Labour** | Hourly rate | £15/h |
| | Setup/slicing per job · post-processing per part | 10 min · 5–30 min |
| **Design** | Design rate · presets: tweak 0.5 h / moderate 2 h / complex 5 h | £20/h |
| **Packaging** | Box S/M/L + filler/tape | £0.60 / £0.90 / £1.40 + £0.10 |
| **Postage** | Royal Mail bands (Large Letter, Small Parcel, Medium Parcel; 2nd/1st/Tracked 48/24) | current rates entered |
| **Etsy fees** | Transaction 6.5% (item + postage) · processing 4% + £0.20 · listing ~£0.16 · Offsite Ads 15% when applicable | *check current rates before go-live* |
| **Stripe fees** | UK cards 1.5% + £0.20 | *check* |
| **Acquisition** | Per channel: Etsy Ads spend ÷ Etsy orders (30 days); social/ads spend ÷ web orders | starts £1.00/order Etsy, £0.50 web |
| **VAT** | Registered, 20%, prices shown inc. VAT | on |
| **Markup** | Target / floor markup on cost | 30% / 10% |
| | Minimum order value | £10 (your smallest jobs) |

### 9.2 Formula

```
material    = Σ grams × (1 + waste) / 1000 × £/kg  + purge
machine     = hours × machine_rate × (1 + failure_buffer)
labour      = (setup_min + post_min) / 60 × labour_rate
design      = design_hours × design_rate
packaging   = box + filler
postage     = band(size, weight, service)
acquisition = channel cost per order
direct_cost = sum of the above

Fees are % of the VAT-inclusive price P, so solve for P:
  P / 1.2 − (pct_fees × P + fixed_fees) = direct_cost × (1 + markup)
  P = (direct_cost × (1 + markup) + fixed_fees) / (1/1.2 − pct_fees)

final = max(P, minimum_order) → rounded to a clean price (£x.50 / £x.99)
```

Each quote shows **cost, floor price, target price, profit £ and %** for every option.

### 9.3 Getting grams and hours

| Input | Phase 1 | Later |
|---|---|---|
| STL/3MF supplied | You enter grams and time from Bambu Studio (most accurate) | **Auto-slice**: workshop agent runs Bambu Studio/OrcaSlicer CLI with your P2S profiles and returns grams and time |
| Description only | AI pulls out dimensions; size × infill/solidity preset estimate, calibrated from your past jobs; quoted as a **range** | Calibration improves with every logged job |
| Laser | Sheet area + engrave/cut minutes entered | Estimated from SVG area/path length |

### 9.4 Worked examples (P2S, PLA, VAT incl., free UK postage built in)

**Example A: small functional part from customer STL** (80 g, 4 h print, 10 min setup + 10 min clean-up, small box, Small Parcel ~£3.50)

| Line | £ |
|---|---|
| Material 80 g × 1.1 × £10/kg | 0.88 |
| Machine 4 h × £0.21 × 1.05 | 0.88 |
| Labour 20 min × £15/h | 5.00 |
| Packaging | 0.70 |
| Postage | 3.50 |
| Acquisition (Etsy) | 1.00 |
| **Direct cost** | **11.96** |

| Channel | Target price (30%) | Floor price (10%) | Profit at target |
|---|---|---|---|
| Etsy (10.5% + £0.36 fees) | 15.548 + 0.36 = 15.908 ÷ 0.7283 = **£21.84 → £21.99** | £18.56 | ≈ £3.70 |
| Website (1.5% + £0.20; acquisition £0.50) | 14.898 + 0.20 = 15.098 ÷ 0.8183 = **£18.45 → £18.50** | £15.65 | ≈ £3.48 |

Labour is the biggest cost on small jobs. Batching post-processing and keeping setup under 10 minutes is the easiest lever on price.

**Example B: 20 custom keyrings** (12 g each, plate of 20 in 5 h, 30 min setup + 20 min finishing, medium box, Tracked 48 ~£4.20, Etsy):
direct = 2.64 + 1.10 + 12.50 + 1.00 + 4.20 + 1.00 = £22.44 → target (22.44 × 1.3 + 0.36) ÷ 0.7283 = £40.55 → **£40.99 (≈ £2.05 each)**, floor £34.39. Setup, packaging and postage are spread across units, so quantity breaks come out of the same formula (and a single keyring hits the £10 minimum order).

*Final numbers are confirmed once you enter your real P2S purchase price, Royal Mail rates and current Etsy fees.*

### 9.5 Quotes built to be accepted

- **Three options per quote:** *Standard* (PLA, standard finish, ~5 working days) · *Premium* (PETG or finer layers/finish) · *Express* (+25–40%, priority slot, 1st-class postage).
- **Quantity breaks** shown automatically.
- **Design fee:** shown separately, credited against orders over a set value (e.g. over £60). Waived when it takes under 15 minutes.
- **"Kept on file" reorder price** (your site already promises this): repeat orders skip setup and design, so you can offer them cheaper.
- **Market check:** comparable Etsy listings from EverBee shown next to the quote as a sense check.

### 9.6 Learning loop

Every quote stores options shown, option chosen and outcome. A monthly report shows acceptance by price band, channel, material and job type, with suggested markup changes. Nothing changes until you accept a suggestion.

---

## 10. AI's role (limited and checked)

| Task | Model | Notes |
|---|---|---|
| Classify message (new request / follow-up / order question / spam) | Haiku | |
| Extract specs and missing info | Haiku | Structured output stored on the lead |
| Draft replies, follow-ups, review requests | Sonnet | Your style guide + examples of your past replies (from captured threads) |
| Captions, hashtags, video hooks | Sonnet | Per platform (§12) |
| Run the automatic checks (§5.2) | Haiku + plain code | Number checks are plain code, never AI |

**Prices are always calculated by the pricing engine, never by the AI.** Every AI output goes through the approval gate.

---

## 11. Time-lapse pipeline

Your site's track-order flow already has a time-lapse setup, and I'll build on it rather than replace it. **I need read access to the website repo to confirm how it stores and serves videos today.**

### 11.1 Capture (automatic, needs P2S Developer mode, C6)

1. **Job naming:** when you slice a job in Bambu Studio, name the plate `J1234_short-name`. Studio shows the job code on the production card.
2. The **workshop agent** subscribes to the P2S's local MQTT feed: print started / progress / finished / failed → Studio updates the job stage live ("Printing 63%").
3. On finish, it downloads the time-lapse from the printer's storage over FTPS, matches it to the order by the `J1234` prefix, and uploads the original to Supabase Storage.
4. **Fallback (Phase 1, or if Developer mode stays off):** drag-and-drop upload on the order in Studio. Laser jobs: phone-mounted time-lapse, same upload.

### 11.2 Rendering (ffmpeg on the workshop agent)

From each time-lapse, automatically:

| Output | Use |
|---|---|
| **Customer cut** 16:9, 20–40 s, logo bug, "Made for you by 3DCRAFTS" end card | Track-order page + "watch it being made" page |
| **Vertical 9:16** 15–30 s, hook text in the first second, captions, music from a royalty-free library, end card "3dcrafts.uk" | Reels / TikTok / Shorts |
| **Square** 1:1 + thumbnail + 3 stills (start/middle/finished) | Pinterest, Facebook, Google Business Profile, Etsy listing video |

Renders are stored as `content_assets`. Nothing is published without approval (§5).

### 11.3 Customer experience

- **"Your print is starting"** update (web orders by email; Etsy via a drafted message for you to approve and send).
- **Shipped:** tracking + link to the time-lapse.
- **QR card in every parcel** (Etsy and web) → `3dcrafts.uk/made/<token>`: the time-lapse, care tips, a **review link** (Etsy review for Etsy orders, Google review for web), "Share your video", and an optional opt-in for offers and occasion reminders. Tokens are unguessable; pages are not indexed.
- **Occasion reminders** (great fit for the wooden cards): opt in at purchase or on the QR page with "remind me before next year's birthday/anniversary" → reminder 14 days before. Website customers only, with consent.

---

## 12. Marketing strategy & automation

### 12.1 Where you are now (EverBee, Etsy estimates)

- Est. Etsy revenue ~£140–£360/month. **86% from the top 3 listings.** The **Custom 3D Print from STL** listing (2 months old) is now the top earner (~17 sales/month est.), ahead of the wooden cards.
- **Only ~0.5 new listings/month.** Few listings means limited Etsy search visibility.
- Excellent social proof: **4.9★ from 100+ reviews, 260+ orders**, and reviews regularly praise speed, communication and fit. That's exactly what to put in front of new customers.
- The website targets **businesses** (trades, bakers, cafés, events, clubs, makers). Etsy is mainly **gift buyers** plus custom STL work. The strategy serves both.

### 12.2 Positioning

> **"Tell us what you need, we'll design it, make it, and show you it being made."**

The time-lapse is the point of difference: few small makers show every customer their own item being made.

### 12.3 Content pillars (rotate weekly)

| Pillar | Example | Main channels |
|---|---|---|
| 1. **Made for you** time-lapses | "A customer sent us a sketch of their café logo…" | TikTok, Reels, Shorts |
| 2. **Problem → fixed** | Discontinued clip, broken appliance part, before/after | TikTok, Shorts, Facebook groups |
| 3. **Personalised gifts & occasions** | Wooden cards, keyrings, coasters, seasonal | Pinterest, Instagram, Etsy video |
| 4. **For businesses** (website sectors) | Cake toppers for bakers, menu holders, trade jigs | LinkedIn, Instagram, Google Business Profile |
| 5. **Behind the scenes / tips** | PLA vs PETG, multicolour AMS, laser vs print | Shorts, TikTok |
| 6. **Social proof** | Review quote over the finished item | All |

### 12.4 Channels and cadence (realistic for one person)

| Channel | Cadence | Notes |
|---|---|---|
| TikTok + Instagram Reels + YouTube Shorts | **5/week**, same vertical video on all three | Every job produces material, so you won't run out |
| Pinterest | 1–3 pins/day, scheduled in batches | Long-lasting traffic for gifts; links straight to Etsy listings and site |
| Google Business Profile (Edinburgh) | 1 post/week + photos | Local searches like "3D printing Edinburgh" |
| Facebook page + local groups | 2/week | Groups are posted manually (rules vary) |
| LinkedIn | 1/week | B2B case studies |
| Etsy | **2–4 new listings/month**, listing videos from renders | Keywords researched with EverBee; sector variants of the custom listing (cake toppers, replacement parts, signage) |
| Email (web opt-ins) | Monthly + seasonal + occasion reminders | Resend; consent required |

### 12.5 Automated content workflow

```
Job finished → time-lapse rendered (§11.2)
  → AI drafts per-platform captions, hashtags, alt text, hook text
  → content item in the APPROVAL QUEUE (video preview + captions + suggested time)
  → you approve / edit / reject (Studio or Telegram)
  → scheduler posts at the best time slots → results pulled back into Studio
```

- **Content calendar** in Studio: approved posts fill open weekly slots automatically, with pillar balance shown. Weekly reminder if the queue drops below 7 posts.
- **Evergreen recycling:** top performers re-queued after 60–90 days (still needs approval).
- **Seasonal plan** built in, with prep starting ~6 weeks ahead:

| Date | Occasion | Focus |
|---|---|---|
| now → ~18 Dec 2026 | **Christmas** (check Royal Mail last posting dates) | Personalised gifts, cards, ornaments, "order by" deadlines |
| 14 Feb 2027 | Valentine's | Wooden cards (proven sellers), couples coasters |
| 7 Mar 2027 | Mother's Day (UK) | Cards, photo frames |
| 28 Mar 2027 | Easter | Decorations, cake toppers for bakers |
| May–Sep | Weddings, graduations | Table numbers, place names, favours |
| 20 Jun 2027 | Father's Day | Desk organisers, practical gifts |
| Aug–Sep | Back to school/uni | Organisers, name tags |

### 12.6 Publishing method

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **A. Scheduler service with API** (e.g. Ayrshare; or Buffer/Metricool) | One integration covers TikTok, IG, YouTube, Pinterest, Facebook, LinkedIn, GBP; avoids TikTok audit (C7) | Monthly fee (~£20–£50) | **Phase 2 default** |
| B. Direct APIs (YouTube, Pinterest, Instagram Graph) | Free | Separate approvals per platform; TikTok limited | Add selectively later |
| C. Export pack + manual upload | No setup | Manual | Phase 1 stopgap: Studio prepares files and captions to download |

### 12.7 Consent & privacy

- Quote acceptance and checkout include: **"Happy for us to share a video of your item being made? (no names or personal details shown)"**, default **off**.
- Personalised items with names or dates are **never posted** unless the customer explicitly agrees. Otherwise they're re-made as a demo version (e.g. "Your Name").
- Marketing email only with opt-in; one-click unsubscribe; consent records stored.

### 12.8 Attribution & what to measure

- UTM links on every post and the QR card; "How did you hear about us?" on the quote form; source stored on every lead.
- **Dashboard:** enquiries and revenue by source, cost per acquisition by channel (feeds the pricing acquisition setting), quote win rate, posts published versus planned, top videos, review count and rating trend.

### 12.9 Paid ads (optional, later)

Small Etsy Ads budget (£1–£3/day) on the custom STL and best card listings, with the cost fed into acquisition. Once organic videos show which ones work, boost the top 1–2 videos per month on Meta for local Edinburgh business audiences. Spend is tracked per channel in Studio.

---

## 13. Data model (Supabase schema `crm`)

| Area | Tables |
|---|---|
| People | `contacts`, `channel_identities` (etsy/web/email/social), `consents` (marketing, feature-my-print, reminders, with timestamp and source) |
| Conversations | `conversations`, `messages` (direction, body, attachments, content_hash, source), `capture_jobs` |
| Sales | `leads` (stage, source, utm, extracted_specs, lost_reason, sla_due_at), `quotes` (version, options, cost_breakdown, totals, valid_until), `quote_items`, `orders` (channel, external_ref, status, dates, tracking) |
| Approval | `outbound_items` (kind, target, content, content_hash, status, check_results, approved_by/at, sent_at), `audit_log` |
| Production | `machines` (P2S, laser), `production_jobs` (job code, machine, material, colour, status, progress, started/finished), `files` (stl/3mf/svg/image, analysis) |
| Content | `content_assets` (original, customer cut, vertical, square, stills), `social_posts` (platform, caption, schedule, status, metrics), `content_calendar_slots` |
| Customer pages | `made_pages` (token, order, asset, review link, views) |
| Reminders | `occasion_reminders` (contact, occasion, date, consent) |
| Config | `materials`, `machine_rates`, `packaging`, `postage_bands`, `channel_fees`, `pricing_settings`, `templates`, `style_guide` |

**Security:** RLS so only your admin user can access `crm.*`. The extension, Apps Script and workshop agent each use their own **revocable, limited-scope token** (no Supabase service key outside the server). Webhooks are signed (Stripe signature, shared secrets). Daily backups.

---

## 14. Studio screens

1. **Today**: approvals waiting, new enquiries, SLA timers, jobs printing, posts scheduled.
2. **Inbox**: all conversations across channels.
3. **Pipeline**: kanban by stage.
4. **Lead**: thread · specs · files (STL viewer) · quote builder · draft · checks · timeline.
5. **Approval queue**: messages, quotes, posts, with checks shown.
6. **Production**: by due date and machine, live P2S progress.
7. **Content**: library, calendar, performance.
8. **Settings**: pricing, templates, style guide, devices/tokens, integrations.
9. **Reports**: sources, win rate, margin, content performance.

Phone-friendly throughout.

---

## 15. Delivery phases

| Phase | Scope | Outcome |
|---|---|---|
| **1: Core** | Repo/monorepo setup; `crm` schema; Studio skeleton + login; Gmail Apps Script trigger; Chrome extension capture; Inbox + Lead; **pricing engine + settings + quote builder**; **approval gate + automatic checks**; Telegram alerts/approvals; extension reply panel | Every Etsy enquiry captured, priced and drafted; nothing sent without your approval |
| **2: Website, orders, time-lapse** | Quote form → CRM; Resend email; Stripe quote checkout; Etsy receipts sync; pipeline + production; manual time-lapse upload + ffmpeg renders; QR "made for you" pages; review requests | Both channels in one pipeline; every customer gets their time-lapse |
| **3: Marketing engine** | Workshop agent (P2S MQTT/FTPS); captions; approval → scheduler posting; content calendar; consents; attribution dashboard; occasion reminders | Regular, mostly automated posting from real jobs |
| **4: Optimisation** | Auto-slicing estimates; instant website estimates; pricing learning loop; Etsy listing expansion workflow; paid-ads tracking | Higher win rate and less manual work |

---

## 16. What I need from you before building

1. **Access to the website repo** (GitHub), plus a Supabase *development* branch or project, to integrate the quote form, Stripe webhook and existing time-lapse feature without touching live data.
2. **Confirm VAT registered** (vs just UK-based). It changes every price by 20%.
3. **P2S purchase price** and roughly how many hours a week it runs (for depreciation). **Laser model** and sheet material costs.
4. Your **labour and design hourly rates** (defaults £15 / £20).
5. Royal Mail services you normally use, and your box sizes and costs.
6. **3–5 past jobs** (what, size/grams, hours, price charged, accepted?) to calibrate the pricing, plus **5–10 past Etsy replies** you were happy with (for the style guide).
7. Happy with **Telegram** for alerts and quick approvals?
8. Social accounts that exist today (TikTok, Instagram, YouTube, Pinterest, Facebook, Google Business Profile, LinkedIn), and a monthly budget for a scheduler and ads, if any.
9. Willing to enable **LAN/Developer mode** on the P2S for automatic time-lapse download? (Trade-off: Bambu cloud features such as remote printing from Bambu Handy may be limited.)
