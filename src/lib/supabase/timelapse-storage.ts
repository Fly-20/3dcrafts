import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Timelapse video upload/URL helpers. Mirrors storage.ts's shape for product
 * images, in its own bucket since videos are a different content type and
 * lifecycle (one file per order, not reordered/managed like product photos).
 */
export const TIMELAPSE_VIDEOS_BUCKET = "order-timelapses";

// Real exports run ~5MB (see planning notes). The browser uploads straight to
// Storage via a signed URL (Vercel caps function request bodies at 4.5MB), so
// this limit is checked when the URL is issued and again on the stored object.
// 50MB = the Supabase project's global per-file limit on the Free plan (tested
// 2026-11-15: a 60MB upload was rejected). Raise to 100MB here after moving to
// Supabase Pro / raising the global limit, if uncompressed exports need it.
export const MAX_TIMELAPSE_VIDEO_MB = 50;
export const MAX_TIMELAPSE_VIDEO_BYTES = MAX_TIMELAPSE_VIDEO_MB * 1024 * 1024;
const maxFileSizeBytes = MAX_TIMELAPSE_VIDEO_BYTES;

// MP4 (H.264) only — iPhone .mov exports sometimes use a codec most browsers
// won't play back, so the wrong format is rejected at upload time with a
// clear message rather than producing a link that won't play.
const allowedContentTypes: Record<string, string> = {
  "video/mp4": "mp4",
};

export class TimelapseVideoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimelapseVideoError";
  }
}

function validateAndGetExtension(file: Pick<File, "type" | "size">) {
  const extension = allowedContentTypes[file.type];
  if (!extension) throw new TimelapseVideoError("Videos must be MP4 (H.264).");
  if (file.size > maxFileSizeBytes) throw new TimelapseVideoError(`Videos must be ${MAX_TIMELAPSE_VIDEO_MB} MB or smaller.`);
  return extension;
}

/** Generated id, not the original filename — avoids collisions and allows safe long-lived caching. */
export function buildTimelapseVideoPath(file: Pick<File, "type" | "size">) {
  return `${crypto.randomUUID()}.${validateAndGetExtension(file)}`;
}

export function getTimelapseVideoPublicUrl(supabase: SupabaseClient, path: string) {
  return supabase.storage.from(TIMELAPSE_VIDEOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Direct-from-browser upload, same pattern as product images
 * (createSignedProductImageUploadUrl in storage.ts): the admin's Server Action
 * issues a short-lived signed URL, the browser uploads the file to it, and a
 * second Server Action saves the row once the object exists.
 */
export async function createSignedTimelapseVideoUploadUrl(supabase: SupabaseClient, file: Pick<File, "type" | "size">) {
  const path = buildTimelapseVideoPath(file);
  const { data, error } = await supabase.storage.from(TIMELAPSE_VIDEOS_BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path, token: data.token };
}

/** Paths are always `<uuid>.mp4` (see buildTimelapseVideoPath) — anything else didn't come from us. */
export function isTimelapseVideoPath(path: string) {
  return /^[0-9a-f-]{36}\.mp4$/.test(path);
}

/**
 * Confirms a browser upload actually landed and is within the limits (the
 * signed URL itself doesn't enforce size or type). Throws TimelapseVideoError
 * with a user-facing message otherwise; the caller deletes the object.
 */
export async function verifyUploadedTimelapseVideo(supabase: SupabaseClient, path: string) {
  if (!isTimelapseVideoPath(path)) throw new TimelapseVideoError("Invalid video reference. Please upload the video again.");
  const { data, error } = await supabase.storage.from(TIMELAPSE_VIDEOS_BUCKET).info(path);
  if (error || !data) throw new TimelapseVideoError("The video upload didn't complete. Please try again.");
  if (typeof data.size === "number" && data.size > maxFileSizeBytes) throw new TimelapseVideoError(`Videos must be ${MAX_TIMELAPSE_VIDEO_MB} MB or smaller.`);
  return { path, url: getTimelapseVideoPublicUrl(supabase, path) };
}

export async function deleteTimelapseVideo(supabase: SupabaseClient, path: string) {
  const { error } = await supabase.storage.from(TIMELAPSE_VIDEOS_BUCKET).remove([path]);
  if (error) throw error;
}

// Only the public URL is persisted on order_timelapses (not the path), same
// convention as product_images — the path is derived back from the URL on
// delete/replace, same marker-slice approach as products/actions.ts.
const timelapseVideoUrlMarker = `/${TIMELAPSE_VIDEOS_BUCKET}/`;
export function timelapseVideoPathFromUrl(url: string): string | null {
  const markerIndex = url.indexOf(timelapseVideoUrlMarker);
  return markerIndex === -1 ? null : url.slice(markerIndex + timelapseVideoUrlMarker.length);
}
