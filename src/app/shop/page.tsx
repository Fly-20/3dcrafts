import type { Metadata } from "next";
import { connection } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/public";
import { siteConfig } from "../site-config";
import { ShopBrowser, type ShopProduct } from "./shop-browser";

export const metadata: Metadata = {
  title: "Shop | 3DCRAFTS",
  description: "Ready-to-order 3D printed and laser-cut pieces, made to order in our Edinburgh workshop.",
};

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  base_price_pence: number;
  created_at: string;
  personalisation_required: boolean;
  category: { name: string; slug: string } | null;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  product_variants: { status: string; price_pence: number | null }[];
};

export default async function ShopPage() {
  await connection();
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, title, base_price_pence, created_at, personalisation_required, category:categories(name, slug), product_images(url, alt, sort_order), product_variants(status, price_pence)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load shop products.");

  const products: ShopProduct[] = ((data ?? []) as unknown as ProductRow[]).map((product) => {
    const image = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
    const prices = product.product_variants.filter((variant) => variant.status === "active").map((variant) => variant.price_pence ?? product.base_price_pence);
    const pricePence = prices.length ? Math.min(...prices) : product.base_price_pence;

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      createdAt: product.created_at,
      category: product.category ? { name: product.category.name, slug: product.category.slug } : null,
      personalised: product.personalisation_required,
      image: image ? { url: image.url, alt: image.alt ?? product.title } : null,
      pricePence,
      hasPriceRange: prices.some((value) => value !== pricePence),
    };
  });

  return <ShopBrowser products={products} whatsappNumber={siteConfig.whatsappNumber} />;
}
