import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

/**
 * Product image upload/URL helpers (Section 4a of the technical plan).
 * Images live in the public `product-images` Supabase Storage bucket, not
 * `/public`, so a new product image can go live without a code deploy.
 */
export const PRODUCT_IMAGES_BUCKET = "product-images";

// Free-tier storage budget (Section 4a) assumes images are resized/compressed before upload.
const maxFileSizeBytes = 5 * 1024 * 1024;
const allowedContentTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ProductImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductImageError";
  }
}

function validateAndGetExtension(file: File) {
  const extension = allowedContentTypes[file.type];
  if (!extension) throw new ProductImageError("Images must be JPG, PNG or WebP.");
  if (file.size > maxFileSizeBytes) throw new ProductImageError("Images must be 5 MB or smaller.");
  return extension;
}

/** Generated id in the storage path, not the original filename — avoids collisions and allows safe long-lived caching. */
export function buildProductImagePath(productId: string, file: File) {
  return `${productId}/${randomUUID()}.${validateAndGetExtension(file)}`;
}

export function getProductImagePublicUrl(supabase: SupabaseClient, path: string) {
  return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Server-side upload: an admin route handler receives the file (after
 * checking the caller is an authenticated admin) and uploads it with the
 * service role client, which bypasses the storage RLS policies below.
 */
export async function uploadProductImage(supabase: SupabaseClient, productId: string, file: File) {
  const path = buildProductImagePath(productId, file);

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  return { path, url: getProductImagePublicUrl(supabase, path) };
}

export async function deleteProductImage(supabase: SupabaseClient, path: string) {
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

/**
 * Alternative direct-from-browser upload path (Section 4a): an authenticated
 * admin client requests a short-lived signed URL and uploads straight to
 * Storage, guarded by the "Admins can upload product images" RLS policy on
 * storage.objects instead of a server route handler.
 */
export async function createSignedProductImageUploadUrl(supabase: SupabaseClient, productId: string, file: File) {
  const path = buildProductImagePath(productId, file);
  const { data, error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path, token: data.token, signedUrl: data.signedUrl };
}
