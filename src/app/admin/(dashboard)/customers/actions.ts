"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { addCustomerTag, removeCustomerTag } from "@/lib/customer-identity";

export async function addTagAction(formData: FormData) {
  await requireAdmin();
  const customerId = String(formData.get("customerId") || "");
  const tag = String(formData.get("tag") || "").trim();
  if (!customerId || !tag) return;

  const supabase = await createServerAuthClient();
  await addCustomerTag(supabase, customerId, tag);

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
}

export async function removeTagAction(formData: FormData) {
  await requireAdmin();
  const customerId = String(formData.get("customerId") || "");
  const tag = String(formData.get("tag") || "");
  if (!customerId || !tag) return;

  const supabase = await createServerAuthClient();
  await removeCustomerTag(supabase, customerId, tag);

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
}
