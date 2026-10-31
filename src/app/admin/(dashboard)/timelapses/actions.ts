"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { findOrCreateCustomer, addCustomerTag } from "@/lib/customer-identity";
import { uploadTimelapseVideo, deleteTimelapseVideo, timelapseVideoPathFromUrl, TimelapseVideoError } from "@/lib/supabase/timelapse-storage";
import { siteConfig } from "@/app/site-config";

export type TimelapseFormState = { error?: string; success?: boolean };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function readCoreFields(formData: FormData) {
  const customerName = String(formData.get("customerName") || "").trim();
  const customerEmail = String(formData.get("customerEmail") || "").trim();
  const etsyOrderId = String(formData.get("etsyOrderId") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();

  if (!customerName || !customerEmail || !etsyOrderId) return { error: "Name, email and Etsy order ID are required." };
  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) return { error: "Please enter a valid email address." };

  const slug = slugify(slugInput || customerName);
  if (!slug) return { error: "Couldn't derive a link — check the name or link field." };

  return { customerName, customerEmail, etsyOrderId, slug };
}

export async function createTimelapse(_prevState: TimelapseFormState, formData: FormData): Promise<TimelapseFormState> {
  await requireAdmin();
  const fields = readCoreFields(formData);
  if ("error" in fields) return fields;

  const video = formData.get("video");
  if (!(video instanceof File) || video.size === 0) return { error: "Choose a video file." };

  const supabase = await createServerAuthClient();

  let uploaded: { path: string; url: string };
  try {
    uploaded = await uploadTimelapseVideo(supabase, video);
  } catch (error) {
    return { error: error instanceof TimelapseVideoError ? error.message : "Couldn't upload the video." };
  }

  let customerId: string;
  try {
    customerId = await findOrCreateCustomer(supabase, fields.customerEmail, fields.customerName);
  } catch {
    await deleteTimelapseVideo(supabase, uploaded.path).catch(() => {});
    return { error: "Couldn't save the customer record." };
  }
  await addCustomerTag(supabase, customerId, "Etsy — timelapse");

  const { data: timelapse, error } = await supabase
    .from("order_timelapses")
    .insert({ slug: fields.slug, customer_id: customerId, etsy_order_id: fields.etsyOrderId, video_url: uploaded.url })
    .select("id")
    .single();

  if (error || !timelapse) {
    await deleteTimelapseVideo(supabase, uploaded.path).catch(() => {});
    return { error: error?.code === "23505" ? "That link is already taken — choose another." : error?.message || "Couldn't save the timelapse." };
  }

  revalidatePath("/admin/timelapses");
  redirect(`/admin/timelapses/${timelapse.id}`);
}

export async function updateTimelapse(_prevState: TimelapseFormState, formData: FormData): Promise<TimelapseFormState> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing timelapse reference." };

  const fields = readCoreFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createServerAuthClient();
  const { data: existing } = await supabase.from("order_timelapses").select("video_url").eq("id", id).maybeSingle();
  if (!existing) return { error: "Timelapse not found." };

  let videoUrl = existing.video_url;
  let uploadedPath: string | null = null;
  const video = formData.get("video");
  if (video instanceof File && video.size > 0) {
    try {
      const uploaded = await uploadTimelapseVideo(supabase, video);
      videoUrl = uploaded.url;
      uploadedPath = uploaded.path;
    } catch (error) {
      return { error: error instanceof TimelapseVideoError ? error.message : "Couldn't upload the video." };
    }
  }

  let customerId: string;
  try {
    customerId = await findOrCreateCustomer(supabase, fields.customerEmail, fields.customerName);
  } catch {
    if (uploadedPath) await deleteTimelapseVideo(supabase, uploadedPath).catch(() => {});
    return { error: "Couldn't save the customer record." };
  }
  await addCustomerTag(supabase, customerId, "Etsy — timelapse");

  const { error } = await supabase
    .from("order_timelapses")
    .update({ slug: fields.slug, customer_id: customerId, etsy_order_id: fields.etsyOrderId, video_url: videoUrl })
    .eq("id", id);

  if (error) {
    if (uploadedPath) await deleteTimelapseVideo(supabase, uploadedPath).catch(() => {});
    return { error: error.code === "23505" ? "That link is already taken — choose another." : error.message };
  }

  // Only delete the replaced video once the row points at the new one.
  if (uploadedPath) {
    const oldPath = timelapseVideoPathFromUrl(existing.video_url);
    if (oldPath) await deleteTimelapseVideo(supabase, oldPath).catch(() => {});
  }

  revalidatePath("/admin/timelapses");
  revalidatePath(`/admin/timelapses/${id}`);
  return { success: true };
}

async function performDelete(supabase: SupabaseClient, id: string) {
  const { data: timelapse } = await supabase.from("order_timelapses").select("video_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("order_timelapses").delete().eq("id", id);
  if (!error && timelapse) {
    const path = timelapseVideoPathFromUrl(timelapse.video_url);
    if (path) await deleteTimelapseVideo(supabase, path).catch(() => {});
  }
  revalidatePath("/admin/timelapses");
  return error;
}

/** Used by the list page's inline delete form — no redirect on success, matches categories/gift-cards. */
export async function deleteTimelapseFromListAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createServerAuthClient();
  const error = await performDelete(supabase, id);
  if (error) redirect(`/admin/timelapses?error=${encodeURIComponent(error.message)}`);
}

/** Used imperatively from the detail page's delete button, which navigates away itself on success. */
export async function deleteTimelapseFromDetailAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createServerAuthClient();
  const error = await performDelete(supabase, id);
  return error ? { error: error.message } : {};
}

/** Called imperatively (not a <form action>) so it can return a result to show inline, same reasoning as the product variants actions. */
export async function sendTimelapseEmailAction(id: string): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();
  const supabase = await createServerAuthClient();
  const { data: timelapse } = await supabase
    .from("order_timelapses")
    .select("slug, etsy_order_id, customers(name, email)")
    .eq("id", id)
    .maybeSingle()
    .returns<{ slug: string; etsy_order_id: string; customers: { name: string | null; email: string } | null } | null>();
  if (!timelapse || !timelapse.customers) return { error: "Timelapse not found." };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "Email isn't configured — set RESEND_API_KEY." };

  const url = `${siteConfig.url}/timelapse/${timelapse.slug}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ORDERS_FROM_EMAIL || "3DCRAFTS <onboarding@resend.dev>",
      to: timelapse.customers.email,
      reply_to: siteConfig.email,
      subject: "Watch the timelapse of your order",
      text: `Hi ${timelapse.customers.name || "there"},\n\nHere's the timelapse of your order (#${timelapse.etsy_order_id}) coming together:\n${url}\n\nThanks for ordering from 3DCRAFTS!`,
    }),
  });

  if (!response.ok) return { error: "Couldn't send the email. Please try again." };
  return { success: true };
}
