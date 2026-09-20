"use client";

import { useActionState } from "react";
import type { ShippingRateFormState } from "./actions";

const inputClass = "border border-black/20 px-3 py-2 outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-sm";

export type ShippingRateFormValues = {
  id?: string;
  name: string;
  minWeightGrams: number;
  maxWeightGrams: number | null;
  pricePounds: number;
  freeShippingThresholdPounds: number | null;
  active: boolean;
  sortOrder: number;
};

export function ShippingRateForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (prevState: ShippingRateFormState, formData: FormData) => Promise<ShippingRateFormState>;
  initialValues: ShippingRateFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      {initialValues.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <label className={labelClass}>
        Name
        <input name="name" required defaultValue={initialValues.name} placeholder="Letter (2nd Class)" className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-5">
        <label className={labelClass}>
          Min weight (g)
          <input name="minWeightGrams" type="number" min="0" required defaultValue={initialValues.minWeightGrams} className={inputClass} />
        </label>
        <label className={labelClass}>
          Max weight (g, blank = no limit)
          <input name="maxWeightGrams" type="number" min="0" defaultValue={initialValues.maxWeightGrams ?? ""} className={inputClass} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <label className={labelClass}>
          Price (£)
          <input name="pricePounds" type="number" min="0" step="0.01" required defaultValue={initialValues.pricePounds} className={inputClass} />
        </label>
        <label className={labelClass}>
          Free shipping above (£, optional)
          <input name="freeShippingThresholdPounds" type="number" min="0" step="0.01" defaultValue={initialValues.freeShippingThresholdPounds ?? ""} className={inputClass} />
        </label>
      </div>

      <label className={labelClass}>
        Sort order
        <input name="sortOrder" type="number" defaultValue={initialValues.sortOrder} className={inputClass} />
        <span className="text-xs text-black/40">Bands are checked in this order — the first one whose weight range fits the cart wins.</span>
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
