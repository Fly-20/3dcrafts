import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../components/legal-page";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Delivery & returns | 3DCRAFTS",
  description: "Delivery options, cancellations, returns and refunds for 3D printed and laser-cut items from 3DCRAFTS.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <LegalPage title="Delivery & returns">
      <h2>Delivery</h2>
      <ul>
        <li>We deliver anywhere in the UK. The delivery cost for your order is shown at checkout, or included in your quote for custom work.</li>
        <li>You can also collect from our {siteConfig.location.city} workshop by arrangement. We will tell you when your order is ready.</li>
        <li>Everything is made to order, so lead times depend on the item, quantity and our current workload. We give an estimate at checkout or in your quote, and will tell you promptly if there is a delay. Estimates are not guaranteed delivery dates.</li>
        <li>We pack items carefully. Please check your parcel on arrival and contact us within 48 hours if anything is damaged, with photos of the item and packaging.</li>
      </ul>

      <h2>Custom, personalised and made-to-order items</h2>
      <p>Most of what we sell is made for you after you order. If an item is made to your specification or clearly personalised, the legal 14-day right to change your mind does not apply. This is set out in regulation 28(1)(b) of the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013. This includes, for example:</p>
      <ul>
        <li>items with your name, text, photo, logo or message on them (such as engraved wooden cards and cake toppers);</li>
        <li>parts made to your measurements, drawings or design files;</li>
        <li>items made in a size, colour or material you chose specially, where that is not an option we normally sell.</li>
      </ul>
      <p>You can cancel a custom order free of charge before we start making it. Once we have started, we cannot cancel or refund it just because you have changed your mind.</p>
      <p><strong>This does not affect your rights if something goes wrong.</strong> If a custom item arrives faulty, damaged, or not made to the design or specification you approved, we will put it right. See &ldquo;Faulty or incorrect items&rdquo; below.</p>
      <p>Before we make a custom piece we will show you the design or details to approve. Please check spelling, dates, sizes and colours carefully, because we make exactly what you approve.</p>

      <h2>Changing your mind: standard items</h2>
      <p>For items that are not custom or personalised, you can cancel within 14 days of receiving them, without giving a reason. To do so, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> with your order number. You must then send the item back to us within 14 days of telling us you want to cancel, and take reasonable care of it while it is with you. Unless the item was faulty, you pay the cost of returning it. We will refund the price of the item and the standard delivery cost within 14 days of receiving it back, or of receiving proof you have sent it.</p>

      <h2>Faulty or incorrect items</h2>
      <p>Your legal rights under the Consumer Rights Act 2015 apply to everything we sell: items must be of satisfactory quality, fit for purpose and as described. If something is faulty or not what you ordered:</p>
      <ul>
        <li>Within 30 days of delivery you can reject it for a full refund.</li>
        <li>After that, you are entitled to a repair or replacement, and if that is not possible or does not fix the problem, a price reduction or refund.</li>
      </ul>
      <p>Email us at <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> with your order number and photos. We cover the return postage for faulty or incorrect items and refund to your original payment method, normally within 14 days of agreeing the refund.</p>
      <p>3D printed and laser-cut items can show small natural variations, such as faint layer lines, minor colour differences between batches or slight dimensional tolerances. These are normal for the process and are not faults.</p>

      <h2>Business customers</h2>
      <p>If you are buying for your business, the consumer rights above may not apply. We will still work with you to put right any item that is faulty or not made to the agreed specification. Please contact us within 7 days of delivery.</p>

      <p>See also our <Link href="/terms">terms &amp; conditions</Link> and <Link href="/privacy">privacy policy</Link>.</p>
    </LegalPage>
  );
}
