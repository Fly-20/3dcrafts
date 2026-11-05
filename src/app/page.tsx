import Image from "next/image";
import Link from "next/link";
import { WhatsAppIcon } from "./components/whatsapp-icon";
import { OrderCounter } from "./components/order-counter";
import { Testimonials } from "./components/testimonials";
import { QuoteForm } from "./components/quote-form";
import { siteConfig } from "./site-config";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteConfig.url}/#business`,
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/3dcrafts-logo.svg`,
  email: siteConfig.email,
  description: siteConfig.description,
  address: {
    "@type": "PostalAddress",
    addressLocality: siteConfig.location.city,
    addressRegion: siteConfig.location.region,
    addressCountry: siteConfig.location.country,
  },
  areaServed: [
    { "@type": "City", name: siteConfig.location.city },
    { "@type": "AdministrativeArea", name: siteConfig.location.region },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Custom fabrication services",
    itemListElement: ["3D printing", "Rapid prototyping", "Laser cutting", "Laser engraving"].map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  },
  ...(siteConfig.googleBusinessProfileUrl ? { sameAs: [siteConfig.googleBusinessProfileUrl] } : {}),
};

const sectors: { title: string; copy: string; image?: { src: string; alt: string } }[] = [
  { title: "Trades & repair", copy: "Replacement parts, brackets, clips and jigs.", image: { src: "/sectors/trades-repair.jpg", alt: "A tradesperson fitting a custom 3D printed corner bracket to a wooden post" } },
  { title: "Bakers & food businesses", copy: "Personalised cake toppers, cookie cutters and stencils.", image: { src: "/sectors/bakers-food.jpg", alt: "A baker placing a custom Happy Birthday cake topper on a cake, with cookie cutters and a stencil nearby" } },
  { title: "Shops, cafés & salons", copy: "Signage, display stands, menu holders and fittings.", image: { src: "/sectors/shops-cafes.jpg", alt: "A café worker adjusting a custom wooden menu holder on the counter" } },
  { title: "Events & weddings", copy: "Table numbers, place names, favours and decor.", image: { src: "/sectors/events-weddings.jpg", alt: "A guest placing a custom arched table number 3 on a wedding table" } },
  { title: "Clubs, teams & companies", copy: "Trophies, keyrings, awards and branded gifts.", image: { src: "/sectors/clubs-teams.jpg", alt: "A person holding a gold football trophy, with more trophies and medals on a table" } },
  { title: "Makers & product designers", copy: "Prototypes, then short production runs.", image: { src: "/sectors/makers-designers.jpg", alt: "A product designer inspecting a white 3D printed enclosure prototype beside CAD on a laptop" } },
];

const steps = [
  { title: "Send a photo, sketch or file", copy: "Rough is fine. An STL, a drawing or a description all work." },
  { title: "We design & quote", copy: "We suggest the right process and material and send a clear quote." },
  { title: "We make & dispatch", copy: "Made, finished and checked in our workshop, then posted UK-wide." },
  { title: "Kept on file", copy: "Your design is saved, so ordering more later is quick and easy." },
];

const work = [
  { title: "Functional parts", type: "Prototypes & practical accessories", src: "/ChatGPT%20Image%20Aug%2025%2C%202026%2C%2010_14_35%20PM.png", alt: "A selection of custom 3D printed functional parts and accessories" },
  { title: "Sculptural prints", type: "Collectibles & homeware", src: "/ChatGPT%20Image%20Aug%2025%2C%202026%2C%2010_14_41%20PM.png", alt: "Low-poly 3D printed dragon, fox, planter and geometric objects" },
  { title: "Product prototypes", type: "Models, components & enclosures", src: "/ChatGPT%20Image%20Aug%2025%2C%202026%2C%2010_14_52%20PM.png", alt: "3D printed architectural model, mechanical component, planter and orange enclosure" },
  { title: "Desk organiser", type: "Office & retail accessories", src: "/ChatGPT%20Image%20Aug%2026%2C%202026%2C%2001_23_31%20PM.png", alt: "Black and orange 3D printed desk organiser holding a phone, pens and paper clips" },
];

const faqs = [
  { q: "How long does it take?", a: "It depends on the job and the quantity. Got a deadline? Add it to the form and we'll tell you straight away whether we can make it." },
  { q: "Is there a minimum order?", a: "No. We make single pieces as well as larger batches." },
  { q: "I don't have a design. Can you help?", a: "Yes. Send a photo, a sketch, some measurements or just a description, and we'll design it for you. You'll approve the design before we make anything." },
  { q: "What files can I send?", a: "Photos, sketches and PDFs are all fine. For ready-made designs we accept STL, STEP and SVG." },
  { q: "What's the biggest part you can print?", a: "Up to 256 x 256 x 256mm in one piece, the build size of our Bambu Lab P1S printers. Need something bigger? We can print it in parts and assemble it for you." },
  { q: "Do you deliver across the UK?", a: "Yes, anywhere in the UK. Delivery is included in your quote, and you can also collect from our Edinburgh workshop." },
  { q: "Can I order the same thing again later?", a: <>Yes. We keep your design on file, so repeat orders are quick. Just <a href="#quote">get in touch</a> and tell us what you ordered before.</> },
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema).replace(/</g, "\\u003c") }} />
      <a href="#main-content" className="skip-link">Skip to content</a>
      <main id="main-content" className="home">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">3D printing · Laser cutting · Engraving</p>
            <h1 id="hero-title">Custom 3D printing</h1>
            <p className="hero-subheading">From idea to finished product</p>
            <p className="hero-lead">Parts, prototypes, displays and personalised products, designed and made for businesses across the UK.</p>
            <div className="hero-actions"><a href="#quote" className="btn btn-accent">Get a free quote</a><a href="#sectors" className="btn btn-dark">Explore our work</a></div>
            <a href="#reviews" className="proof"><span className="proof-item"><span className="proof-stars" aria-hidden="true">★★★★★</span><span><strong>4.9</strong> from 100+ Etsy reviews</span></span><span className="proof-divider" aria-hidden="true" /><span className="proof-item"><strong><OrderCounter from={100} target={650} step={10} /></strong> orders delivered</span></a>
            <ul className="checks"><li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7.5" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg>UK-wide delivery</li><li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>No minimum order</li><li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>We design it for you</li></ul>
          </div>
          <div className="hero-art">
            <Image src="/hero-sphere-final.png" alt="Exploded 3D printed sphere in orange, black and cream showing its internal lattice" width={1024} height={768} unoptimized priority />
          </div>
        </section>

        <section className="sectors" id="sectors" aria-labelledby="sectors-title">
          <div className="wrap">
            <div className="section-head"><p className="eyebrow">Who we make for</p><h2 id="sectors-title">Made for businesses of every kind.</h2></div>
            <div className="sector-grid">{sectors.map((sector, index) => <a href="#quote" className="sector-card" key={sector.title}>{sector.image && <div className="sector-photo"><Image src={sector.image.src} alt={sector.image.alt} fill sizes="(max-width: 700px) 100vw, 380px" /></div>}<div className="sector-body"><span>0{index + 1}</span><h3>{sector.title}</h3><p>{sector.copy}</p></div></a>)}</div>
            <a href="#quote" className="text-arrow">Don&apos;t see your business? Tell us what you need →</a>
          </div>
        </section>

        <section className="process" id="how" aria-labelledby="how-title">
          <div className="wrap">
            <div className="section-head"><p className="eyebrow">How it works</p><h2 id="how-title">From idea to finished piece in four steps.</h2></div>
            <ol className="steps">{steps.map((step, index) => <li key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.copy}</p></li>)}</ol>
            <div className="capabilities">
              <h3>Services</h3>
              <ul aria-label="Services"><li className="pill">3D printing</li><li className="pill">Laser cutting</li><li className="pill">Laser engraving</li></ul>
              <h3>Materials</h3>
              <ul aria-label="Materials"><li className="pill-outline">PLA</li><li className="pill-outline">PETG</li><li className="pill-outline">Acrylic</li><li className="pill-outline">Plywood</li></ul>
            </div>
          </div>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <div className="wrap">
            <div className="work-head"><div><p className="eyebrow">Recent work</p><h2 id="work-title">Real jobs, real customers.</h2></div><Link href="/shop" className="text-arrow">Browse the shop →</Link></div>
            <div className="work-grid">{work.map((item) => <article className="work-card" key={item.title}><div className="tile"><Image src={item.src} alt={item.alt} fill sizes="(max-width: 600px) 100vw, 280px" /></div><h3>{item.title}</h3><p>{item.type}</p></article>)}</div>
          </div>
        </section>

        <Testimonials />

        <section className="faq" id="faq" aria-labelledby="faq-title">
          <div className="faq-intro"><p className="eyebrow">FAQ</p><h2 id="faq-title">Good questions, quick answers.</h2><p>Something else? <a href="#quote">Message us</a> and we&apos;ll get back to you.</p></div>
          <div className="faq-list">{faqs.map((faq) => <details key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</div>
        </section>

        <section className="quote" id="quote" aria-labelledby="quote-title">
          <div className="wrap">
            <div className="quote-intro">
              <p className="eyebrow">Get a quote</p><h2 id="quote-title">Tell us what you need.</h2>
              <p>A photo, a sketch or a few words is enough to get started. We&apos;ll come back with advice and a clear quote.</p>
              <div className="quote-direct">{siteConfig.whatsappNumber && <><span>Prefer to message?</span><a href={`https://wa.me/${siteConfig.whatsappNumber}`} className="whatsapp-btn"><WhatsAppIcon />Message us on WhatsApp</a><small>Send a photo straight from your phone.</small></>}<span>Or email us</span><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></div>
            </div>
            <QuoteForm />
          </div>
        </section>
      </main>
    </>
  );
}
