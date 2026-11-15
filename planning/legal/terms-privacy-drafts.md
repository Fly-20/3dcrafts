# Terms, returns and privacy: draft updates for review

*Draft v0.1 · 2026-11-15 · Backlog items **A5** (terms) and **A7** (privacy) · For the owner to review before website go-live (Sun 29 Nov).*

**Status: draft only. Nothing here is live.** The page components (`src/app/terms/page.tsx`, `src/app/returns/page.tsx`, `src/app/privacy/page.tsx`) have not been changed. Once you approve the wording, the edits are mechanical and the "Last updated" date in `src/app/components/legal-page.tsx` (`legalLastUpdated`) should be changed at the same time.

This is plain-English drafting, not legal advice. Items marked **⚖️ Solicitor** are worth a short check by a solicitor (or a reputable template service such as a trade body's terms). Items marked **🧾 Your facts** need information only you have.

---

## How to read this

The current pages already cover a fair amount of this (custom-item cancellation exemption, file rights, a general liability clause). So each section below says:

- **Where it goes:** the page and heading.
- **Change type:** *new section*, *replace*, or *add to*.
- **Draft text:** the wording to use (headings as `###`, which become `<h2>` on the page).

---

## 1. Made-to-order and personalised items: no 14-day cancellation (A5)

**Where it goes:** `/returns` → replace the existing **"Custom and personalised items"** section. Add one sentence to `/terms` → **"Orders and quotes"** pointing to it.

**Why change it:** the current text is accurate but doesn't say clearly that faulty or damaged items are still covered, and doesn't mention made-to-order stock items (e.g. a standard product printed in the colour you choose) or Etsy orders.

**Change type:** replace.

### Custom, personalised and made-to-order items

Most of what we sell is made for you after you order. If an item is made to your specification or clearly personalised, the legal 14-day right to change your mind does not apply. This is set out in regulation 28(1)(b) of the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013. This includes, for example:

- items with your name, text, photo, logo or message on them (such as engraved wooden cards and cake toppers);
- parts made to your measurements, drawings or design files;
- items made in a size, colour or material you chose specially, where that is not an option we normally sell from stock.

You can still cancel a custom order free of charge **before we start making it**. Once we have started, we cannot cancel or refund it just because you have changed your mind.

**This does not affect your rights if something goes wrong.** If a custom item arrives faulty, damaged, or not made to the design or specification you approved, we will put it right. See "Faulty or incorrect items" below.

Before we make a custom piece we will show you the design or details to approve. Please check spelling, dates, sizes and colours carefully, because we make exactly what you approve.

**Add to `/terms` → "Orders and quotes" (new bullet):**

> Custom, personalised and made-to-order items cannot be cancelled once we have started making them, unless they are faulty or not as described. Our [delivery & returns](/returns) policy explains this.

**Notes for the owner**
- 🧾 **Your facts:** are any website shop items genuinely **stock items** (made in advance, not personalised)? If so, they keep the normal 14-day right, and the existing "Changing your mind: standard items" section stays. If *everything* is made to order, we could say so more simply, but "standard design printed in a standard colour" is usually **not** treated as personalised, so keep the 14-day right for those.
- Etsy orders follow Etsy's own returns settings as well as the law. Make sure your Etsy shop policy matches this wording (custom/personalised: no returns unless faulty).

---

## 2. Parts we don't make, and functional parts (A5)

**Where it goes:** `/terms` → **new section** after "Your files and designs", titled "Parts we don't make". Then **replace** the last two sentences of "Materials, finish and tolerances" with the functional-parts paragraph below. The same list should appear (shortened) on the quote form and in HQ's feasibility check (brief §5, §14).

**Change type:** new section + replace.

### Parts we don't make

For safety reasons we do not make, repair or copy parts where failure could injure someone. We will decline or cancel any order or quote for:

- vehicle parts for **brakes, steering, suspension, seat belts, airbags** or anything else safety-critical on a car, bike, motorbike, trailer or other vehicle;
- parts for **gas appliances**, boilers, fuel systems, or anything that carries gas or fuel;
- **medical devices**, mobility aids or personal protective equipment (PPE), including face shields, masks and protective guards;
- **load-bearing or safety-critical parts**, such as anything that holds a person's weight, lifting or climbing equipment, structural brackets or shelf supports for heavy loads, or parts whose failure could cause injury;
- **child car seats**, cots, high chairs, baby carriers or their parts;
- **weapons**, parts of weapons, or replica or imitation firearms;
- **electrical parts** that carry mains voltage or must meet electrical safety standards (for example plug or socket housings).

If you're not sure whether your part falls into one of these groups, ask us before ordering. If we accept an order and later find it is for one of these uses, we may cancel it and refund what you have paid.

### Functional and replacement parts

Many of the parts we make are functional: replacement clips, knobs, brackets, enclosures, adapters and similar. For these:

- **You specify the part.** You tell us what it is for, its size and any requirements (load, temperature, outdoor use and so on). We make it to that specification in the material agreed in the quote.
- **We will tell you if we think the material or design isn't suitable** for the use you describe. If you tell us the intended use and we agree in writing that the part is suitable for it, we are responsible for the part being fit for that purpose.
- **Plastic and wooden parts have limits.** 3D printed and laser-cut parts are generally weaker than moulded or metal originals, can soften with heat (PLA from about 55°C, PETG from about 75°C), and can wear or become brittle over time, especially outdoors. Unless we have agreed otherwise in writing, our parts are not suitable for high-temperature, high-load or safety-critical use, or for contact with food (see "Food contact" below).
- **Fitting and use are up to you.** Please check the part fits and works safely before relying on it, and stop using it if it shows cracks, wear or deformation. We are not responsible for damage caused by fitting a part incorrectly, using it outside the use you told us about, or modifying it.

**Notes for the owner**
- ⚖️ **Solicitor:** the existing "Our liability" clause is a reasonable start. For consumers, UK law (Consumer Rights Act 2015) means we **cannot** exclude liability for an item not being of satisfactory quality, fit for a purpose the customer made known, or as described, nor for death or injury caused by negligence. The draft above deliberately doesn't try to. It relies on (a) getting the intended use in writing and (b) declining risky work. Worth a solicitor glancing at the cap ("limited to the price you paid") for **business** customers, where a cap is allowed but must be reasonable.
- Mains electrical parts weren't in the brief's list. I added them because they carry similar risk. Remove if you disagree.
- The heat figures are typical values. 🧾 **Your facts:** confirm they match the filaments you use, or drop the numbers and just say "can soften with heat".
- This sits alongside insurance (backlog A2). Ask the insurer whether they want specific exclusions worded in the terms.

---

## 3. Design ownership and your rights in what you send (A5)

**Where it goes:** `/terms` → **replace** the existing "Your files and designs" section.

**Why change it:** the current text covers most of this. The draft adds that we won't sell your design as a product without permission, clarifies who owns what, and names licensed characters, logos and trademarks specifically (brief §14, Copyright/trademarks).

**Change type:** replace.

### Designs, files and ownership

- **Files you send us stay yours.** If you supply a design, drawing, photo, logo or 3D file, you keep all rights in it. We use it only to quote for and make your order, and to make repeat orders if you ask.
- **Designs we create belong to us.** If we create or adapt a design for you, we keep the rights in the design and the design files (for example the 3D model or cutting file), even where you have paid a design fee. The design fee pays for our time making it.
- **You own the item we make.** Once you have paid, the physical item is yours to use, give away or sell.
- **Kept on file for reorders.** We keep design files so we can make the same item again quickly. Ask us any time if you would like us to delete a file you supplied.
- **We won't sell your design.** We won't turn a design made for you, or a file you supplied, into a product for sale to others without your permission. We may still make similar items using our own general techniques and styles.
- **Photos of your order.** We may photograph or film items we make for you for our records. We will only use photos or video of your item in our marketing if you agree, and we won't show personal details such as names or messages without your permission.

### Your responsibility for what you send

By sending us a design, image, logo, text or file, you confirm that you own it or have permission to use it for this order. Please don't ask us to reproduce:

- characters, logos or artwork from films, TV, games, books or brands (for example Disney or Pokémon characters, football club badges or company logos), unless you own them or have written permission from the owner;
- another person's or company's protected design or product.

We may decline any request we think is likely to infringe someone else's rights. If a claim is made against us because a file or design you supplied infringed someone else's rights, you agree to cover our reasonable costs of dealing with it.

**Notes for the owner**
- ⚖️ **Solicitor:** the indemnity ("you agree to cover our reasonable costs") is already on the site in a similar form. Against **consumers**, a broad indemnity can be treated as unfair under the Consumer Rights Act 2015, so I've kept it to "reasonable costs" for claims caused by what *they* supplied. A solicitor may suggest limiting it to business customers.
- The "photos of your order" bullet ties in with the marketing plan's consent records (brief §4 C8, §8.9). Delete it if you'd rather keep that only in the privacy policy.
- 🧾 **Your facts:** if you *ever* hand over design files (e.g. a business customer pays extra for the STL), say so in the quote; the terms say we keep them by default.

---

## 4. Food contact: cake toppers and cookie cutters (A5, linked to A6)

**Where it goes:** `/terms` → **new section** after "Functional and replacement parts", titled "Food contact". A short version should also go on each cake topper and cookie cutter product page and Etsy listing (backlog A6).

**Change type:** new section.

### Food contact: cake toppers and cookie cutters

3D printed and laser-cut items have tiny ridges and gaps that can trap food and bacteria, and most are not designed to be washed repeatedly. So, unless the product description says otherwise:

- **Cookie cutters** are for **short-term contact with dough only**. Use them on chilled dough, wash by hand in warm (not hot) soapy water straight after use and dry fully. They are not dishwasher-safe and are not for heating or baking, and you should stop using them if they crack or get rough.
- **Cake toppers** are **decorations, not food**. They should not be eaten. Insert them only for display and remove before serving. Where a topper goes into the cake, we fit a food-safe sleeve or recommend you put the stem in a straw or wrap it before inserting.
- **Not for long-term food contact.** Don't use our items to store, serve or prepare food for long periods, or with hot, fatty or acidic foods, unless the product description states they are suitable.
- **Small parts.** Toppers and decorations can contain small parts. Keep them away from young children and don't leave children unattended with them.

**Short product-page version (for listings):**

> Food contact: for short-term use with dough / for decoration only. Not for eating, baking or long-term food contact. Hand wash only. Contains small parts; not a toy.

**Notes for the owner**
- 🧾 **Your facts (backlog A6, brief §17 Q5):** which filament are these made from now, and is it food-contact grade (with a supplier declaration of compliance)? If it is, the wording can say "made from food-contact-grade PLA". If it's standard PLA, keep the "single/short-term use" wording and don't call them food-safe.
- 🧾 Are topper stems actually sleeved today? The draft says "we fit a sleeve **or** recommend you…". Pick one once you know.
- "Single use" vs "short-term use": the brief says "single or short-term". I've used "short-term" for cookie cutters (people will reuse them) with clear care instructions. If you'd rather sell them as single-use, change the first bullet.
- ⚖️ **Solicitor / Trading Standards:** food-contact materials have their own regulations (Materials and Articles in Contact with Food (Scotland) Regulations 2012). If cookie cutters are a big line, a quick check with Edinburgh Trading Standards (free business advice) is worthwhile.
- Children's items (brief §14): the "small parts / not a toy" line is a minimum. Don't use the word "toy" in any listing unless toy safety requirements are met.

---

## 5. Privacy policy: enquiries, Etsy messages, uploaded files, AI, retention and processors (A7)

**Where it goes:** `/privacy`. Several edits, listed in page order. Unchanged sections (rights, ICO complaint, cookies) stay as they are.

**When:** A7 is due **before HQ Phase 1** (when Etsy messages start being stored and AI drafting goes live). Parts 5a–5c can go live at website go-live. They are accurate now *if* you're happy to describe HQ ahead of time. Otherwise publish them the day HQ Phase 1 starts storing enquiries.

### 5a. "What we collect and why": replace the "Quote requests" bullet and add an "Etsy messages" bullet

**Change type:** replace one bullet, add one.

- **Enquiries and quote requests:** your name, email address, phone number (if given), business name (if given), how you heard about us, what you need, and any photos, sketches, measurements or design files you upload. We also keep the messages we exchange with you. We use these to reply, prepare quotes, make your order and recognise you if you get in touch again. Lawful basis: taking steps at your request before a contract, performing our contract with you, and our legitimate interest in running our business.
- **Etsy messages and orders:** if you contact us or buy from us on Etsy, we receive your Etsy username, name, the messages you send us, any files you attach and, for orders, your delivery address and order details. Etsy is a separate controller of the data it holds about you (see Etsy's privacy policy). We copy your messages and order details into our own secure business system so we can reply, quote and keep track of your order. We use this information only for your enquiry and order. We do not add Etsy customers to our mailing list unless you separately sign up. Lawful basis: performing our contract with you and our legitimate interest in managing enquiries.

### 5b. New section after "What we collect and why": "How we use AI tools"

**Change type:** new section.

### How we use AI tools

To reply to enquiries faster, we use an AI service (Claude, provided by Anthropic) to help us read enquiries, pick out the details of what you need, and draft replies and quotes. When we do this, the content of your enquiry, such as your message, measurements and order details, and sometimes images you send, is passed to Anthropic for processing.

- **A person always checks.** AI only produces drafts. Every reply and quote is checked, edited if needed, and approved by us before it is sent to you. Nothing is sent automatically.
- **No decisions are made about you by AI alone.** Prices come from our own pricing rules, and we decide whether to accept a job.
- **Your data isn't used to train AI.** Anthropic processes data on our behalf under its commercial terms, which do not allow it to use our customers' data to train its models.
- **We send only what's needed.** We don't send payment details to the AI service, and we avoid sending contact details where they aren't needed for the draft.

If you would rather we didn't use AI tools on your enquiry, tell us and we'll handle it entirely by hand.

### 5c. "Who we share data with": replace the list

**Change type:** replace the bullet list (the intro and the international-transfers paragraph stay, with one sentence added).

- **Stripe**, for taking payments.
- **Supabase**, for our database and file storage (including enquiries, messages and files you upload).
- **Resend**, for sending emails such as quote replies and order updates.
- **Vercel**, which hosts our website.
- **Anthropic**, which provides the AI service we use to help draft replies and quotes (see "How we use AI tools").
- **Upstash**, for rate limiting to prevent abuse.
- **Discord**, which we use for internal notifications about new enquiries and orders. These alerts may include your name and a short summary of your enquiry.
- **Google**, whose email service receives Etsy's message notifications, which we forward into our business system.
- **Etsy**, for enquiries and orders placed through our Etsy shop.
- **Delivery carriers**, who receive your name, delivery address and, where needed, contact details so they can deliver your parcel.
- **Our accountants and professional advisers**, where needed.

Add to the international-transfers paragraph:

> Several of these providers are based in the United States, including Stripe, Vercel, Anthropic and Resend.

### 5d. "How long we keep it": replace the list

**Change type:** replace.

- **Enquiries, messages and uploaded files that don't lead to an order:** deleted **2 years after our last contact** with you.
- **Customer records and messages linked to an order:** kept for 2 years after your last order or contact, then deleted, apart from the order and payment records below.
- **Order, invoice and payment records:** 6 years after the end of the financial year they relate to, to meet tax and VAT requirements.
- **Design files for repeat orders:** kept while they are useful for reorders and reviewed every 2 years. Files you supplied are deleted on request, and designs we created may be kept without your personal details.
- **AI processing:** our AI provider keeps data only for the short time needed to process it and for limited safety monitoring, under its commercial terms. It is not kept to train models.
- **Marketing consent records** (for example permission to feature your item): kept as long as we use the content, plus 2 years.

### 5e. "What we collect and why": small addition to the closing paragraph

**Change type:** replace the sentence "We do not use your data for automated decision-making, and we do not sell it."

> We do not make decisions about you using automated processing alone, and we do not sell your data. AI tools help us draft replies, as explained below, but a person reviews everything.

**Notes for the owner**
- ⚖️ **Solicitor / check:** Anthropic's current data retention and no-training terms for API customers. The draft reflects Anthropic's commercial terms as I understand them, but confirm on Anthropic's site (privacy/commercial terms page) before publishing, as terms change. Same for each provider's transfer mechanism (most use the UK Extension to the EU–US Data Privacy Framework or the IDTA).
- 🧾 **Your facts:** does the quote form collect phone numbers? (5a mentions "if given".) Remove if not.
- 🧾 **Your facts:** is Gmail/Google Apps Script definitely the route for Etsy notifications (brief §6.1)? If HQ Phase 1 changes the plan, adjust the Google bullet.
- **Retention change:** the current page says unsuccessful quotes are kept "up to 12 months". The brief proposes **2 years after last contact**. Two years is defensible (people come back for reorders and seasonal gifts), but it's longer than now, so choose deliberately. Whatever you pick, HQ needs a scheduled deletion job to actually do it.
- **Chrome extension:** it reads Etsy conversations only in your own browser and sends them to HQ. That's covered by 5a ("we copy your messages … into our own secure business system"). No separate mention needed.
- **Legitimate interests:** using AI on enquiries relies on legitimate interests. Good practice is a short written **legitimate interests assessment** and a note in your records of processing. It's not published, but the ICO can ask for it. I can draft one if useful.

---

## 6. Things that need you or a solicitor before go-live

| # | Item | Who | Why |
|---|---|---|---|
| 1 | **Legal name** on all three pages | 🧾 You | Pages show `NEXT_PUBLIC_LEGAL_NAME` if set, otherwise "3DCRAFTS". As a sole trader it should be your name, e.g. "[Your name] trading as 3DCRAFTS". When the limited company takes over (backlog H1), change it to the company name and set `NEXT_PUBLIC_COMPANY_NUMBER` (e.g. SC123456). **Set it before go-live**: customers must be told who they're contracting with. |
| 2 | **Geographic address** | 🧾 You / ⚖️ | Distance-selling rules require the trader's geographic address to be given before an order is placed. That conflicts with hiding the home address (backlog H3). Common options: a business/virtual address service, or giving the address in the order confirmation. Worth a quick solicitor or Trading Standards check. |
| 3 | **VAT number** | 🧾 You | You're VAT-registered. Consider showing the VAT number in "About us" (needed on VAT invoices anyway). It moves to the company on transfer (H1). |
| 4 | **ICO registration number** | 🧾 You (backlog A4) | Set `NEXT_PUBLIC_ICO_REGISTRATION`. Re-register under the company when it takes over. |
| 5 | **Liability cap for business customers** | ⚖️ Solicitor | See item 2 notes. |
| 6 | **Indemnity for supplied files (consumers)** | ⚖️ Solicitor | See item 3 notes. |
| 7 | **Food-contact material facts** | 🧾 You (backlog A6) | Decides the item 4 wording. |
| 8 | **Insurer's wording** | 🧾 You (backlog A2) | Insurer may want specific exclusions in the terms. |
| 9 | **Anthropic and provider terms** | 🧾 You / ⚖️ | Confirm the no-training and retention statements against current provider terms. |
| 10 | **Company change-over** | 🧾 You | When the limited company takes over, the terms and privacy policy need a short notice that the business has transferred, and the data controller changes. Update the env vars and the "Last updated" date then. |

---

## 7. Once approved: implementation checklist

1. Apply the edits to `src/app/terms/page.tsx`, `src/app/returns/page.tsx`, `src/app/privacy/page.tsx`.
2. Update `legalLastUpdated` in `src/app/components/legal-page.tsx`.
3. Add the short "parts we don't make" line and a rights confirmation tick box to the quote form.
4. Add the food-contact line to cake topper and cookie cutter product pages and Etsy listings (A6).
5. Update the Etsy shop policies to match the custom-item returns wording (no website links in Etsy).
6. Set `NEXT_PUBLIC_LEGAL_NAME` (and `NEXT_PUBLIC_ICO_REGISTRATION` when available) in Vercel.
7. HQ Phase 1: build the 2-year deletion job before storing Etsy messages.
