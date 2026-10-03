import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop | 3DCRAFTS",
  description: "Products coming soon from our Edinburgh workshop.",
};

export default function ShopPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-[6.5vw] py-24 text-center">
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-black/60">3DCRAFTS Shop</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Products coming soon</h1>
      <p className="mt-6 max-w-lg text-base leading-relaxed text-black/60">We&apos;re working on ready-to-buy pieces from our Edinburgh workshop. Have something in mind? We&apos;d love to hear about it.</p>
      <Link href="/#quote" className="mt-8 border-b border-current pb-1 text-sm font-semibold uppercase tracking-widest">Start your project</Link>
    </main>
  );
}
