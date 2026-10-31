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
        <li><strong>Quote requests:</strong> your name, email address, business name (if given), what you need, quantity, and any photos, sketches or design files you upload. We use these to reply to you and prepare a quote. Lawful basis: taking steps at your request before a contract, and our legitimate interest in running our business.</li>
        <li><strong>Orders:</strong> your name, email address, delivery address, the items you ordered, any personalisation text you provide, and order and payment status. We use these to make, dispatch and support your order, to keep records and to meet tax and accounting obligations. Lawful basis: performing our contract with you, and legal obligation.</li>
        <li><strong>Order tracking:</strong> when you look up an order we check the order number and email you enter against our records.</li>
        <li><strong>Basic technical data:</strong> such as IP address and browser details, processed by our hosting and security providers to deliver the site, prevent abuse and apply rate limits. Lawful basis: legitimate interests.</li>
      </ul>
      <p>We do not collect your card details. Payments are taken by Stripe, which handles them under its own privacy policy. We receive only confirmation of the payment and limited details such as the last four card digits.</p>
      <p>We do not use your data for automated decision-making, and we do not sell it.</p>

      <h2>Cookies and local storage</h2>
      <p>We use only what is needed to make the site work: your basket is saved in your browser&apos;s local storage so it is still there when you return, and administrators use a sign-in session cookie. We do not currently use advertising or analytics cookies. If that changes we will update this page and ask for consent where the law requires it.</p>

      <h2>Who we share data with</h2>
      <p>We use trusted providers to run the business, and they process data only on our instructions:</p>
      <ul>
        <li>Stripe, for taking payments.</li>
        <li>Supabase, for our database and file storage.</li>
        <li>Resend, for sending emails such as quote replies and order updates.</li>
        <li>Our hosting provider, for serving the website.</li>
        <li>Upstash, for rate limiting to prevent abuse.</li>
        <li>Delivery carriers, who receive your name, delivery address and, where needed, contact details so they can deliver your parcel.</li>
        <li>Our accountants and professional advisers, where needed.</li>
        <li>Internal messaging tools we use to alert our team about new quotes and orders.</li>
      </ul>
      <p>Some of these providers may process data outside the UK. Where they do, we rely on safeguards such as the UK International Data Transfer Agreement or addendum, or an adequacy decision.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Quote requests that do not lead to an order: up to 12 months.</li>
        <li>Order and payment records: 6 years, to meet tax and accounting requirements.</li>
        <li>Design files for repeat orders: while you remain a customer, unless you ask us to delete them sooner.</li>
      </ul>

      <h2>Your rights</h2>
      <p>You have the right to access your data, correct it, ask us to erase it, restrict or object to our use of it, and receive a copy in a portable format. Email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> and we will respond within one month. Some records, such as invoices, we must keep by law.</p>
      <p>If you are unhappy with how we handle your data you can complain to the Information Commissioner&apos;s Office at <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer">ico.org.uk</a> or on 0303 123 1113. We would appreciate the chance to put things right first.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. The date at the top shows when it last changed.</p>
    </LegalPage>
  );
}
