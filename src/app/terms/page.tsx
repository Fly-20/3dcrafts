import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../components/legal-page";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Terms & conditions | 3DCRAFTS",
  description: "Terms and conditions for buying 3D printing, laser cutting and engraving from 3DCRAFTS.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const operator = siteConfig.legalName ?? siteConfig.name;

  return (
    <LegalPage title="Terms & conditions">
      <h2>About us</h2>
      <p>These terms apply to products and services supplied by {operator}, based in {siteConfig.location.city}, {siteConfig.location.region}. {siteConfig.companyNumber && <>Company number: {siteConfig.companyNumber}. </>}Contact: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. By placing an order or accepting a quote you agree to them.</p>

      <h2>Orders and quotes</h2>
      <ul>
        <li>Shop orders: when you place an order we send an email acknowledging it. The contract is formed when we confirm that we have accepted your order. If we cannot fulfil it, we will tell you and refund anything you have paid.</li>
        <li>Custom work: we provide a written quote after you describe what you need. A quote is valid for the period stated on it, and the contract is formed when you accept it and we confirm.</li>
        <li>Prices are in pounds sterling and include VAT where it applies. Delivery is charged separately unless stated otherwise.</li>
        <li>Payment is taken in full at checkout for shop orders. For custom work, payment terms are set out in the quote.</li>
        <li>We may correct pricing errors. If we do, we will contact you before processing the order so you can proceed at the correct price or cancel.</li>
      </ul>

      <h2>Design, approval and changes</h2>
      <p>Where we design a piece for you, we will share the design or details for your approval before we make it. Changes requested after approval may affect the price and timescale. Please check all text and dimensions carefully, because we make what you approve.</p>

      <h2>Your files and designs</h2>
      <ul>
        <li>You must have the right to use any design, logo, image or file you send us, and must not ask us to copy someone else&apos;s protected work without permission. You agree to cover us for claims arising from files you supply in breach of this.</li>
        <li>You keep the rights in designs you supply. For designs we create for you, you may use the finished items as you wish, and we keep the underlying files and may keep them on record for repeat orders.</li>
        <li>We may refuse or cancel any order for items that are unlawful, unsafe or infringing, including weapons or parts of weapons. We would refund you in full.</li>
      </ul>

      <h2>Materials, finish and tolerances</h2>
      <p>Items are made from the materials described in the listing or quote, such as PLA, PETG, acrylic or plywood. 3D printed and laser-cut items can show small variations in colour, surface finish and dimensions. We aim to match the agreed specification, but these differences are normal. Plastic parts are not suitable for safety-critical, load-bearing or high-temperature use, or for contact with food unless we have specifically agreed that in writing.</p>

      <h2>Delivery, cancellation and returns</h2>
      <p>Delivery, cancellation, returns and refunds are covered in our <Link href="/returns">delivery &amp; returns</Link> policy, which forms part of these terms.</p>

      <h2>Our liability</h2>
      <p>Nothing in these terms limits our liability for death or personal injury caused by negligence, fraud, or anything else that cannot be limited by law, or affects your statutory rights as a consumer. Otherwise, our total liability for any order is limited to the price you paid for it. We are not liable for loss of profit, business or goodwill, or for indirect or unforeseeable loss. We are not responsible for delays or failures caused by events outside our reasonable control.</p>

      <h2>Privacy</h2>
      <p>We handle your personal data as described in our <Link href="/privacy">privacy policy</Link>.</p>

      <h2>Complaints</h2>
      <p>If something goes wrong, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> and we will do our best to resolve it quickly.</p>

      <h2>General</h2>
      <p>We may update these terms, and the version in force when you order applies to that order. If any part of these terms is found unenforceable, the rest still applies. These terms are governed by Scots law and the Scottish courts have jurisdiction, although if you are a consumer living elsewhere in the UK you may also bring proceedings in the courts of the part of the UK where you live.</p>
    </LegalPage>
  );
}
