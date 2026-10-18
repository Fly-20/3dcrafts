import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/public";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = {
  title: "Shop | 3DCRAFTS",
  description: "Shop 3D printed pieces from our Edinburgh workshop.",
};

export default async function ShopPage() {
  await connection();
  const supabase = createPublicServerClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, title, base_price_pence, product_images(url, alt, sort_order), product_variants(status, price_pence)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load shop products.");

  return (
    <main className="min-h-[60vh] px-[6.5vw] py-16 sm:py-24">
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-black/60">3DCRAFTS Shop</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Shop</h1>
      <p className="mt-6 max-w-lg text-base leading-relaxed text-black/60">3D printed pieces from our Edinburgh workshop.</p>
      {products?.length ? (
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const image = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
            const prices = product.product_variants.filter((variant) => variant.status === "active").map((variant) => variant.price_pence ?? product.base_price_pence);
            const price = prices.length ? Math.min(...prices) : product.base_price_pence;
            const hasPriceRange = prices.some((value) => value !== price);

            return (
              <Link key={product.id} href={`/shop/${product.slug}`} className="group">
                <div className="relative aspect-square overflow-hidden bg-black/5">
                  {image ? (
                    <Image src={image.url} alt={image.alt ?? product.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-black/40">No image</div>
                  )}
                </div>
                <h2 className="mt-4 text-lg font-semibold group-hover:underline">{product.title}</h2>
                <p className="mt-1 text-sm text-black/60">{hasPriceRange ? "From " : ""}{formatPence(price)}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-12">
          <p className="text-black/60">No products available right now. Have something in mind? We&apos;d love to hear about it.</p>
          <Link href="/#quote" className="mt-8 inline-block border-b border-current pb-1 text-sm font-semibold uppercase tracking-widest">Start your project</Link>
        </div>
      )}
    </main>
  );
}
