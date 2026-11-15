"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { findOrCreateCustomer, addCustomerTag } from "@/lib/customer-identity";
import {
  createSignedTimelapseVideoUploadUrl,
  deleteTimelapseVideo,
  isTimelapseVideoPath,
  timelapseVideoPathFromUrl,
  TimelapseVideoError,
  verifyUploadedTimelapseVideo,
} from "@/lib/supabase/timelapse-storage";
import { defaultTimelapseSlug, slugify } from "@/lib/timelapse-slug";
import { siteConfig } from "@/app/site-config";

export type TimelapseFormState = { error?: string; success?: boolean };

function readCoreFields(formData: FormData) {
  const customerName = String(formData.get("customerName") || "").trim();
  const customerEmail = String(formData.get("customerEmail") || "").trim() || null;
  const etsyOrderId = String(formData.get("etsyOrderId") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();

  if (!customerName || !etsyOrderId) return { error: "Name and Etsy order ID are required." };
  if (customerEmail && !/^\S+@\S+\.\S+$/.test(customerEmail)) return { error: "Please enter a valid email address, or leave it blank." };

  // A blank link field gets the same name + random suffix default the form suggests.
  const slug = slugInput ? slugify(slugInput) : defaultTimelapseSlug(customerName);
  if (!slug) return { error: "Couldn't derive a link — check the link field." };

  return { customerName, customerEmail, etsyOrderId, slug };
}

/**
 * Step 1 of an upload: validates the file's declared type/size and returns a
 * signed URL token. The browser then uploads straight to Storage (Vercel caps
 * Server Action bodies at 4.5MB), and passes the path to create/updateTimelapse.
 */
export async function prepareTimelapseVideoUpload(file: { type: string; size: number }): Promise<{ path?: string; token?: string; error?: string }> {
  await requireAdmin();
  const supabase = await createServerAuthClient();
  try {
    return await createSignedTimelapseVideoUploadUrl(supabase, file);
  } catch (error) {
    return { error: error instanceof TimelapseVideoError ? error.message : "Couldn't prepare the video upload." };
  }
}

/** Removes a browser-uploaded video that never got saved to a row (form error, save failure). */
async function discardUpload(supabase: SupabaseClient, path: string | null) {
  if (path && isTimelapseVideoPath(path)) await deleteTimelapseVideo(supabase, path).catch(() => {});
}

function readVideoPath(formData: FormData) {
  return String(formData.get("videoPath") || "").trim() || null;
}

export async function createTimelapse(_prevState: TimelapseFormState, formData: FormData): Promise<TimelapseFormState> {
  await requireAdmin();
  const supabase = await createServerAuthClient();
  const videoPath = readVideoPath(formData);

  const fields = readCoreFields(formData);
  if ("error" in fields) {
    await discardUpload(supabase, videoPath);
    return fields;
  }
  if (!videoPath) return { error: "Choose a video file." };

  let uploaded: { path: string; url: string };
  try {
    uploaded = await verifyUploadedTimelapseVideo(supabase, videoPath);
  } catch (error) {
    await discardUpload(supabase, videoPath);
    return { error: error instanceof TimelapseVideoError ? error.message : "Couldn't upload the video." };
  }

  let customerId: string;
  try {
    customerId = await findOrCreateCustomer(supabase, fields.customerEmail, fields.customerName);
  } catch {
    await discardUpload(supabase, uploaded.path);
    return { error: "Couldn't save the customer record." };
  }
  await addCustomerTag(supabase, customerId, "Etsy — timelapse");

  const { data: timelapse, error } = await supabase
    .from("order_timelapses")
    .insert({ slug: fields.slug, customer_id: customerId, etsy_order_id: fields.etsyOrderId, video_url: uploaded.url })
    .select("id")
    .single();

  if (error || !timelapse) {
    await discardUpload(supabase, uploaded.path);
    return { error: error?.code === "23505" ? "That link is already taken — choose another." : error?.message || "Couldn't save the timelapse." };
  }

  revalidatePath("/admin/timelapses");
  redirect(`/admin/timelapses/${timelapse.id}`);
}

export async function updateTimelapse(_prevState: TimelapseFormState, formData: FormData): Promise<TimelapseFormState> {
  await requireAdmin();
  const supabase = await createServerAuthClient();
  const videoPath = readVideoPath(formData);

  const id = String(formData.get("id") || "");
  if (!id) {
    await discardUpload(supabase, videoPath);
    return { error: "Missing timelapse reference." };
  }
  const fields = readCoreFields(formData);
  if ("error" in fields) {
    await discardUpload(supabase, videoPath);
    return fields;
  }

  const { data: existing } = await supabase.from("order_timelapses").select("video_url, customer_id").eq("id", id).maybeSingle();
  if (!existing) {
    await discardUpload(supabase, videoPath);
    return { error: "Timelapse not found." };
  }

  let videoUrl = existing.video_url;
  let uploadedPath: string | null = null;
  if (videoPath) {
    try {
      const uploaded = await verifyUploadedTimelapseVideo(supabase, videoPath);
      videoUrl = uploaded.url;
      uploadedPath = uploaded.path;
    } catch (error) {
      await discardUpload(supabase, videoPath);
      return { error: error instanceof TimelapseVideoError ? error.message : "Couldn't upload the video." };
    }
  }

  let customerId: string;
  try {
    customerId = await findOrCreateCustomer(supabase, fields.customerEmail, fields.customerName, existing.customer_id);
  } catch {
    await discardUpload(supabase, uploadedPath);
    return { error: "Couldn't save the customer record." };
  }
  await addCustomerTag(supabase, customerId, "Etsy — timelapse");

  const { error } = await supabase
    .from("order_timelapses")
    .update({ slug: fields.slug, customer_id: customerId, etsy_order_id: fields.etsyOrderId, video_url: videoUrl })
    .eq("id", id);

  if (error) {
    await discardUpload(supabase, uploadedPath);
    return { error: error.code === "23505" ? "That link is already taken — choose another." : error.message };
  }

  // Only delete the replaced video once the row points at the new one.
  if (uploadedPath) {
    const oldPath = timelapseVideoPathFromUrl(existing.video_url);
    if (oldPath && oldPath !== uploadedPath) await deleteTimelapseVideo(supabase, oldPath).catch(() => {});
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
    .returns<{ slug: string; etsy_order_id: string; customers: { name: string | null; email: string | null } | null } | null>();
  if (!timelapse || !timelapse.customers) return { error: "Timelapse not found." };
  if (!timelapse.customers.email) return { error: "No email on file for this customer — use the QR label instead." };

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
