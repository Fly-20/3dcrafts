import type { Metadata } from "next";
import { LegalPage } from "../components/legal-page";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Privacy policy | 3DCRAFTS",
  description: "How 3DCRAFTS collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const operator = siteConfig.legalName ?? siteConfig.name;

  return (
    <LegalPage title="Privacy policy">
      <p>This policy explains how {operator} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) looks after your personal data when you use {siteConfig.url.replace("https://", "")}, request a quote or place an order. We are based in {siteConfig.location.city}, {siteConfig.location.region}, and handle your data in line with UK GDPR and the Data Protection Act 2018.</p>

      <h2>Who is responsible for your data</h2>
      <p>{operator} is the data controller. {siteConfig.companyNumber && <>Company number: {siteConfig.companyNumber}. </>}{siteConfig.icoRegistration && <>ICO registration: {siteConfig.icoRegistration}. </>}You can contact us about anything in this policy at <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.</p>

      <h2>What we collect and why</h2>
      <ul>
        <li><strong>Enquiries and quote requests:</strong> your name, email address, phone number (if you give it or message us on WhatsApp), business name (if given), what you need, quantity, and any photos, sketches, measurements or design files you upload. We also keep the messages we exchange with you. We use these to reply, prepare quotes, make your order and recognise you if you get in touch again. Lawful basis: taking steps at your request before a contract, performing our contract with you, and our legitimate interest in running our business.</li>
        <li><strong>Etsy messages and orders:</strong> if you contact us or buy from us on Etsy, we receive your Etsy username, name, the messages you send us, any files you attach and, for orders, your delivery address and order details. Etsy is a separate controller of the data it holds about you (see Etsy&apos;s privacy policy). We copy your messages and order details into our own secure business system so we can reply, quote and keep track of your order. We use this information only for your enquiry and order, and we do not add Etsy customers to our mailing list unless you separately sign up. Lawful basis: performing our contract with you, and our legitimate interest in managing enquiries.</li>
        <li><strong>Orders:</strong> your name, email address, delivery address, the items you ordered, any personalisation text you provide, and order and payment status. We use these to make, dispatch and support your order, to keep records and to meet tax and accounting obligations. Lawful basis: performing our contract with you, and legal obligation.</li>
        <li><strong>Order tracking:</strong> when you look up an order we check the order number and email you enter against our records.</li>
        <li><strong>Basic technical data:</strong> such as IP address and browser details, processed by our hosting and security providers to deliver the site, prevent abuse and apply rate limits. Lawful basis: legitimate interests.</li>
      </ul>
      <p>We do not collect your card details. Payments are taken by Stripe, which handles them under its own privacy policy. We receive only confirmation of the payment and limited details such as the last four card digits.</p>
      <p>We do not make decisions about you using automated processing alone, and we do not sell your data. AI tools help us draft replies, as explained below, but a person reviews everything.</p>

      <h2>How we use AI tools</h2>
      <p>To reply to enquiries faster, we use an AI service (Claude, provided by Anthropic) to help us read enquiries, pick out the details of what you need, and draft replies and quotes. When we do this, the content of your enquiry, such as your message, measurements and order details, and sometimes images you send, is passed to Anthropic for processing.</p>
      <ul>
        <li><strong>A person always checks.</strong> AI only produces drafts. Every reply and quote is checked, edited if needed, and approved by us before it is sent to you. Nothing is sent automatically.</li>
        <li><strong>No decisions are made about you by AI alone.</strong> Prices come from our own pricing rules, and we decide whether to accept a job.</li>
        <li><strong>Your data isn&apos;t used to train AI.</strong> Anthropic processes data on our behalf under its commercial terms, which do not allow it to use our customers&apos; data to train its models.</li>
        <li><strong>We send only what&apos;s needed.</strong> We don&apos;t send payment details to the AI service, and we avoid sending contact details where they aren&apos;t needed for the draft.</li>
      </ul>
      <p>If you would rather we didn&apos;t use AI tools on your enquiry, tell us and we&apos;ll handle it entirely by hand.</p>

      <h2>Cookies and local storage</h2>
      <p>We use only what is needed to make the site work: your basket is saved in your browser&apos;s local storage so it is still there when you return, and administrators use a sign-in session cookie. We do not currently use advertising or analytics cookies. If that changes we will update this page and ask for consent where the law requires it.</p>

      <h2>Who we share data with</h2>
      <p>We use trusted providers to run the business, and they process data only on our instructions:</p>
      <ul>
        <li>Stripe, for taking payments.</li>
        <li>Supabase, for our database and file storage (including enquiries, messages and files you upload).</li>
        <li>Resend, for sending emails such as quote replies and order updates.</li>
        <li>Vercel, which hosts our website.</li>
        <li>Anthropic, which provides the AI service we use to help draft replies and quotes (see &ldquo;How we use AI tools&rdquo;).</li>
        <li>Upstash, for rate limiting to prevent abuse.</li>
        <li>Discord, which we use for internal notifications about new enquiries and orders. These alerts may include your name and a short summary of your enquiry.</li>
        <li>Google, whose email service receives Etsy&apos;s message notifications, which we forward into our business system.</li>
        <li>Etsy, for enquiries and orders placed through our Etsy shop.</li>
        <li>Delivery carriers, who receive your name, delivery address and, where needed, contact details so they can deliver your parcel.</li>
        <li>Our accountants and professional advisers, where needed.</li>
      </ul>
      <p>Some of these providers process data outside the UK, and several are based in the United States, including Stripe, Vercel, Anthropic and Resend. Where data is transferred outside the UK, we rely on safeguards such as the UK International Data Transfer Agreement or addendum, or an adequacy decision.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Enquiries, messages and uploaded files that don&apos;t lead to an order: deleted 2 years after our last contact with you.</li>
        <li>Customer records and messages linked to an order: kept for 2 years after your last order or contact, then deleted, apart from the order and payment records below.</li>
        <li>Order, invoice and payment records: 6 years after the end of the financial year they relate to, to meet tax and VAT requirements.</li>
        <li>Design files for repeat orders: kept while they are useful for reorders and reviewed every 2 years. Files you supplied are deleted on request, and designs we created may be kept without your personal details.</li>
        <li>AI processing: our AI provider keeps data only for a limited period under its commercial terms, and does not use it to train its models.</li>
        <li>Marketing consent records (for example permission to feature your item): kept as long as we use the content, plus 2 years.</li>
      </ul>

      <h2>Your rights</h2>
      <p>You have the right to access your data, correct it, ask us to erase it, restrict or object to our use of it, and receive a copy in a portable format. Email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> and we will respond within one month. Some records, such as invoices, we must keep by law.</p>
      <p>If you are unhappy with how we handle your data you can complain to the Information Commissioner&apos;s Office at <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer">ico.org.uk</a> or on 0303 123 1113. We would appreciate the chance to put things right first.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. The date at the top shows when it last changed.</p>
    </LegalPage>
  );
}
