import type { SupabaseClient } from "@supabase/supabase-js";
import { findOrCreateCustomer } from "@/lib/customer-identity";
import type { Channel } from "@/lib/pricing/engine";

/** Matches an existing customer by email, then by Etsy username; otherwise creates one (email optional). */
export async function findCustomer(
  supabase: SupabaseClient,
  { email, customerName, etsyUsername, channel }: { email: string; customerName: string; etsyUsername: string; channel: Channel },
): Promise<string> {
  if (!email && etsyUsername) {
    const { data: existing } = await supabase.from("customers").select("id, name").ilike("etsy_username", etsyUsername).limit(1).maybeSingle();
    if (existing) {
      if (customerName && !existing.name) await supabase.from("customers").update({ name: customerName }).eq("id", existing.id);
      return existing.id;
    }
  }
  const customerId = await findOrCreateCustomer(supabase, email || null, customerName || etsyUsername || null);
  const { data: customer } = await supabase.from("customers").select("etsy_username, source").eq("id", customerId).maybeSingle();
  const update: Record<string, string> = {};
  if (etsyUsername && !customer?.etsy_username) update.etsy_username = etsyUsername;
  if (!customer?.source) update.source = channel;
  if (Object.keys(update).length) await supabase.from("customers").update(update).eq("id", customerId);
  return customerId;
}
