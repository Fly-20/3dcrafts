"use client";

import { useActionState } from "react";
import { PRICING_SETTING_GROUPS, type PricingSettings } from "@/lib/pricing/settings";
import { updatePricingSettings } from "./actions";

const inputClass = "w-full border border-black/20 px-2.5 py-1.5 text-sm outline-none focus:border-black disabled:bg-black/[.03]";

/** Percent fields are edited as 0–100; rounded to avoid float noise like 10.500000000000002. */
function display(value: number, percent?: boolean) {
  return String(percent ? Math.round(value * 100 * 1000) / 1000 : value);
}

export function PricingForm({ settings, editable }: { settings: PricingSettings; editable: boolean }) {
  const [state, formAction, pending] = useActionState(updatePricingSettings, {});

  return (
    <form action={formAction} className="flex max-w-4xl flex-col gap-8">
      {PRICING_SETTING_GROUPS.map((group) => (
        <fieldset key={group.title} className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <legend className="mb-3 text-sm font-semibold">{group.title}</legend>
          {group.fields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1 text-xs text-black/60">
              {field.label}
              <input name={field.key} type="number" min="0" step="any" required defaultValue={display(settings[field.key], field.percent)} disabled={!editable} className={inputClass} />
              {field.hint && <span className="text-black/40">{field.hint}</span>}
            </label>
          ))}
        </fieldset>
      ))}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-700">Saved. New quotes use these figures; saved quotes keep the figures they were priced with.</p>}

      <button type="submit" disabled={pending || !editable} className="self-start bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
