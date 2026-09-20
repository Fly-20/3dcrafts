"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { poundsToPence } from "@/lib/money";

export type VariantsActionState = { error?: string; success?: boolean };

/** Adds a new option (e.g. "Colour") with its initial comma-separated values (e.g. "Red, Blue") to a product. */
export async function addProductOptionAction(_prevState: VariantsActionState, formData: FormData): Promise<VariantsActionState> {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const name = String(formData.get("name") || "").trim();
  const values = String(formData.get("values") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!productId || !name) return { error: "Option name is required." };
  if (values.length === 0) return { error: "Add at least one value (comma-separated)." };

  const supabase = await createServerAuthClient();
  const { count } = await supabase.from("product_options").select("id", { count: "exact", head: true }).eq("product_id", productId);

  const { data: option, error: optionError } = await supabase.from("product_options").insert({ product_id: productId, name, sort_order: count ?? 0 }).select("id").single();
  if (optionError || !option) return { error: optionError?.message || "Couldn't create the option." };

  const { error: valuesError } = await supabase.from("product_option_values").insert(values.map((value, index) => ({ option_id: option.id, value, sort_order: index })));
  if (valuesError) return { error: valuesError.message };

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

/** Appends a value to an existing option (e.g. adding "Green" to an existing "Colour" option). */
export async function addOptionValueAction(_prevState: VariantsActionState, formData: FormData): Promise<VariantsActionState> {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const optionId = String(formData.get("optionId") || "");
  const value = String(formData.get("value") || "").trim();
  if (!productId || !optionId || !value) return { error: "Enter a value." };

  const supabase = await createServerAuthClient();
  const { count } = await supabase.from("product_option_values").select("id", { count: "exact", head: true }).eq("option_id", optionId);

  const { error } = await supabase.from("product_option_values").insert({ option_id: optionId, value, sort_order: count ?? 0 });
  if (error) return { error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

/** Removes a value — blocked (not silently ignored) if any variant still uses it, since deleting it out from under a variant would leave that variant's option combination incomplete. */
export async function removeOptionValueAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const valueId = String(formData.get("valueId") || "");
  if (!productId || !valueId) return;

  const supabase = await createServerAuthClient();
  const { count } = await supabase.from("product_variant_option_values").select("variant_id", { count: "exact", head: true }).eq("option_value_id", valueId);
  if ((count ?? 0) > 0) {
    revalidatePath(`/admin/products/${productId}`);
    return { error: "That value is used by a variant — archive the variant first." };
  }

  await supabase.from("product_option_values").delete().eq("id", valueId);
  revalidatePath(`/admin/products/${productId}`);
}

/** Removes an option and all its values — same in-use guard as removeOptionValueAction, checked across every value first. */
export async function removeOptionAction(formData: FormData): Promise<VariantsActionState | undefined> {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const optionId = String(formData.get("optionId") || "");
  if (!productId || !optionId) return;

  const supabase = await createServerAuthClient();
  const { data: values } = await supabase.from("product_option_values").select("id").eq("option_id", optionId);
  const valueIds = (values ?? []).map((value) => value.id);

  if (valueIds.length > 0) {
    const { count } = await supabase.from("product_variant_option_values").select("variant_id", { count: "exact", head: true }).in("option_value_id", valueIds);
    if ((count ?? 0) > 0) {
      revalidatePath(`/admin/products/${productId}`);
      return { error: "That option still has values in use by a variant — remove those values first." };
    }
  }

  await supabase.from("product_option_values").delete().eq("option_id", optionId);
  await supabase.from("product_options").delete().eq("id", optionId);
  revalidatePath(`/admin/products/${productId}`);
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>((acc, array) => acc.flatMap((combo) => array.map((value) => [...combo, value])), [[]]);
}

/**
 * Computes every combination of the product's current option values and
 * creates a variant for any combination that doesn't already have one.
 * Existing variants (and any manual edits to their SKU/price/stock) are
 * left untouched — this only ever adds, never overwrites or removes.
 */
export async function generateVariantsAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  if (!productId) return { error: "Missing product reference." };

  const supabase = await createServerAuthClient();

  const [{ data: product }, { data: options }, { data: existingVariants }] = await Promise.all([
    supabase.from("products").select("slug").eq("id", productId).single(),
    supabase.from("product_options").select("id, product_option_values(id)").eq("product_id", productId).order("sort_order"),
    supabase.from("product_variants").select("id, product_variant_option_values(option_value_id)").eq("product_id", productId),
  ]);

  if (!options || options.length === 0) return { error: "Add at least one option first." };
  if (options.some((option) => option.product_option_values.length === 0)) return { error: "Every option needs at least one value." };

  const combinations = cartesianProduct(options.map((option) => option.product_option_values.map((value) => value.id)));

  const existingKeys = new Set(
    (existingVariants ?? []).map((variant) => [...variant.product_variant_option_values.map((v) => v.option_value_id)].sort().join(",")),
  );

  const missingCombinations = combinations.filter((combo) => !existingKeys.has([...combo].sort().join(",")));
  if (missingCombinations.length === 0) {
    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  }

  const skuBase = (product?.slug ?? "product").toUpperCase().slice(0, 12);
  let created = 0;
  let lastError: string | null = null;

  for (let i = 0; i < missingCombinations.length; i++) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        sku: `${skuBase}-${existingKeys.size + i + 1}`,
        weight_grams: 100,
        stock_quantity: 0,
        status: "active",
      })
      .select("id")
      .single();

    if (variantError || !variant) {
      lastError = variantError?.message ?? "Insert failed.";
      continue;
    }

    const { error: joinError } = await supabase
      .from("product_variant_option_values")
      .insert(missingCombinations[i].map((optionValueId) => ({ variant_id: variant.id, option_value_id: optionValueId })));
    if (joinError) lastError = joinError.message;
    else created++;
  }

  revalidatePath(`/admin/products/${productId}`);
  if (created === 0) return { error: lastError || "Couldn't generate variants." };
  return { success: true };
}

export type VariantEdit = {
  id: string;
  sku: string;
  pricePounds: number | null;
  weightGrams: number;
  stockQuantity: number;
  productionTimeMinutes: number | null;
  status: "active" | "archived";
};

/** Bulk-saves the variants table — called imperatively from VariantsManager, not bound to a <form>. */
export async function updateVariantsAction(productId: string, variants: VariantEdit[]): Promise<VariantsActionState> {
  await requireAdmin();
  if (!productId || variants.length === 0) return { error: "Nothing to save." };

  for (const variant of variants) {
    if (!variant.sku.trim() || !variant.weightGrams || variant.weightGrams < 1) {
      return { error: `SKU and a weight of at least 1g are required for every variant (check "${variant.sku || "(blank)"}").` };
    }
  }

  const supabase = await createServerAuthClient();
  const results = await Promise.all(
    variants.map((variant) =>
      supabase
        .from("product_variants")
        .update({
          sku: variant.sku.trim(),
          price_pence: variant.pricePounds !== null ? poundsToPence(variant.pricePounds) : null,
          weight_grams: variant.weightGrams,
          stock_quantity: variant.stockQuantity,
          production_time_minutes: variant.productionTimeMinutes,
          status: variant.status,
        })
        .eq("id", variant.id),
    ),
  );

  const failed = results.find((result) => result.error);
  revalidatePath(`/admin/products/${productId}`);
  if (failed?.error) return { error: failed.error.message };
  return { success: true };
}
