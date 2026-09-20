import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createPublicServerClient } from "@/lib/supabase/public";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = {
  title: "Shop | 3DCRAFTS",
  description: "Browse ready-to-buy 3D printed and laser cut pieces from our Edinburgh workshop.",
};

type ProductCard = {
  id: string;
  slug: string;
  title: string;
  base_price_pence: number;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  product_variants: { id: string; status: string; stock_quantity: number }[];
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const { q, category: categorySlug, sort } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const selectedCategorySlug = typeof categorySlug === "string" ? categorySlug : "";
  const selectedSort = typeof sort === "string" && sortOptions.some((option) => option.value === sort) ? sort : "newest";

  const supabase = createPublicServerClient();

  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");
  const selectedCategory = categories?.find((category) => category.slug === selectedCategorySlug);

  let request = supabase.from("products").select("id, slug, title, base_price_pence, product_images(url, alt, sort_order), product_variants(id, status, stock_quantity)").eq("status", "active");

  if (query) request = request.textSearch("search_vector", query, { type: "websearch", config: "english" });
  if (selectedCategory) request = request.eq("category_id", selectedCategory.id);

  if (selectedSort === "price_asc") request = request.order("base_price_pence", { ascending: true });
  else if (selectedSort === "price_desc") request = request.order("base_price_pence", { ascending: false });
  else request = request.order("created_at", { ascending: false });

  const { data: products, error } = await request.returns<ProductCard[]>();

  return (
    <>
      <main className="w-full px-[6.5vw] py-10">
        <div className="flex flex-col gap-2 pb-8">
          <h1 className="text-2xl font-semibold">Shop</h1>
          <p className="text-sm text-black/60">Ready-to-buy pieces from our Edinburgh workshop.</p>
        </div>

        <form action="/shop" className="mb-8 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            Search
            <input type="search" name="q" defaultValue={query} placeholder="Search products…" className="w-56 border border-black/20 px-3 py-2 text-sm outline-none focus:border-black" />
          </label>

          {(categories?.length ?? 0) > 0 && (
            <label className="flex flex-col gap-1 text-xs">
              Category
              <select name="category" defaultValue={selectedCategorySlug} className="border border-black/20 px-3 py-2 text-sm">
                <option value="">All categories</option>
                {categories!.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-xs">
            Sort by
            <select name="sort" defaultValue={selectedSort} className="border border-black/20 px-3 py-2 text-sm">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="border border-black bg-black px-4 py-2 text-sm font-medium text-white">
            Apply
          </button>
        </form>

        {error && <p className="text-sm text-red-600">Couldn&apos;t load products: {error.message}</p>}

        {!error && (products?.length ?? 0) === 0 && (
          <p className="text-sm text-black/60">{query || selectedCategory ? "No products match these filters." : "No products are available yet — check back soon."}</p>
        )}

        {!error && (products?.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {products!.map((product) => {
              const image = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
              const variant = product.product_variants.find((candidate) => candidate.status === "active");
              const soldOut = !variant;
              return (
                <Link key={product.id} href={`/shop/${product.slug}`} className="group flex flex-col gap-3">
                  <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                    {image ? (
                      <Image src={image.url} alt={image.alt ?? product.title} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-black/40">No image</div>
                    )}
                    {soldOut && <span className="absolute top-2 left-2 bg-black px-2 py-1 text-xs text-white">Sold out</span>}
                  </div>
                  <div>
                    <h2 className="text-sm font-medium">{product.title}</h2>
                    <p className="text-sm text-black/60">{formatPence(product.base_price_pence)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
