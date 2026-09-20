import { notFound } from "next/navigation";
import Image from "next/image";
import { createPublicServerClient } from "@/lib/supabase/public";
import { formatPence } from "@/lib/money";
import { AddToCartButton } from "./add-to-cart-button";
import { VariantPicker } from "./variant-picker";

type ProductDetail = {
  id: string;
  title: string;
  description: string | null;
  base_price_pence: number;
  fulfilment_type: string;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  product_options: { id: string; name: string; sort_order: number; product_option_values: { id: string; value: string; sort_order: number }[] }[];
  product_variants: { id: string; status: string; price_pence: number | null; stock_quantity: number; product_variant_option_values: { option_value_id: string }[] }[];
};

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const supabase = createPublicServerClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      `id, title, description, base_price_pence, fulfilment_type,
       product_images(url, alt, sort_order),
       product_options(id, name, sort_order, product_option_values(id, value, sort_order)),
       product_variants(id, status, price_pence, stock_quantity, product_variant_option_values(option_value_id))`,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()
    .returns<ProductDetail | null>();

  if (!product) notFound();

  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const options = [...product.product_options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((option) => ({
      id: option.id,
      name: option.name,
      values: [...option.product_option_values].sort((a, b) => a.sort_order - b.sort_order).map((value) => ({ id: value.id, value: value.value })),
    }));

  const hasOptions = options.length > 0;
  const singleVariant = !hasOptions ? product.product_variants.find((candidate) => candidate.status === "active") : undefined;
  const singleVariantUnitPricePence = singleVariant?.price_pence ?? product.base_price_pence;
  const singleVariantMaxQuantity = singleVariant ? (product.fulfilment_type === "stock" ? singleVariant.stock_quantity : null) : 0;

  return (
    <>
      <main className="grid w-full grid-cols-1 gap-10 px-[6.5vw] py-10 sm:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden bg-black/5">
          {images[0] ? (
            <Image src={images[0].url} alt={images[0].alt ?? product.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-black/40">No image</div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">{product.title}</h1>

          {hasOptions ? (
            <VariantPicker
              options={options}
              variants={product.product_variants.map((variant) => ({
                id: variant.id,
                status: variant.status,
                pricePence: variant.price_pence,
                stockQuantity: variant.stock_quantity,
                valueIds: variant.product_variant_option_values.map((v) => v.option_value_id),
              }))}
              slug={slug}
              title={product.title}
              imageUrl={images[0]?.url ?? null}
              basePricePence={product.base_price_pence}
              fulfilmentType={product.fulfilment_type}
            />
          ) : (
            <>
              <p className="text-lg">{formatPence(singleVariantUnitPricePence)}</p>
              {singleVariant ? (
                <AddToCartButton
                  line={{ variantId: singleVariant.id, slug, title: product.title, imageUrl: images[0]?.url ?? null, unitPricePence: singleVariantUnitPricePence }}
                  maxQuantity={singleVariantMaxQuantity}
                />
              ) : (
                <p className="text-sm text-black/60">This product isn&apos;t available right now.</p>
              )}
            </>
          )}

          {product.description && <div className="rich-text text-sm text-black/70" dangerouslySetInnerHTML={{ __html: product.description }} />}
        </div>
      </main>
    </>
  );
}
