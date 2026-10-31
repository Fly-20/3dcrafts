import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Timelapse video upload/URL helpers. Mirrors storage.ts's shape for product
 * images, in its own bucket since videos are a different content type and
 * lifecycle (one file per order, not reordered/managed like product photos).
 */
export const TIMELAPSE_VIDEOS_BUCKET = "order-timelapses";

// Real exports run ~5MB (see planning notes); capped well above that to
// catch an un-compressed mistake without being needlessly restrictive.
// Matches next.config.ts's serverActions.bodySizeLimit.
const maxFileSizeBytes = 20 * 1024 * 1024;

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
  if (file.size > maxFileSizeBytes) throw new TimelapseVideoError("Videos must be 20 MB or smaller.");
  return extension;
}

/** Generated id, not the original filename — avoids collisions and allows safe long-lived caching. */
export function buildTimelapseVideoPath(file: Pick<File, "type" | "size">) {
  return `${crypto.randomUUID()}.${validateAndGetExtension(file)}`;
}

export function getTimelapseVideoPublicUrl(supabase: SupabaseClient, path: string) {
  return supabase.storage.from(TIMELAPSE_VIDEOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadTimelapseVideo(supabase: SupabaseClient, file: File) {
  const path = buildTimelapseVideoPath(file);

  const { error } = await supabase.storage.from(TIMELAPSE_VIDEOS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

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
