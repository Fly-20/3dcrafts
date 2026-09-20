"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { poundsToPence } from "@/lib/money";

export type DiscountFormState = { error?: string; success?: boolean };

const discountTypes = ["percentage", "fixed", "free_shipping"] as const;

type DiscountFields = {
  code: string;
  type: (typeof discountTypes)[number];
  value: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  active: boolean;
};

function readDiscountFields(formData: FormData): DiscountFields | { error: string } {
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  const type = String(formData.get("type") || "");
  if (!code) return { error: "Code is required." };
  if (!discountTypes.includes(type as (typeof discountTypes)[number])) return { error: "Invalid discount type." };

  let value = 0;
  if (type === "percentage") {
    value = Number(formData.get("valuePercent") || 0);
    if (!Number.isFinite(value) || value < 0 || value > 100) return { error: "Percentage must be between 0 and 100." };
  } else if (type === "fixed") {
    value = poundsToPence(Number(formData.get("valuePounds") || 0));
    if (!Number.isFinite(value) || value < 0) return { error: "Amount off can't be negative." };
  }

  const startsAtRaw = String(formData.get("startsAt") || "");
  const endsAtRaw = String(formData.get("endsAt") || "");
  const usageLimitRaw = String(formData.get("usageLimit") || "").trim();

  return {
    code,
    type: type as (typeof discountTypes)[number],
    value,
    startsAt: startsAtRaw ? new Date(startsAtRaw).toISOString() : null,
    endsAt: endsAtRaw ? new Date(endsAtRaw).toISOString() : null,
    usageLimit: usageLimitRaw ? Number(usageLimitRaw) : null,
    active: formData.get("active") === "on",
  };
}

export async function createDiscountCode(_prevState: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
  await requireAdmin();
  const fields = readDiscountFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createServerAuthClient();
  const { error } = await supabase.from("discount_codes").insert({
    code: fields.code,
    type: fields.type,
    value: fields.value,
    starts_at: fields.startsAt,
    ends_at: fields.endsAt,
    usage_limit: fields.usageLimit,
    active: fields.active,
  });

  if (error) return { error: error.code === "23505" ? "A discount code with that code already exists." : error.message };

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function updateDiscountCode(_prevState: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing discount code reference." };

  const fields = readDiscountFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createServerAuthClient();
  const { error } = await supabase
    .from("discount_codes")
    .update({
      code: fields.code,
      type: fields.type,
      value: fields.value,
      starts_at: fields.startsAt,
      ends_at: fields.endsAt,
      usage_limit: fields.usageLimit,
      active: fields.active,
    })
    .eq("id", id);

  if (error) return { error: error.code === "23505" ? "A discount code with that code already exists." : error.message };

  revalidatePath("/admin/discounts");
  revalidatePath(`/admin/discounts/${id}`);
  return { success: true };
}
