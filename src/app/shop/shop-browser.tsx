"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPence } from "@/lib/money";

export type ShopProduct = {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  category: { name: string; slug: string } | null;
  personalised: boolean;
  image: { url: string; alt: string } | null;
  pricePence: number;
  hasPriceRange: boolean;
};

type SortKey = "newest" | "az" | "price-low" | "price-high";

export function ShopBrowser({ products, whatsappNumber }: { products: ShopProduct[]; whatsappNumber: string }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    products.forEach((product) => { if (product.category) seen.set(product.category.slug, product.category.name); });
    return [...seen].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products
      .filter((product) => category === "all" || product.category?.slug === category)
      .filter((product) => !term || `${product.title} ${product.category?.name ?? ""}`.toLowerCase().includes(term))
      .sort((a, b) => {
        if (sort === "az") return a.title.localeCompare(b.title);
        if (sort === "price-low") return a.pricePence - b.pricePence;
        if (sort === "price-high") return b.pricePence - a.pricePence;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [products, category, query, sort]);

  return (
    <main className="shop">
      <section className="shop-intro">
        <div className="shop-intro-copy">
          <p className="eyebrow">Shop</p>
          <h1>Ready-to-order designs, made in our workshop.</h1>
          <p>Every piece is made to order. Many can be personalised with your name, logo or colours.</p>
        </div>
        <ul className="shop-checks"><li><span>★</span> 4.9 · 100+ Etsy reviews</li><li>✓ UK-wide delivery</li><li>✓ Made to order</li></ul>
      </section>

      <section className="shop-toolbar" aria-label="Filter products">
        {categories.length > 0 && (
          <div role="group" aria-label="Categories" className="shop-pills">
            {[{ slug: "all", name: "All" }, ...categories].map((item) => <button key={item.slug} type="button" aria-pressed={category === item.slug} onClick={() => setCategory(item.slug)}>{item.name}</button>)}
          </div>
        )}
        <div className="shop-controls">
          <label className="shop-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <span className="sr-only">Search products</span>
            <input type="search" placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="shop-sort">
            <span aria-live="polite">{shown.length} {shown.length === 1 ? "product" : "products"}</span>
            <label>Sort
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                <option value="newest">Newest</option>
                <option value="az">A–Z</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="shop-grid-wrap">
        {shown.length ? (
          <div className="shop-grid">
            {shown.map((product, index) => (
              <Link key={product.id} href={`/shop/${product.slug}`} className="shop-card">
                <div className="shop-card-image">
                  {product.image ? <Image src={product.image.url} alt={product.image.alt} fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 280px" priority={index < 4} /> : <span>No image</span>}
                  {product.personalised && <span className="shop-badge">Personalised</span>}
                </div>
                <div className="shop-card-body">
                  {product.category && <span className="shop-card-cat">{product.category.name}</span>}
                  <h2>{product.title}</h2>
                  <p className="shop-card-price">{product.hasPriceRange ? "From " : ""}{formatPence(product.pricePence)}</p>
                  <span className="shop-card-link">View product →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="shop-empty">{products.length ? "No products match your search. Try another word or category, or tell us what you need below." : "No products available right now. Have something in mind? Tell us below."}</p>
        )}
      </section>

      <section className="shop-banner-wrap">
        <div className="shop-banner">
          <div>
            <p className="eyebrow">Can&apos;t find it?</p>
            <h2>We&apos;ll make it for you.</h2>
            <p>Send a photo, sketch or idea and get a quote for something made just for your business.</p>
          </div>
          <div className="shop-banner-actions">
            <Link href="/#quote" className="btn btn-accent">Get a quote</Link>
            {whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} className="btn btn-outline-light">WhatsApp us</a>}
          </div>
        </div>
      </section>
    </main>
  );
}
