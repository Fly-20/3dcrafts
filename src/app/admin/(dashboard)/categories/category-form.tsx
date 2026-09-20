"use client";

import { useActionState } from "react";
import type { CategoryFormState } from "./actions";

const inputClass = "border border-black/20 px-3 py-2 outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-sm";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export function CategoryForm({
  action,
  initialValues,
  submitLabel,
  availableParents,
}: {
  action: (prevState: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  initialValues: CategoryFormValues;
  submitLabel: string;
  availableParents: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      {initialValues.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <label className={labelClass}>
        Name
        <input name="name" required defaultValue={initialValues.name} className={inputClass} />
      </label>

      <label className={labelClass}>
        Slug
        <input name="slug" defaultValue={initialValues.slug} placeholder="auto-generated-from-name" className={inputClass} />
      </label>

      <label className={labelClass}>
        Parent category (optional)
        <select name="parentId" defaultValue={initialValues.parentId ?? ""} className={inputClass}>
          <option value="">No parent</option>
          {availableParents.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-700">Saved.</p>}

      <button type="submit" disabled={pending} className="self-start bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
