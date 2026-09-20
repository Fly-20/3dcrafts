"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { poundsToPence } from "@/lib/money";

export type ShippingRateFormState = { error?: string; success?: boolean };

function readShippingRateFields(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const minWeightGrams = Number(formData.get("minWeightGrams") || 0);
  const maxWeightRaw = String(formData.get("maxWeightGrams") || "").trim();
  const pricePounds = Number(formData.get("pricePounds") || 0);
  const freeShippingThresholdRaw = String(formData.get("freeShippingThresholdPounds") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(minWeightGrams) || minWeightGrams < 0) return { error: "Minimum weight must be 0 or more." };
  if (!Number.isFinite(pricePounds) || pricePounds < 0) return { error: "Price can't be negative." };

  const maxWeightGrams = maxWeightRaw ? Number(maxWeightRaw) : null;
  if (maxWeightGrams !== null && (!Number.isFinite(maxWeightGrams) || maxWeightGrams <= minWeightGrams)) {
    return { error: "Maximum weight must be greater than the minimum weight (or left blank for no upper bound)." };
  }

  return {
    name,
    minWeightGrams,
    maxWeightGrams,
    pricePence: poundsToPence(pricePounds),
    freeShippingThresholdPence: freeShippingThresholdRaw ? poundsToPence(Number(freeShippingThresholdRaw)) : null,
    active: formData.get("active") === "on",
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export async function createShippingRate(_prevState: ShippingRateFormState, formData: FormData): Promise<ShippingRateFormState> {
  await requireAdmin();
  const fields = readShippingRateFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createServerAuthClient();
  const { error } = await supabase.from("shipping_rates").insert({
    name: fields.name,
    min_weight_grams: fields.minWeightGrams,
    max_weight_grams: fields.maxWeightGrams,
    price_pence: fields.pricePence,
    free_shipping_threshold_pence: fields.freeShippingThresholdPence,
    active: fields.active,
    sort_order: fields.sortOrder,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/shipping-rates");
  redirect("/admin/shipping-rates");
}

export async function updateShippingRate(_prevState: ShippingRateFormState, formData: FormData): Promise<ShippingRateFormState> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing shipping rate reference." };

  const fields = readShippingRateFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createServerAuthClient();
  const { error } = await supabase
    .from("shipping_rates")
    .update({
      name: fields.name,
      min_weight_grams: fields.minWeightGrams,
      max_weight_grams: fields.maxWeightGrams,
      price_pence: fields.pricePence,
      free_shipping_threshold_pence: fields.freeShippingThresholdPence,
      active: fields.active,
      sort_order: fields.sortOrder,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/shipping-rates");
  revalidatePath(`/admin/shipping-rates/${id}`);
  return { success: true };
}

export async function deleteShippingRateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createServerAuthClient();
  await supabase.from("shipping_rates").delete().eq("id", id);
  revalidatePath("/admin/shipping-rates");
}
