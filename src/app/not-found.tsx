import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found | 3DCRAFTS",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">Error 404</p>
      <h1>We can&apos;t find that page.</h1>
      <p>It may have moved, or the product may no longer be available. Try one of these instead:</p>
      <div className="not-found-links">
        <Link href="/">Home</Link>
        <Link href="/shop">Browse the shop</Link>
        <Link href="/#quote">Get a quote</Link>
      </div>
    </main>
  );
}
