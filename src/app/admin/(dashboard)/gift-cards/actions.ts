"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { poundsToPence } from "@/lib/money";

export type GiftCardFormState = { error?: string; success?: boolean };

function readCode(formData: FormData) {
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  if (!code) return { error: "Code is required." };
  return { code };
}

export async function createGiftCard(_prevState: GiftCardFormState, formData: FormData): Promise<GiftCardFormState> {
  await requireAdmin();
  const codeResult = readCode(formData);
  if ("error" in codeResult) return codeResult;

  const initialBalancePounds = Number(formData.get("initialBalancePounds") || 0);
  if (!Number.isFinite(initialBalancePounds) || initialBalancePounds <= 0) return { error: "Initial balance must be greater than zero." };

  const issuedToCustomerId = String(formData.get("issuedToCustomerId") || "").trim() || null;
  const initialBalancePence = poundsToPence(initialBalancePounds);

  const supabase = await createServerAuthClient();
  const { error } = await supabase.from("gift_cards").insert({
    code: codeResult.code,
    initial_balance_pence: initialBalancePence,
    remaining_balance_pence: initialBalancePence,
    issued_to_customer_id: issuedToCustomerId,
    active: formData.get("active") === "on",
  });
  if (error) return { error: error.code === "23505" ? "A gift card with that code already exists." : error.message };

  revalidatePath("/admin/gift-cards");
  redirect("/admin/gift-cards");
}

export async function updateGiftCard(_prevState: GiftCardFormState, formData: FormData): Promise<GiftCardFormState> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing gift card reference." };

  const codeResult = readCode(formData);
  if ("error" in codeResult) return codeResult;

  const remainingBalancePounds = Number(formData.get("remainingBalancePounds") || 0);
  if (!Number.isFinite(remainingBalancePounds) || remainingBalancePounds < 0) return { error: "Remaining balance can't be negative." };

  const issuedToCustomerId = String(formData.get("issuedToCustomerId") || "").trim() || null;

  const supabase = await createServerAuthClient();
  const { error } = await supabase
    .from("gift_cards")
    .update({
      code: codeResult.code,
      remaining_balance_pence: poundsToPence(remainingBalancePounds),
      issued_to_customer_id: issuedToCustomerId,
      active: formData.get("active") === "on",
    })
    .eq("id", id);
  if (error) return { error: error.code === "23505" ? "A gift card with that code already exists." : error.message };

  revalidatePath("/admin/gift-cards");
  revalidatePath(`/admin/gift-cards/${id}`);
  return { success: true };
}

export async function deleteGiftCardAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createServerAuthClient();
  const { error } = await supabase.from("gift_cards").delete().eq("id", id);
  revalidatePath("/admin/gift-cards");

  if (error) {
    const message = error.code === "23503" ? "Can't delete — this gift card has been used on at least one order." : error.message;
    redirect(`/admin/gift-cards?error=${encodeURIComponent(message)}`);
  }
}
