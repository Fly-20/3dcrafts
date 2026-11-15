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
        <li>Custom, personalised and made-to-order items cannot be cancelled once we have started making them, unless they are faulty or not as described. Our <Link href="/returns">delivery &amp; returns</Link> policy explains this.</li>
        <li>We may correct pricing errors. If we do, we will contact you before processing the order so you can proceed at the correct price or cancel.</li>
      </ul>

      <h2>Design, approval and changes</h2>
      <p>Where we design a piece for you, we will share the design or details for your approval before we make it. Changes requested after approval may affect the price and timescale. Please check all text and dimensions carefully, because we make what you approve.</p>

      <h2>Designs, files and ownership</h2>
      <ul>
        <li><strong>Files you send us stay yours.</strong> If you supply a design, drawing, photo, logo or 3D file, you keep all rights in it. We use it only to quote for and make your order, and to make repeat orders if you ask.</li>
        <li><strong>Designs we create belong to us.</strong> If we create or adapt a design for you, we keep the rights in the design and the design files (for example the 3D model or cutting file), even where you have paid a design fee. The design fee pays for our time making it.</li>
        <li><strong>You own the item we make.</strong> Once you have paid, the physical item is yours to use, give away or sell.</li>
        <li><strong>Kept on file for reorders.</strong> We keep design files so we can make the same item again quickly. Ask us any time if you would like us to delete a file you supplied.</li>
        <li><strong>We won&apos;t sell your design.</strong> We won&apos;t turn a design made for you, or a file you supplied, into a product for sale to others without your permission. We may still make similar items using our own general techniques and styles.</li>
        <li><strong>Photos of your order.</strong> We may photograph or film items we make for you for our records. We will only use photos or video of your item in our marketing if you agree, and we won&apos;t show personal details such as names or messages without your permission.</li>
      </ul>

      <h2>Your responsibility for what you send</h2>
      <p>By sending us a design, image, logo, text or file, you confirm that you own it or have permission to use it for this order. Please don&apos;t ask us to reproduce:</p>
      <ul>
        <li>characters, logos or artwork from films, TV, games, books or brands (for example cartoon characters, football club badges or company logos), unless you own them or have written permission from the owner;</li>
        <li>another person&apos;s or company&apos;s protected design or product.</li>
      </ul>
      <p>We may decline any request we think is likely to infringe someone else&apos;s rights, or that is unlawful or unsafe, and would refund anything you have paid. If a claim is made against us because a file or design you supplied infringed someone else&apos;s rights, you agree to cover our reasonable costs of dealing with it.</p>

      <h2>Parts we don&apos;t make</h2>
      <p>For safety reasons we do not make, repair or copy parts where failure could injure someone. We will decline or cancel any order or quote for:</p>
      <ul>
        <li>vehicle parts for brakes, steering, suspension, seat belts, airbags or anything else safety-critical on a car, bike, motorbike, trailer or other vehicle;</li>
        <li>parts for gas appliances, boilers, fuel systems, or anything that carries gas or fuel;</li>
        <li>medical devices, mobility aids or personal protective equipment (PPE), including face shields, masks and protective guards;</li>
        <li>load-bearing or safety-critical parts, such as anything that holds a person&apos;s weight, lifting or climbing equipment, brackets or supports for heavy loads, or parts whose failure could cause injury;</li>
        <li>child car seats, cots, high chairs, baby carriers or their parts;</li>
        <li>weapons, parts of weapons, or replica or imitation firearms;</li>
        <li>electrical parts that carry mains voltage or must meet electrical safety standards (for example plug or socket housings).</li>
      </ul>
      <p>If you&apos;re not sure whether your part falls into one of these groups, ask us before ordering. If we accept an order and later find it is for one of these uses, we may cancel it and refund what you have paid.</p>

      <h2>Materials, finish and tolerances</h2>
      <p>Items are made from the materials described in the listing or quote, such as PLA, PETG, acrylic or plywood. 3D printed and laser-cut items can show small variations in colour, surface finish and dimensions. We aim to match the agreed specification, but these differences are normal.</p>

      <h2>Functional and replacement parts</h2>
      <p>Many of the parts we make are functional: replacement clips, knobs, brackets, enclosures, adapters and similar. For these:</p>
      <ul>
        <li><strong>You specify the part.</strong> You tell us what it is for, its size and any requirements (load, temperature, outdoor use and so on). We make it to that specification in the material agreed in the quote.</li>
        <li><strong>We will tell you if we think the material or design isn&apos;t suitable</strong> for the use you describe. If you tell us the intended use and we agree in writing that the part is suitable for it, we are responsible for the part being fit for that purpose.</li>
        <li><strong>Plastic and wooden parts have limits.</strong> 3D printed and laser-cut parts are generally weaker than moulded or metal originals, can soften with heat (for example in a hot car or near a heater), and can wear or become brittle over time, especially outdoors. Unless we have agreed otherwise in writing, our parts are not suitable for high-temperature, high-load or safety-critical use, or for contact with food (see &ldquo;Food contact&rdquo; below).</li>
        <li><strong>Fitting and use are up to you.</strong> Please check the part fits and works safely before relying on it, and stop using it if it shows cracks, wear or deformation. We are not responsible for damage caused by fitting a part incorrectly, using it outside the use you told us about, or modifying it.</li>
      </ul>

      <h2>Food contact: cake toppers and cookie cutters</h2>
      <p>3D printed and laser-cut items have tiny ridges and gaps that can trap food and bacteria, and most are not designed to be washed repeatedly. So, unless the product description says otherwise:</p>
      <ul>
        <li><strong>Cookie cutters</strong> are for short-term contact with dough only. Use them on chilled dough, wash by hand in warm (not hot) soapy water straight after use and dry fully. They are not dishwasher-safe and are not for heating or baking, and you should stop using them if they crack or get rough.</li>
        <li><strong>Cake toppers</strong> are decorations, not food, and should not be eaten. Use them for display and remove them before serving. If your topper goes into the cake and doesn&apos;t come with a food-safe sleeve, put the stem in a straw or wrap it before inserting.</li>
        <li><strong>Not for long-term food contact.</strong> Don&apos;t use our items to store, serve or prepare food for long periods, or with hot, fatty or acidic foods, unless the product description states they are suitable.</li>
        <li><strong>Small parts.</strong> Toppers and decorations can contain small parts. They are not toys. Keep them away from young children.</li>
      </ul>

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
