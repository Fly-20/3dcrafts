import { siteConfig } from "../site-config";
import { testimonials, type Testimonial } from "../testimonials";

const avatarColours = ["#8c8f96", "#c47a3d", "#5b3a29", "#2f5d50", "#9b3d36", "#3f4a5c", "#7a5c1e", "#6a4c93"];

function Card({ review, index }: { review: Testimonial; index: number }) {
  return (
    <figure className="review-card">
      <div className="review-meta">
        <span className="review-stars" role="img" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}<span aria-hidden="true">{"★".repeat(5 - review.rating)}</span></span>
        <span>{review.date}</span>
      </div>
      <blockquote>{review.text}</blockquote>
      <figcaption>
        <span className="review-avatar" style={{ background: avatarColours[index % avatarColours.length] }} aria-hidden="true">{review.name[0].toUpperCase()}</span>
        <span className="review-name">{review.name}</span>
      </figcaption>
      <div className="review-order"><div><span>Ordered</span><small>{review.item}</small></div>{review.price && <strong>{review.price}</strong>}</div>
    </figure>
  );
}

function Row({ items, reverse = false, offset = 0 }: { items: Testimonial[]; reverse?: boolean; offset?: number }) {
  // The track holds two identical copies so the loop is seamless; the second copy is hidden from assistive tech.
  return (
    <div className={`marquee-row${reverse ? " is-reverse" : ""}`}>
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div className="marquee-group" key={copy} aria-hidden={copy === 1 || undefined}>
            {items.map((review, index) => <Card key={`${review.name}-${index}`} review={review} index={index + offset} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  if (!testimonials.length) return null;
  // Repeat short lists so each group is wider than the screen.
  const filled = Array.from({ length: Math.max(1, Math.ceil(8 / testimonials.length)) }, () => testimonials).flat();
  const half = Math.ceil(filled.length / 2);

  return (
    <section className="reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="reviews-head">
        <p className="eyebrow">Reviews</p>
        <h2 id="reviews-title">What customers say on Etsy.</h2>
      </div>
      <div className="marquee">
        <Row items={filled.slice(0, half)} />
        <Row items={filled.slice(half)} reverse offset={3} />
      </div>
      {siteConfig.etsyUrl && <a href={siteConfig.etsyUrl} className="text-arrow reviews-link" rel="noopener noreferrer">Read all reviews on Etsy →</a>}
    </section>
  );
}
