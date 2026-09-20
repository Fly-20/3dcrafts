"use client";

import { useActionState, useState } from "react";
import type { DiscountFormState } from "./actions";

const inputClass = "border border-black/20 px-3 py-2 outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-sm";

export type DiscountFormValues = {
  id?: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  valuePercent: number;
  valuePounds: number;
  startsAt: string; // "" or "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
  endsAt: string;
  usageLimit: number | null;
  active: boolean;
};

export function DiscountForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (prevState: DiscountFormState, formData: FormData) => Promise<DiscountFormState>;
  initialValues: DiscountFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [type, setType] = useState(initialValues.type);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      {initialValues.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <label className={labelClass}>
        Code
        <input name="code" required defaultValue={initialValues.code} className={`${inputClass} uppercase`} />
      </label>

      <label className={labelClass}>
        Type
        <select name="type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className={inputClass}>
          <option value="percentage">Percentage off</option>
          <option value="fixed">Fixed amount off</option>
          <option value="free_shipping">Free shipping</option>
        </select>
      </label>

      {type === "percentage" && (
        <label className={labelClass}>
          Percentage off (%)
          <input name="valuePercent" type="number" min="0" max="100" step="1" required defaultValue={initialValues.valuePercent} className={inputClass} />
        </label>
      )}

      {type === "fixed" && (
        <label className={labelClass}>
          Amount off (£)
          <input name="valuePounds" type="number" min="0" step="0.01" required defaultValue={initialValues.valuePounds} className={inputClass} />
        </label>
      )}

      <div className="grid grid-cols-2 gap-5">
        <label className={labelClass}>
          Starts at (optional)
          <input name="startsAt" type="datetime-local" defaultValue={initialValues.startsAt} className={inputClass} />
        </label>
        <label className={labelClass}>
          Ends at (optional)
          <input name="endsAt" type="datetime-local" defaultValue={initialValues.endsAt} className={inputClass} />
        </label>
      </div>

      <label className={labelClass}>
        Usage limit (blank = unlimited)
        <input name="usageLimit" type="number" min="0" defaultValue={initialValues.usageLimit ?? ""} className={inputClass} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input name="active" type="checkbox" defaultChecked={initialValues.active} />
        Active
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
