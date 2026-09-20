"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { poundsToPence } from "@/lib/money";
import { uploadProductImage, deleteProductImage, ProductImageError } from "@/lib/supabase/storage";

export type ProductFormState = { error?: string; success?: boolean };

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type ProductCoreFields = {
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

  const imageFiles = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  for (let i = 0; i < imageFiles.length; i++) {
    try {
      const { url } = await uploadProductImage(supabase, product.id, imageFiles[i]);
      await supabase.from("product_images").insert({ product_id: product.id, url, alt: "", sort_order: i });
    } catch (error) {
      // Product itself is created either way — a failed image can be retried from the edit page's upload form.
      console.error("Failed to upload product image during creation:", error);
    }
  }

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

export type MultiImageUploadState = { error?: string; images?: { id: string; url: string; alt: string | null }[] };

/** Uploads one or more images (drag-drop or multi-select on the edit page), appending them after whatever's already there. Called directly from ProductImagesManager, not bound to a <form>. */
export async function uploadProductImagesAction(formData: FormData): Promise<MultiImageUploadState> {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!productId || files.length === 0) return { error: "Choose at least one image to upload." };

  const supabase = await createServerAuthClient();
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);

  let nextSortOrder = count ?? 0;
  const uploaded: { id: string; url: string; alt: string | null }[] = [];
  let lastError: string | null = null;

  for (const file of files) {
    try {
      const { url } = await uploadProductImage(supabase, productId, file);
      const { data, error } = await supabase.from("product_images").insert({ product_id: productId, url, alt: "", sort_order: nextSortOrder }).select("id, url, alt").single();
      if (error || !data) {
        lastError = error?.message ?? "Insert failed.";
        continue;
      }
      uploaded.push(data);
      nextSortOrder++;
    } catch (error) {
      lastError = error instanceof ProductImageError ? error.message : "Upload failed.";
    }
  }

  revalidatePath(`/admin/products/${productId}`);
  if (uploaded.length === 0) return { error: lastError || "Upload failed." };
  return { images: uploaded };
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
