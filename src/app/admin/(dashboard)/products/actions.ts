"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { poundsToPence } from "@/lib/money";
import { createSignedProductImageUploadUrl, deleteProductImage, getProductImagePublicUrl, PRODUCT_IMAGES_BUCKET, ProductImageError } from "@/lib/supabase/storage";

export type ProductFormState = { error?: string; success?: boolean };

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type ProductCoreFields = {
  personalisationRequired: boolean;
  title: string;
  description: string;
  fulfilmentType: string;
  status: string;
  basePricePence: number;
  vatRate: number;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  slug: string;
};

/** Product-level fields only — never touches product_variants. Shared by create and update. */
function readProductCoreFields(formData: FormData): ProductCoreFields | { error: string } {
  const title = String(formData.get("title") || "").trim();
  const fulfilmentType = String(formData.get("fulfilmentType") || "");
  if (!title || !fulfilmentType) return { error: "Title and fulfilment type are required." };

  const urlHandle = String(formData.get("urlHandle") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const slug = slugify(urlHandle || title);
  if (!slug) return { error: "Couldn't derive a URL handle — check the title or URL handle field." };

  return {
    personalisationRequired: formData.get("personalisationRequired") === "on",
    title,
    description: String(formData.get("description") || "").trim(),
    fulfilmentType,
    status: String(formData.get("status") || "draft"),
    basePricePence: poundsToPence(Number(formData.get("basePrice") || 0)),
    vatRate: Number(formData.get("vatRatePercent") || 20) / 100,
    categoryId: categoryId || null,
    seoTitle: String(formData.get("seoTitle") || "").trim() || null,
    seoDescription: String(formData.get("seoDescription") || "").trim() || null,
    slug,
  };
}

type DefaultVariantFields = {
  sku: string;
  weightGrams: number;
  stockQuantity: number;
  productionTimeMinutes: number | null;
};

/**
 * The single default variant's fields — only relevant for products with no
 * options yet (Section 7 Stage 2: multi-variant/option UI). Once a product
 * has options, its variants are edited via VariantsManager instead, and the
 * main product form no longer submits these fields at all (see `hasOptions`
 * in product-form.tsx).
 */
function readDefaultVariantFields(formData: FormData): DefaultVariantFields | { error: string } {
  const sku = String(formData.get("sku") || "").trim();
  const weightGrams = Number(formData.get("weightGrams"));
  if (!sku || !weightGrams) return { error: "SKU and weight are required." };

  return {
    sku,
    weightGrams,
    stockQuantity: Number(formData.get("stockQuantity") || 0),
    productionTimeMinutes: formData.get("productionTimeMinutes") ? Number(formData.get("productionTimeMinutes")) : null,
  };
}

export async function createProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const fields = readProductCoreFields(formData);
  if ("error" in fields) return fields;
  const variantFields = readDefaultVariantFields(formData);
  if ("error" in variantFields) return variantFields;

  const supabase = await createServerAuthClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      personalisation_required: fields.personalisationRequired,
      title: fields.title,
      slug: fields.slug,
      description: fields.description,
      fulfilment_type: fields.fulfilmentType,
      status: fields.status,
      base_price_pence: fields.basePricePence,
      vat_rate: fields.vatRate,
      category_id: fields.categoryId,
      seo_title: fields.seoTitle,
      seo_description: fields.seoDescription,
    })
    .select("id")
    .single();

  if (productError || !product) return { error: productError?.message || "Couldn't create the product." };

  const { error: variantError } = await supabase.from("product_variants").insert({
    product_id: product.id,
    sku: variantFields.sku,
    weight_grams: variantFields.weightGrams,
    stock_quantity: variantFields.stockQuantity,
    production_time_minutes: variantFields.productionTimeMinutes,
    status: "active",
  });
  if (variantError) return { error: `Product created, but the default variant failed: ${variantError.message}` };

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  if (!productId) return { error: "Missing product reference." };

  const fields = readProductCoreFields(formData);
  if ("error" in fields) return fields;

  // Once a product has options, its variants are edited via VariantsManager instead — the main form doesn't submit sku/weight/stock fields at all in that case (see product-form.tsx).
  const hasOptions = formData.get("hasOptions") === "true";
  let variantFields: DefaultVariantFields | null = null;
  if (!hasOptions) {
    const variantId = String(formData.get("variantId") || "");
    if (!variantId) return { error: "Missing product reference." };
    const parsedVariantFields = readDefaultVariantFields(formData);
    if ("error" in parsedVariantFields) return parsedVariantFields;
    variantFields = parsedVariantFields;
  }

  const supabase = await createServerAuthClient();
  const { error: productError } = await supabase
    .from("products")
    .update({
      personalisation_required: fields.personalisationRequired,
      title: fields.title,
      slug: fields.slug,
      description: fields.description,
      fulfilment_type: fields.fulfilmentType,
      status: fields.status,
      base_price_pence: fields.basePricePence,
      vat_rate: fields.vatRate,
      category_id: fields.categoryId,
      seo_title: fields.seoTitle,
      seo_description: fields.seoDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (productError) return { error: productError.message };

  if (variantFields) {
    const variantId = String(formData.get("variantId") || "");
    const { error: variantError } = await supabase
      .from("product_variants")
      .update({
        sku: variantFields.sku,
        weight_grams: variantFields.weightGrams,
        stock_quantity: variantFields.stockQuantity,
        production_time_minutes: variantFields.productionTimeMinutes,
      })
      .eq("id", variantId);
    if (variantError) return { error: variantError.message };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function prepareProductImageUpload(productId: string, file: { type: string; size: number }): Promise<{ path?: string; token?: string; error?: string }> {
  await requireAdmin();
  const supabase = await createServerAuthClient();
  const { data: product, error } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();
  if (error || !product) return { error: "Product not found." };

  try {
    const { path, token } = await createSignedProductImageUploadUrl(supabase, productId, file);
    return { path, token };
  } catch (error) {
    return { error: error instanceof ProductImageError ? error.message : "Couldn't prepare the image upload." };
  }
}

export async function completeProductImageUpload(productId: string, path: string): Promise<{ image?: { id: string; url: string; alt: string | null }; error?: string }> {
  await requireAdmin();
  if (!path.startsWith(`${productId}/`) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path.slice(productId.length + 1))) {
    return { error: "Invalid image path." };
  }

  const supabase = await createServerAuthClient();
  const { data: product } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();
  if (!product) return { error: "Product not found." };

  const { error: storageError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).info(path);
  if (storageError) return { error: "Image upload did not complete. Please try again." };

  const url = getProductImagePublicUrl(supabase, path);
  const { data: existing } = await supabase.from("product_images").select("id, url, alt").eq("product_id", productId).eq("url", url).maybeSingle();
  if (existing) return { image: existing };

  const { data: lastImage, error: orderError } = await supabase.from("product_images").select("sort_order").eq("product_id", productId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  if (orderError) return { error: "Couldn't save image order." };
  const { data: image, error } = await supabase.from("product_images").insert({
    product_id: productId,
    url,
    alt: "",
    sort_order: (lastImage?.sort_order ?? -1) + 1,
  }).select("id, url, alt").single();
  if (error || !image) return { error: "Image uploaded, but couldn't be attached to the product. Please try again." };
  revalidatePath(`/admin/products/${productId}`);
  return { image };
}

/** Persists a full drag-and-drop reorder in one go — sets sort_order to each id's position in the given order. Called directly from ProductImagesManager. */
export async function reorderProductImagesAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  if (!productId) return;

  let orderedIds: unknown;
  try {
    orderedIds = JSON.parse(String(formData.get("order") || "[]"));
  } catch {
    return;
  }
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;

  const supabase = await createServerAuthClient();
  await Promise.all(orderedIds.map((imageId, index) => supabase.from("product_images").update({ sort_order: index }).eq("id", String(imageId)).eq("product_id", productId)));

  revalidatePath(`/admin/products/${productId}`);
}

/** Swaps an image earlier/later in display order, then renumbers all of the product's images sequentially (0..n-1) — avoids getting stuck on duplicate sort_order values left over from before ordering was controllable. */
export async function moveProductImageAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const imageId = String(formData.get("imageId") || "");
  const direction = String(formData.get("direction") || "");
  if (!productId || !imageId || (direction !== "up" && direction !== "down")) return;

  const supabase = await createServerAuthClient();
  const { data: images } = await supabase.from("product_images").select("id, sort_order").eq("product_id", productId).order("sort_order").order("id");
  if (!images) return;

  const index = images.findIndex((image) => image.id === imageId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= images.length) return;

  const reordered = [...images];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  await Promise.all(reordered.map((image, i) => supabase.from("product_images").update({ sort_order: i }).eq("id", image.id)));

  revalidatePath(`/admin/products/${productId}`);
}

const productImagesUrlMarker = "/product-images/";

export async function deleteProductImageAction(formData: FormData) {
  await requireAdmin();
  const imageId = String(formData.get("imageId") || "");
  const productId = String(formData.get("productId") || "");
  const url = String(formData.get("url") || "");
  if (!imageId || !productId) return;

  const supabase = await createServerAuthClient();
  const markerIndex = url.indexOf(productImagesUrlMarker);
  if (markerIndex !== -1) {
    await deleteProductImage(supabase, url.slice(markerIndex + productImagesUrlMarker.length)).catch((error) => console.error("Failed to delete storage object:", error));
  }
  await supabase.from("product_images").delete().eq("id", imageId);

  revalidatePath(`/admin/products/${productId}`);
}
