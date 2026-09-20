import type { SupabaseClient } from "@supabase/supabase-js";

type ShippingRate = {
  id: string;
  name: string;
  min_weight_grams: number;
  max_weight_grams: number | null;
  price_pence: number;
  free_shipping_threshold_pence: number | null;
};

/**
 * Picks the matching weight band for a cart's total weight and returns its
 * shipping cost, applying the band's free-shipping threshold if the cart
 * subtotal qualifies. Returns null if no active band covers the given weight
 * (caller should treat this as "shipping cannot be calculated").
 */
export async function calculateShippingPence(
  supabase: SupabaseClient,
  totalWeightGrams: number,
  subtotalPence: number,
): Promise<{ rate: ShippingRate; pence: number } | null> {
  const { data: rates, error } = await supabase
    .from("shipping_rates")
    .select("id, name, min_weight_grams, max_weight_grams, price_pence, free_shipping_threshold_pence")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const rate = (rates ?? []).find(
    (candidate) =>
      totalWeightGrams >= candidate.min_weight_grams &&
      (candidate.max_weight_grams === null || totalWeightGrams <= candidate.max_weight_grams),
  );
  if (!rate) return null;

  const qualifiesForFreeShipping =
    rate.free_shipping_threshold_pence !== null && subtotalPence >= rate.free_shipping_threshold_pence;

  return { rate, pence: qualifiesForFreeShipping ? 0 : rate.price_pence };
}
