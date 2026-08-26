import Image from "next/image";
import { MobileNav } from "./components/mobile-nav";
import { QuoteForm } from "./components/quote-form";

const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="arrow-icon"><path d={diagonal ? "M6 18 18 6M9 6h9v9" : "M5 12h14m-5-5 5 5-5 5"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const services = [
  { number: "01", title: "3D Printing", copy: "From a single functional prototype to a finely finished small batch. We print accurate, durable parts in materials chosen around how the object needs to perform.", tags: ["Prototypes", "Production parts", "Bespoke objects"] },
  { number: "02", title: "Laser Cutting", copy: "Precise, repeatable cutting for signage, displays, models, packaging and components — with thoughtful material advice and a beautifully clean finish.", tags: ["Acrylic", "Timber", "Card & board"] },
  { number: "03", title: "Laser Engraving", copy: "Permanent detail, from names and marks to intricate artwork. Ideal for products, gifts, awards and brand moments that deserve a tactile signature.", tags: ["Personalisation", "Branding", "Fine detail"] },
];

const work = [
  { title: "Functional parts", type: "Prototypes & practical accessories", src: "/ChatGPT%20Image%20Aug%2025%2C%202026%2C%2010_14_35%20PM.png", alt: "A selection of custom 3D printed functional parts and accessories" },
  { title: "Sculptural prints", type: "Collectibles & homeware", src: "/ChatGPT%20Image%20Aug%2025%2C%202026%2C%2010_14_41%20PM.png", alt: "Low-poly 3D printed dragon, fox, planter and geometric objects" },
  { title: "Product prototypes", type: "Models, components & enclosures", src: "/ChatGPT%20Image%20Aug%2025%2C%202026%2C%2010_14_52%20PM.png", alt: "3D printed architectural model, mechanical component, planter and orange enclosure" },
];

export default function Home() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="3DCRAFTS, home"><Image src="/3dcrafts-logo.svg" alt="3DCRAFTS" width={1200} height={310} priority unoptimized /></a>
        <nav aria-label="Primary navigation" className="desktop-nav"><a href="#services">Services</a><a href="#work">Selected work</a><a href="#process">Process</a></nav>
        <a href="#quote" className="nav-cta">Get In Touch <Arrow /></a>
        <MobileNav />
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <h1 id="hero-title" className="reveal reveal-delay-1">Ideas,<br /><em>made physical.</em></h1>
          <div className="hero-showcase" role="img" aria-label="Examples of custom 3D printed creations">
            <Image className="hero-slide hero-slide-one" src="/ChatGPT%20Image%20Aug%2026%2C%202026%2C%2001_30_24%20PM.png" alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 56vw, 38vw" priority />
            <Image className="hero-slide hero-slide-two" src="/ChatGPT%20Image%20Aug%2026%2C%202026%2C%2001_39_52%20PM.png" alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 56vw, 38vw" loading="eager" />
            <Image className="hero-slide hero-slide-three" src="/ChatGPT%20Image%20Aug%2026%2C%202026%2C%2001_13_49%20PM.png" alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 56vw, 38vw" loading="eager" />
          </div>
          <div className="hero-bottom reveal reveal-delay-2"><p>Custom 3D printing and laser craft for people with a sketch, a problem, or a brilliant idea.</p><a href="#quote" className="text-link">Start your project <Arrow /></a></div>
          <div className="scroll-note" aria-hidden="true">Scroll to explore <span>↓</span></div>
        </section>

        <section className="intro section-pad" aria-labelledby="intro-title">
          <p className="eyebrow">What we do</p><div className="intro-grid"><h2 id="intro-title">We turn good ideas into <em>objects that work.</em></h2><div className="intro-copy"><p>3DCRAFTS is an independent workshop making one-offs, prototypes and short production runs for designers, businesses and curious individuals.</p><p>We pair digital precision with a maker&apos;s eye — helping you choose the right process, material and finish from the start.</p><a href="#services" className="text-link dark-link">Explore our capabilities <Arrow /></a></div></div>
        </section>

        <section className="services section-pad" id="services" aria-labelledby="services-title">
          <div className="section-heading"><p className="eyebrow light">Capabilities</p><h2 id="services-title">Made to be<br /><em>used, held, kept.</em></h2><p>Flexible making, from the very first iteration to the final polished piece.</p></div>
          <div className="service-list">{services.map((service) => <article className="service-row" key={service.title}><span className="service-number">{service.number}</span><h3>{service.title}</h3><div className="service-detail"><p>{service.copy}</p><ul aria-label={`${service.title} applications`}>{service.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></div><span className="service-arrow" aria-hidden="true"><Arrow diagonal /></span></article>)}</div>
        </section>

        <section className="work section-pad" id="work" aria-labelledby="work-title">
          <div className="work-heading"><div><p className="eyebrow">Selected work</p><h2 id="work-title">A few things<br />we&apos;ve <em>brought to life.</em></h2></div><p>Every project starts differently. Every one ends with something real.</p></div>
          <div className="work-grid">{work.map((item, index) => <article className={`work-card work-${index + 1}`} key={item.title}><div className="work-visual"><Image src={item.src} alt={item.alt} fill sizes={index === 0 ? "(max-width: 600px) 100vw, 62vw" : index === 1 ? "(max-width: 600px) 100vw, 36vw" : "(max-width: 600px) 100vw, 62vw"} /><span className="visual-index" aria-hidden="true">0{index + 1}</span></div><div className="work-meta"><h3>{item.title}</h3><p>{item.type}</p><span><Arrow diagonal /></span></div></article>)}</div>
        </section>

        <section className="process section-pad" id="process" aria-labelledby="process-title">
          <div className="process-heading"><p className="eyebrow">How it works</p><h2 id="process-title">Simple from<br /><em>start to finish.</em></h2></div>
          <ol className="steps"><li><span>01</span><div className="step-icon"><svg aria-hidden="true" viewBox="0 0 48 48"><path d="M10 12h28v20H22l-8 6v-6h-4V12Z" /><path d="M17 21h14M17 26h9" /></svg></div><h3>Share your idea</h3><p>Send us a sketch, CAD file, reference image or simply a description. Rough is absolutely fine.</p></li><li><span>02</span><div className="step-icon"><svg aria-hidden="true" viewBox="0 0 48 48"><path d="M12 8h24v32H12zM18 17h12M18 24h12M18 31h7" /><path d="m28 31 2 2 5-6" /></svg></div><h3>Hear from us</h3><p>We&apos;ll review the details, suggest the best approach and get back to you with clear next steps.</p></li><li><span>03</span><div className="step-icon lime"><svg aria-hidden="true" viewBox="0 0 48 48"><path d="m24 7 16 9v17l-16 9-16-9V16l16-9Z" /><path d="m8 16 16 9 16-9M24 25v17M17 12l16 9" /></svg></div><h3>We make it</h3><p>Once approved, we produce, finish and check your project — ready for collection or UK delivery.</p></li></ol>
        </section>

        <section className="materials section-pad" aria-labelledby="materials-title"><div className="materials-copy"><p className="eyebrow light">Materials &amp; uses</p><h2 id="materials-title">The right material<br />makes the <em>difference.</em></h2><p>Not sure what you need? That&apos;s part of the service. We&apos;ll recommend the best combination of material, process and finish for your project.</p><a href="#quote" className="text-link lime-link">Talk materials with us <Arrow /></a></div><div className="materials-lists"><div><h3>Materials</h3><ul><li>PLA</li><li>PETG</li><li>Acrylic</li><li>Plywood</li></ul></div><div><h3>Made for</h3><ul><li>Product prototypes</li><li>Replacement parts</li><li>Architectural models</li><li>Retail &amp; event displays</li><li>Brand merchandise</li><li>Personalised gifts</li></ul></div></div></section>

        <section className="quote section-pad" id="quote" aria-labelledby="quote-title"><p className="eyebrow">Have something in mind?</p><h2 id="quote-title">Let&apos;s make<br /><em>something real.</em></h2><p className="quote-copy">Tell us what you&apos;re thinking. We&apos;ll come back with practical advice and clear next steps</p><QuoteForm /></section>
      </main>

      <footer className="footer"><div className="footer-main"><a href="#top" className="footer-brand" aria-label="3DCRAFTS, back to top"><Image src="/3dcrafts-footer-logo.svg" alt="3DCRAFTS" width={1200} height={310} unoptimized /></a><div><p>Digital precision.<br />Made with care.</p></div><nav aria-label="Footer navigation"><a href="#services">Services</a><a href="#work">Work</a><a href="#process">Process</a><a href="#quote">Contact Us</a></nav><address><a href="mailto:hello@3dcrafts.uk">hello@3dcrafts.uk</a></address></div><div className="footer-bottom"><span>© 2026 3DCRAFTS. All rights reserved.</span><a href="#top">Back to top ↑</a></div></footer>
    </>
  );
}
