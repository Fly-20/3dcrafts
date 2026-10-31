"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import type { TimelapseFormState } from "./actions";

const inputClass = "border border-black/20 px-3 py-2 outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-sm";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

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
  const [state, formAction, pending] = useActionState(action, {});
  const [name, setName] = useState(initialValues.customerName);
  const [slug, setSlug] = useState(initialValues.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.id));
  const [warnedThisSubmit, setWarnedThisSubmit] = useState(false);
  const originalSlug = useRef(initialValues.slug);
  const isEdit = Boolean(initialValues.id);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
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
        Customer email
        <input name="customerEmail" type="email" required defaultValue={initialValues.customerEmail} className={inputClass} />
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
      </label>

      <label className={labelClass}>
        {requireVideo ? "Video" : "Replace video (optional)"}
        <input name="video" type="file" accept="video/mp4" required={requireVideo} className={inputClass} />
        <span className="text-xs text-black/50">MP4 only, up to 20 MB.</span>
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-700">Saved.{warnedThisSubmit && " Remember to print a new label with the updated link."}</p>}

      <button type="submit" disabled={pending} className="self-start bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
