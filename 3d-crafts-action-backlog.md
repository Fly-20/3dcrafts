# 3DCRAFTS Action Backlog

*v0.1 · 2026-11-15 · Every agreed to-do in one place, with my **suggested** priority. You decide the final order.*

Details live in the [HQ technical brief](3d-crafts-hq-technical-brief.md) and the [90-day marketing plan](3d-crafts-marketing-plan.md). This list is the single place to see what's next.

**Priority key**

| Code | Meaning |
|---|---|
| **P0** | This week (by Sun 22 Nov). Urgent or blocks other work. |
| **P1** | Next 2 weeks (by Sun 6 Dec). Before go-live / Christmas peak. |
| **P2** | Next 1–2 months (Dec–Jan) |
| **P3** | Later (Feb onwards), or when a trigger is met |

**Who key:** **You** = only you can do it (accounts, money, making, filming) · **Me** = I build or draft it, you approve · **Both** = working session

---

## A. Business readiness

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| A1 | Start logging real minutes per job (notes app for now) | You | **P0** | Mon 16 Nov |
| A2 | Get 2 public + product liability insurance quotes | You | **P0** | Fri 20 Nov |
| A3 | Check Etsy EU product safety (GPSR) settings | You | **P0** | Fri 20 Nov |
| A4 | Check ICO data protection fee is paid; set the registration number on the site | You | P1 | Fri 27 Nov |
| A5 | Terms update: custom-item returns exemption, "parts we don't make", design ownership, food-contact wording. **Live on the site 15 Nov** ([drafts](planning/legal/terms-privacy-drafts.md)); still to do: legal name, solicitor check, food-filament facts (A6) | Me (draft) → You | P1 | Sun 29 Nov |
| A6 | Cake toppers / cookie cutters: food-safe filament + product wording | You | P1 | Sun 29 Nov |
| A7 | Privacy policy: AI processing + data retention. **Live on the site 15 Nov** ([drafts](planning/legal/terms-privacy-drafts.md) §5); still to do: check Anthropic terms, build 2-year deletion job in HQ | Me (draft) → You | P2 | before HQ Phase 1 |
| A8 | Spares kit (nozzle, build plate, laser lens) | You | P2 | Dec |
| A9 | Decide on Vercel Pro + Supabase Pro (~$45/month) | You | P1 | before go-live |

## H. Business setup & growth (added from your answers)

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| H1 | **(Go-live doesn't wait for this; go live as sole trader.)** Limited company transition plan with your accountant:** transfer VAT registration to the company (transfer of a going concern), company bank account, FreeAgent. **Set up Stripe live under the company**, so you don't verify twice. Insurance, ICO fee and website legal name in the company's name. Etsy shop moved to company details. | You (+ accountant) | **P0** (decide timing) | Fri 20 Nov |
| H2 | ✅ Baseline printer use: ~4–5 h/day (~25%). Log it weekly from Bambu history | You | done | weekly |
| H3 | Google Business Profile: **hide the home address** and set a service area (Edinburgh + Lothians); offer "**collection by arrangement**", with the address shared only after an order is confirmed | You | **P0** | Fri 20 Nov |
| H4 | **Bulk/short-run offer**: an "Order in bulk" page and Etsy listing with quantity price breaks; quote rule: design fee charged in full under a set quantity, waived or credited above it | Me (draft) → You | P1 | Sun 6 Dec |
| H5 | **Ad budget £200–£300/month**: Etsy Ads ~£100 (currently ~$100 ≈ £80/30 days; keep only listings returning ≥5× their ad spend); Google Search Ads ~£150 after go-live; Meta boost ~£0–£50 later. **Quick review every Monday, full review monthly.** | You (I analyse) | **P0** | first review Mon 16 Nov |
| H6 | Simple brand kit: logo files, 2–3 colours, fonts, video end card, packaging insert template (3DCRAFTS; Keepsake & Co kept separate for now) | Me (draft) → You | P1 | Sun 29 Nov |
| H7 | Weekly sessions: Monday 30 min (research + week plan), Friday 15 min (scorecard) | Both | **P0** | from Mon 16 Nov |
| H8 | **Printer #2 decision** (buy if December bookings average ≥ 8 h/day; see brief §1) | You | P1 | **Fri 27 Nov** |
| H10 | Printer #3 (by Feb–May 2027) and #5+ (by Nov 2027) using the normal buy rule | You | P2/P3 | when triggered |
| H9 | Move off-Etsy and repeat customers to the website once it's live | You | P1 | after go-live |

## B. Pricing

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| B1 | Labour/design at £15/h in all quoting from now (use the brief's examples as a guide) | You | **P0** | now |
| B2 | Card test: log 10 cards' real minutes; try £18.99 on one card listing; check Large Letter postage | You | **P0** | Sun 22 Nov |
| B3 | Standalone quote calculator in admin (HQ Phase 0) | Me | P1 | Sun 6 Dec |
| B4 | Replace default labour/postage/fees with real data | Both | P2 | after 1 month of logging |

## C. Website go-live 🚩

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| C1 | **Fix time-lapse issues** T1 (4.5 MB upload limit), T2 (guessable links), T3 (email optional). *Built and tested 15 Nov on branch `claude/distracted-wilson-b8106e`. Migration 0006 is already applied to Supabase (email optional + the missing "admins can add customers" rule, which had blocked every new time-lapse customer). Tested on dev: 11 MB upload, random link ending, no-email customer, label PDF, public page plays, delete. Left for you: review, merge and deploy. Video cap is 50 MB (Supabase Free plan limit).* | Me → You (review + merge) | **P0** | Sun 22 Nov |
| C2 | Stripe live mode + production webhook registered and tested | You + Me | P1 | Sun 29 Nov |
| C3 | Upstash rate limiting configured | You + Me | P1 | Sun 29 Nov |
| C4 | Business/VAT details in `business_settings`; real shipping rates | You | P1 | Sun 29 Nov |
| C5 | End-to-end test purchase on the live site | Both | P1 | Sun 29 Nov |
| C6 | `/links` page for social bios (with UTM tracking) | Me | P1 | Sun 29 Nov |

## D. Marketing (from the 90-day plan)

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| D1 | Record starting numbers (reviews, Maps rank, TikTok, Etsy 30-day, enquiries) | You | **P0** | Mon 16 Nov |
| D2 | Create Instagram Business, Facebook Page, YouTube, Pinterest with matching handle and bio | You | **P0** | Wed 18 Nov |
| D3 | Google Business Profile overhaul (categories, services, products, description, 20+ photos) | You (I draft the text) | **P0** | Fri 20 Nov |
| D4 | Ask 10–15 past customers for Google reviews | You | **P0** | Fri 20 Nov |
| D5 | 2 Christmas Etsy listings (EverBee research) | Both | **P0** | Sun 22 Nov |
| D6 | Weekly rhythm: 5 videos/week, Sunday batch, Friday scorecard | You | **P0** | ongoing |
| D7 | Weekly check-ins (Mon plan / Fri scorecard) scheduled | Me | **P0** | Mon 16 Nov |
| D8 | Christmas order-by dates on site, Etsy, GBP | You | P1 | Mon 23 Nov |
| D9 | Citations (Bing, Apple, Yell, FreeIndex, Scoot, Thomson, Cylex) | You | P1 | Sun 6 Dec |
| D10 | SEO pages: `/3d-printing-edinburgh` (6 Dec), `/laser-engraving-edinburgh` (13 Dec) | Me (build) + You (photos) | P1 | per plan |
| D11 | SEO pages: replacement parts, cake toppers, cost calculator guide, file guide | Me + You | P2 | Jan–14 Feb |
| D12 | Local press pitch | Me (draft) → You | P2 | Fri 15 Jan |
| D13 | Small ads test on best videos | You | P3 | from week 8, if a video beat average |

## E. Business outreach

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| E1 | Outreach message + list of 20 Edinburgh businesses | Me (draft) → You | **P0** | Sun 22 Nov |
| E2 | Contact 5 businesses per week (paused 7–20 Dec) | You | P1 | weekly from 23 Nov |
| E3 | Business customers tracked as leads in HQ | Me | P2 | HQ Phase 1 |

## F. Product Lab

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| F1 | First Monday research session (EverBee): shortlist and score 3–5 ideas | Both | **P0** | Mon 16 Nov |
| F2 | First test product listed (Christmas-friendly) | You | P1 | Fri 27 Nov |
| F3 | Weekly test loop (1/week; paused 7–20 Dec) | Both | P1 | ongoing |
| F4 | Buy mold-making starter kit (silicone, release agent, mixing gear) when a cast product scores 25+ | You | P2 | when triggered |
| F5 | Facebook Marketplace for local and bulky test products | You | P2 | when a pot/heavy item is ready |
| F6 | Product Lab pipeline in HQ | Me | P2 | HQ Phase 2 |
| F7 | Amazon Handmade (amazon.co.uk) application | You | P3 | after 3–5 proven products |
| F8 | TikTok Shop | You | P3 | when one product sells from video |
| F9 | Craft fair / market trial | You | P3 | spring |

## G. HQ build (by phase)

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| G1 | **Phase 0:** backups, HQ navigation shell, pricing library + tests, quote calculator, job time log, migration 0007 (0006 is taken by the C1 time-lapse fix) | Me | P1 | Sun 6 Dec |
| G2 | **Phase 1:** quote form → database, Projects, Inbox, approval gate + checks, Discord buttons, Gmail trigger, passive Etsy extension | Me | P2 | Jan |
| G3 | **Phase 2:** Stripe quote checkout, Etsy receipts, all-channel orders, production queue, materials/stock, time-lapse ↔ projects, keepsake page, Product Lab | Me | P2 | Feb |
| G4 | **Phase 3:** Marketing → Plan, workshop agent (P2S), renders, captions, calendar, scheduler, consents, attribution | Me | P3 | Mar |
| G5 | **Phase 4:** profit/VAT reports, FreeAgent, Amazon import, pricing analytics, auto-slicing | Me | P3 | Apr+ |
| G6 | Past jobs + Etsy replies to calibrate pricing and tone | You | P2 | before Phase 1 |

---

## 🎄 Christmas sprint (16 Nov – 20 Dec): main focus this week

To be planned in detail in the **Monday 16 Nov session**. Starting points:

| # | Item | Who | Priority | Due |
|---|---|---|---|---|
| X1 | Set Christmas **order-by dates** (custom vs personalised) against Royal Mail's published last posting dates; publish on Etsy, website and GBP | Both | **P0** | Tue 17 Nov |
| X2 | Pick the **Christmas hero products** (cards, ornaments, keyrings, gift sets) and the bulk offer (staff/club/team gifts) | Both | **P0** | Mon 16 Nov |
| X3 | 2–3 new Christmas Etsy listings (EverBee research) + refresh photos/titles on existing gift listings | Both | **P0** | Sun 22 Nov |
| X4 | Etsy Ads: shift budget to the Christmas listings that pay back | Both | **P0** | Mon 16 Nov |
| X5 | Christmas content: 5 videos/week (gift making, "order by" deadlines, bulk gift orders) | You | **P0** | weekly |
| X6 | Business Christmas outreach: staff gifts, client gifts, team/club orders (bulk keeps the printer busy) | Me (draft) → You | **P0** | Fri 20 Nov |
| X7 | Capacity plan for December: printer hours vs order volume; printer #2 decision Fri 27 Nov; filament and plywood stock | Both | P1 | Fri 27 Nov |
| X8 | Holiday hours + post-Christmas review requests | You | P1 | Sun 20 Dec |

## Suggested focus for week 1 (16–22 Nov)

| Area | This week |
|---|---|
| **You** (about 6–8 hours plus normal orders) | A1, A2, A3 · B1, B2 · D1–D6 · E1 review · F1 session |
| **Me** | C1 time-lapse fixes · D7 check-ins · drafts for D3 GBP text and E1 outreach message · F1 research with you |

**Decided:** go live as sole trader now; switch Stripe and the other accounts to the company when the transfer happens.
