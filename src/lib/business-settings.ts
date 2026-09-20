import type { SupabaseClient } from "@supabase/supabase-js";
import { siteConfig } from "@/app/site-config";

export type BusinessSettings = {
  companyName: string;
  companyAddress: string | null;
  vatNumber: string | null;
};

/**
 * Reads the single `business_settings` row (Section 4/6e), used to put real
 * legal details on order confirmation emails. There's no Settings admin
 * screen yet, so this is SQL-only until one exists — falls back to the site
 * name (and omits address/VAT number) if the row hasn't been seeded.
 */
export async function getBusinessSettings(supabase: SupabaseClient): Promise<BusinessSettings> {
  const { data } = await supabase.from("business_settings").select("company_name, company_address, vat_number").limit(1).maybeSingle();

  return {
    companyName: data?.company_name || siteConfig.name,
    companyAddress: data?.company_address ?? null,
    vatNumber: data?.vat_number ?? null,
  };
}
