import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared by anything that learns a customer's identity from outside the
 * site's own checkout flow (currently: creating a timelapse). Finds the
 * existing `customers` row for this email, or creates one — so the same
 * email never produces two customer rows regardless of which channel
 * (website order vs. Etsy order) it came in through. Backfills the name
 * only if it was missing, so it never overwrites a name already on file.
 *
 * The Stripe webhook has its own upsert-by-email call already
 * (api/webhooks/stripe/route.ts) which always sets the name from the
 * checkout session — left as-is rather than routed through this helper, to
 * avoid changing existing, live payment-path behaviour.
 */
export async function findOrCreateCustomer(supabase: SupabaseClient, email: string, name?: string | null): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase.from("customers").select("id, name").eq("email", normalizedEmail).maybeSingle();
  if (existing) {
    if (name && !existing.name) await supabase.from("customers").update({ name }).eq("id", existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase.from("customers").insert({ email: normalizedEmail, name: name || null }).select("id").single();
  if (error || !created) throw error ?? new Error("Couldn't create customer.");
  return created.id;
}

/** Adds a tag to a customer if they don't already have it. No-op otherwise — tags are a plain text[] column, not a separate table. */
export async function addCustomerTag(supabase: SupabaseClient, customerId: string, tag: string): Promise<void> {
  const { data: customer } = await supabase.from("customers").select("tags").eq("id", customerId).maybeSingle();
  const tags: string[] = customer?.tags ?? [];
  if (tags.includes(tag)) return;
  await supabase.from("customers").update({ tags: [...tags, tag] }).eq("id", customerId);
}

/** Removes a tag from a customer, if present. */
export async function removeCustomerTag(supabase: SupabaseClient, customerId: string, tag: string): Promise<void> {
  const { data: customer } = await supabase.from("customers").select("tags").eq("id", customerId).maybeSingle();
  const tags: string[] = customer?.tags ?? [];
  await supabase.from("customers").update({ tags: tags.filter((existing) => existing !== tag) }).eq("id", customerId);
}
