"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { getPricingSettings } from "@/lib/pricing/store";
import { PRICING_SETTING_GROUPS, type PricingSettings } from "@/lib/pricing/settings";

export type PricingFormState = { error?: string; success?: boolean };

export async function updatePricingSettings(_prev: PricingFormState, formData: FormData): Promise<PricingFormState> {
  const session = await requireAdmin();
  const supabase = await createServerAuthClient();
  const { settings: before, stored } = await getPricingSettings(supabase);
  if (!stored) return { error: "Migration 0007 isn't applied yet, so settings can't be saved." };

  const next: PricingSettings = { ...before };
  for (const group of PRICING_SETTING_GROUPS) {
    for (const field of group.fields) {
      const raw = String(formData.get(field.key) ?? "").trim();
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || value < 0) return { error: `${field.label}: enter a number of 0 or more.` };
      next[field.key] = field.percent ? value / 100 : value;
    }
  }
  if (next.plywoodWaste >= 1) return { error: "Sheet wastage must be under 100%." };
  if (next.printerLifetimeHours <= 0 || next.laserLifetimeHours <= 0) return { error: "Machine lifetimes must be more than 0 hours." };
  if (next.roundTo <= 0) return { error: "Round up to must be more than £0." };
  if (1 / (1 + next.vatRate) - Math.max(next.etsyPercentFee, next.websitePercentFee) <= 0) return { error: "Fees and VAT add up to more than the price." };

  const { error } = await supabase.from("pricing_settings").update({ settings: next, updated_at: new Date().toISOString(), updated_by: session.userId }).eq("id", 1);
  if (error) return { error: error.message };

  await supabase.from("admin_audit_log").insert({
    admin_user_id: session.userId,
    action: "pricing_settings.updated",
    entity_type: "pricing_settings",
    before,
    after: next,
  });

  revalidatePath("/admin/pricing");
  revalidatePath("/admin/crm/new");
  return { success: true };
}
