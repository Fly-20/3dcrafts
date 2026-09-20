"use client";

import { useActionState } from "react";
import type { GiftCardFormState } from "./actions";

const inputClass = "border border-black/20 px-3 py-2 outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-sm";

export type GiftCardFormValues = {
  id?: string;
  code: string;
  initialBalancePounds: number;
  remainingBalancePounds: number;
  issuedToCustomerId: string | null;
  active: boolean;
};

export function GiftCardForm({
  action,
  initialValues,
  submitLabel,
  customers,
  isEdit,
}: {
  action: (prevState: GiftCardFormState, formData: FormData) => Promise<GiftCardFormState>;
  initialValues: GiftCardFormValues;
  submitLabel: string;
  customers: { id: string; email: string }[];
  isEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      {initialValues.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <label className={labelClass}>
        Code
        <input name="code" required defaultValue={initialValues.code} className={`${inputClass} uppercase`} />
      </label>

      {isEdit ? (
        <div className="grid grid-cols-2 gap-5">
          <label className={labelClass}>
            Initial balance (£)
            <input value={initialValues.initialBalancePounds.toFixed(2)} disabled className={`${inputClass} bg-black/5 text-black/50`} />
          </label>
          <label className={labelClass}>
            Remaining balance (£)
            <input name="remainingBalancePounds" type="number" min="0" step="0.01" required defaultValue={initialValues.remainingBalancePounds} className={inputClass} />
          </label>
        </div>
      ) : (
        <label className={labelClass}>
          Initial balance (£)
          <input name="initialBalancePounds" type="number" min="0.01" step="0.01" required defaultValue={initialValues.initialBalancePounds || ""} className={inputClass} />
        </label>
      )}

      <label className={labelClass}>
        Issued to (optional)
        <select name="issuedToCustomerId" defaultValue={initialValues.issuedToCustomerId ?? ""} className={inputClass}>
          <option value="">No customer on file</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.email}
            </option>
          ))}
        </select>
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
