import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { updateProduct } from "../actions";
import { ProductForm, type ProductFormValues } from "../product-form";
import { ProductImagesManager } from "./product-images-manager";
import { VariantsManager } from "./variants-manager";

type OptionRow = { id: string; name: string; sort_order: number; product_option_values: { id: string; value: string; sort_order: number }[] };
type VariantRow = {
  id: string;
  sku: string;
  price_pence: number | null;
  weight_grams: number;
  stock_quantity: number;
  production_time_minutes: number | null;
  status: string;
  product_variant_option_values: { option_value_id: string }[];
};

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();

  const [{ data: product }, { data: variants }, { data: images }, { data: categories }, { data: options }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("product_variants")
      .select("id, sku, price_pence, weight_grams, stock_quantity, production_time_minutes, status, product_variant_option_values(option_value_id)")
      .eq("product_id", id)
      .order("sku")
      .returns<VariantRow[]>(),
    supabase.from("product_images").select("id, url, alt").eq("product_id", id).order("sort_order").order("id"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("product_options").select("id, name, sort_order, product_option_values(id, value, sort_order)").eq("product_id", id).order("sort_order").returns<OptionRow[]>(),
  ]);

  if (!product) notFound();

  const hasOptions = (options?.length ?? 0) > 0;
  const defaultVariant = !hasOptions ? variants?.[0] : undefined;

  const initialValues: ProductFormValues = {
    productId: product.id,
    variantId: defaultVariant?.id,
    title: product.title,
    description: product.description ?? "",
    fulfilmentType: product.fulfilment_type,
    status: product.status,
    basePricePounds: product.base_price_pence / 100,
    vatRatePercent: product.vat_rate * 100,
    sku: defaultVariant?.sku ?? "",
    weightGrams: defaultVariant?.weight_grams ?? 100,
    stockQuantity: defaultVariant?.stock_quantity ?? 0,
    productionTimeMinutes: defaultVariant?.production_time_minutes ?? null,
    categoryId: product.category_id,
    urlHandle: product.slug,
    seoTitle: product.seo_title ?? "",
    seoDescription: product.seo_description ?? "",
  };

  const managerOptions = (options ?? []).map((option) => ({
    id: option.id,
    name: option.name,
    values: [...option.product_option_values].sort((a, b) => a.sort_order - b.sort_order).map((value) => ({ id: value.id, value: value.value })),
  }));
  const managerVariants = (variants ?? []).map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    pricePence: variant.price_pence,
    weightGrams: variant.weight_grams,
    stockQuantity: variant.stock_quantity,
    productionTimeMinutes: variant.production_time_minutes,
    status: variant.status as "active" | "archived",
    valueIds: variant.product_variant_option_values.map((v) => v.option_value_id),
  }));

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold">{product.title}</h1>

      {!hasOptions && !defaultVariant && (
        <p className="max-w-2xl text-sm text-red-600">This product has no variant yet — it can&apos;t be added to a cart until one exists. Re-save this form to create a default variant.</p>
      )}

      <ProductForm
        action={updateProduct}
        initialValues={initialValues}
        submitLabel="Save changes"
        categories={categories ?? []}
        imagesField={<ProductImagesManager productId={product.id} productTitle={product.title} initialImages={images ?? []} />}
        hasOptions={hasOptions}
        variantsField={<VariantsManager key={managerVariants.map((v) => v.id).join(",")} productId={product.id} options={managerOptions} variants={managerVariants} />}
      />
    </div>
  );
}
