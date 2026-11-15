"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { prepareTimelapseVideoUpload, type TimelapseFormState } from "./actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { MAX_TIMELAPSE_VIDEO_BYTES, MAX_TIMELAPSE_VIDEO_MB, TIMELAPSE_VIDEOS_BUCKET } from "@/lib/supabase/timelapse-storage";
import { defaultTimelapseSlug, randomSlugSuffix, slugify } from "@/lib/timelapse-slug";

const inputClass = "border border-black/20 px-3 py-2 outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-sm";

export type TimelapseFormValues = {
  id?: string;
  customerName: string;
  customerEmail: string;
  etsyOrderId: string;
  slug: string;
};

export function TimelapseForm({
  action,
  initialValues,
  submitLabel,
  requireVideo,
}: {
  action: (prevState: TimelapseFormState, formData: FormData) => Promise<TimelapseFormState>;
  initialValues: TimelapseFormValues;
  submitLabel: string;
  requireVideo: boolean;
}) {
  // The video goes straight from the browser to Supabase Storage via a signed
  // URL (Vercel rejects function request bodies over 4.5MB); only its storage
  // path is sent to the Server Action, which verifies it and saves the row.
  const [state, formAction, pending] = useActionState(async (prevState: TimelapseFormState, formData: FormData): Promise<TimelapseFormState> => {
    const video = formData.get("video");
    formData.delete("video");
    if (video instanceof File && video.size > 0) {
      if (video.type !== "video/mp4") return { error: "Videos must be MP4 (H.264)." };
      if (video.size > MAX_TIMELAPSE_VIDEO_BYTES) return { error: `Videos must be ${MAX_TIMELAPSE_VIDEO_MB} MB or smaller.` };
      try {
        const prepared = await prepareTimelapseVideoUpload({ type: video.type, size: video.size });
        if (prepared.error || !prepared.path || !prepared.token) return { error: prepared.error || "Couldn't prepare the video upload." };
        const { error } = await createBrowserSupabaseClient().storage.from(TIMELAPSE_VIDEOS_BUCKET).uploadToSignedUrl(prepared.path, prepared.token, video, { contentType: video.type });
        if (error) return { error: "Couldn't upload the video. Please try again." };
        formData.set("videoPath", prepared.path);
      } catch {
        return { error: "Video upload failed. Please try again." };
      }
    }
    return action(prevState, formData);
  }, {});
  const [name, setName] = useState(initialValues.customerName);
  const [slug, setSlug] = useState(initialValues.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.id));
  const [warnedThisSubmit, setWarnedThisSubmit] = useState(false);
  const originalSlug = useRef(initialValues.slug);
  const isEdit = Boolean(initialValues.id);
  // Generated on first keystroke (not during render) so server and client HTML match.
  const slugSuffix = useRef<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (slugTouched) return;
    slugSuffix.current ??= randomSlugSuffix();
    setSlug(value.trim() ? defaultTimelapseSlug(value, slugSuffix.current) : "");
  }

  // Printed labels encode the old slug permanently, so changing it needs an
  // explicit heads-up rather than silently breaking an already-printed QR code.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const slugChanged = isEdit && slug !== originalSlug.current;
    if (slugChanged) {
      const confirmed = window.confirm("Changing this link will break any label already printed with the old QR code. Continue?");
      if (!confirmed) {
        event.preventDefault();
        return;
      }
    }
    setWarnedThisSubmit(slugChanged);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex max-w-md flex-col gap-5">
      {initialValues.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <label className={labelClass}>
        Customer name
        <input name="customerName" required value={name} onChange={(event) => handleNameChange(event.target.value)} className={inputClass} />
      </label>

      <label className={labelClass}>
        Customer email (optional)
        <input name="customerEmail" type="email" defaultValue={initialValues.customerEmail} className={inputClass} />
        <span className="text-xs text-black/50">Etsy often doesn&apos;t share it — leave blank and use the QR label.</span>
      </label>

      <label className={labelClass}>
        Etsy order ID
        <input name="etsyOrderId" required defaultValue={initialValues.etsyOrderId} className={inputClass} />
      </label>

      <label className={labelClass}>
        Link
        <div className="flex items-center gap-1 text-sm text-black/60">
          <span>/timelapse/</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlug(slugify(event.target.value));
              setSlugTouched(true);
            }}
            className={`${inputClass} flex-1`}
          />
        </div>
        {!isEdit && <span className="text-xs text-black/50">The random ending stops anyone guessing the link from a name.</span>}
      </label>

      <label className={labelClass}>
        {requireVideo ? "Video" : "Replace video (optional)"}
        <input name="video" type="file" accept="video/mp4" required={requireVideo} className={inputClass} />
        <span className="text-xs text-black/50">MP4 (H.264) only, up to {MAX_TIMELAPSE_VIDEO_MB} MB.</span>
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-700">Saved.{warnedThisSubmit && " Remember to print a new label with the updated link."}</p>}

      <button type="submit" disabled={pending} className="self-start bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Uploading and saving…" : submitLabel}
      </button>
    </form>
  );
}
