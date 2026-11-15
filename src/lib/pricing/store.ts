import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PRICING_SETTINGS, mergePricingSettings, type PricingSettings } from "./settings";

/**
 * Reads the single `pricing_settings` row. Falls back to the built-in
 * defaults (the brief's figures) if migration 0007 hasn't been applied yet,
 * so the quote calculator still works; `stored` says which one you got.
 */
export async function getPricingSettings(supabase: SupabaseClient): Promise<{ settings: PricingSettings; stored: boolean }> {
  const { data, error } = await supabase.from("pricing_settings").select("settings").eq("id", 1).maybeSingle();
  if (error || !data) return { settings: { ...DEFAULT_PRICING_SETTINGS }, stored: false };
  return { settings: mergePricingSettings(data.settings), stored: true };
}
