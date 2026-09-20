"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addProductOptionAction,
  addOptionValueAction,
  removeOptionValueAction,
  removeOptionAction,
  generateVariantsAction,
  updateVariantsAction,
  type VariantEdit,
  type VariantsActionState,
} from "./variants-actions";

type OptionValue = { id: string; value: string };
type Option = { id: string; name: string; values: OptionValue[] };
type Variant = {
  id: string;
  sku: string;
  pricePence: number | null;
  weightGrams: number;
  stockQuantity: number;
  productionTimeMinutes: number | null;
  status: "active" | "archived";
  valueIds: string[];
};

const inputClass = "border border-black/20 px-2 py-1 text-sm outline-none focus:border-black";

function AddOptionForm({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState<VariantsActionState, FormData>(addProductOptionAction, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="productId" value={productId} />
      <label className="flex flex-col gap-1 text-xs">
        Option name
        <input name="name" required placeholder="Colour" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Values (comma-separated)
        <input name="values" required placeholder="Red, Blue, Green" className={`${inputClass} w-64`} />
      </label>
      <button type="submit" disabled={pending} className="border border-black/20 px-3 py-1.5 text-xs hover:border-black disabled:opacity-60">
        {pending ? "Adding…" : "Add option"}
      </button>
      {state.error && (
        <p className="w-full text-xs text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

function AddValueForm({ productId, optionId }: { productId: string; optionId: string }) {
  const [state, formAction, pending] = useActionState<VariantsActionState, FormData>(addOptionValueAction, {});
  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="optionId" value={optionId} />
      <input name="value" required placeholder="Add value" className={`${inputClass} w-24`} />
      <button type="submit" disabled={pending} className="border border-black/20 px-2 py-1 text-xs hover:border-black disabled:opacity-60">
        +
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

export function VariantsManager({ productId, options, variants: initialVariants }: { productId: string; options: Option[]; variants: Variant[] }) {
  const [variants, setVariants] = useState(initialVariants);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<VariantsActionState>({});
  const [removeErrors, setRemoveErrors] = useState<Record<string, string>>({});
  const [optionErrors, setOptionErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleRemoveValue(valueId: string) {
    setRemoveErrors((prev) => {
      const next = { ...prev };
      delete next[valueId];
      return next;
    });
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("valueId", valueId);
    startTransition(async () => {
      const result = await removeOptionValueAction(formData);
      if (result?.error) setRemoveErrors((prev) => ({ ...prev, [valueId]: result.error! }));
    });
  }

  function handleRemoveOption(optionId: string) {
    setOptionErrors((prev) => {
      const next = { ...prev };
      delete next[optionId];
      return next;
    });
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("optionId", optionId);
    startTransition(async () => {
      const result = await removeOptionAction(formData);
      if (result?.error) setOptionErrors((prev) => ({ ...prev, [optionId]: result.error! }));
    });
  }

  function updateVariant(id: string, patch: Partial<Variant>) {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  }

  function labelFor(variant: Variant) {
    return options
      .map((option) => option.values.find((value) => variant.valueIds.includes(value.id))?.value)
      .filter(Boolean)
      .join(" / ");
  }

  function handleGenerate() {
    setGenerateError(null);
    const formData = new FormData();
    formData.set("productId", productId);
    startTransition(async () => {
      const result = await generateVariantsAction(formData);
      if (result?.error) setGenerateError(result.error);
    });
  }

  function handleSave() {
    setSaveState({});
    const edits: VariantEdit[] = variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      pricePounds: variant.pricePence !== null ? variant.pricePence / 100 : null,
      weightGrams: variant.weightGrams,
      stockQuantity: variant.stockQuantity,
      productionTimeMinutes: variant.productionTimeMinutes,
      status: variant.status,
    }));
    startTransition(async () => {
      const result = await updateVariantsAction(productId, edits);
      setSaveState(result);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50">Options</h3>
        {options.map((option) => (
          <div key={option.id} className="flex flex-wrap items-center gap-2 border border-black/10 px-3 py-2">
            <span className="text-sm font-medium">{option.name}:</span>
            {option.values.map((value) => (
              <span key={value.id} className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1 border border-black/15 px-2 py-0.5 text-xs">
                  {value.value}
                  <button type="button" onClick={() => handleRemoveValue(value.id)} className="text-black/40 hover:text-red-600" aria-label={`Remove ${value.value}`}>
                    ×
                  </button>
                </span>
                {removeErrors[value.id] && <span className="text-[10px] text-red-600">{removeErrors[value.id]}</span>}
              </span>
            ))}
            <AddValueForm productId={productId} optionId={option.id} />
            <span className="ml-auto flex items-center gap-2">
              {optionErrors[option.id] && <span className="text-[10px] text-red-600">{optionErrors[option.id]}</span>}
              <button type="button" onClick={() => handleRemoveOption(option.id)} className="text-xs text-black/40 hover:text-red-600">
                Remove option
              </button>
            </span>
          </div>
        ))}
        <AddOptionForm productId={productId} />
      </div>

      {options.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50">Variants</h3>
            <button type="button" onClick={handleGenerate} disabled={isPending} className="border border-black/20 px-3 py-1 text-xs hover:border-black disabled:opacity-60">
              Generate variants
            </button>
            <span className="text-xs text-black/40">Creates any missing option combinations — run again after adding a new value.</span>
          </div>
          {generateError && (
            <p className="text-xs text-red-600" role="alert">
              {generateError}
            </p>
          )}

          {variants.length === 0 ? (
            <p className="text-sm text-black/50">No variants yet — click &quot;Generate variants&quot; once you&apos;ve added option values.</p>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-black/50">
                    <th className="py-2 pr-3 font-medium">Combination</th>
                    <th className="py-2 pr-3 font-medium">SKU</th>
                    <th className="py-2 pr-3 font-medium">Price override (£)</th>
                    <th className="py-2 pr-3 font-medium">Weight (g)</th>
                    <th className="py-2 pr-3 font-medium">Stock</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id} className="border-b border-black/5">
                      <td className="py-2 pr-3 font-medium">{labelFor(variant)}</td>
                      <td className="py-2 pr-3">
                        <input value={variant.sku} onChange={(event) => updateVariant(variant.id, { sku: event.target.value })} className={`${inputClass} w-28`} />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="base price"
                          value={variant.pricePence !== null ? variant.pricePence / 100 : ""}
                          onChange={(event) => updateVariant(variant.id, { pricePence: event.target.value === "" ? null : Math.round(Number(event.target.value) * 100) })}
                          className={`${inputClass} w-24`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="1"
                          value={variant.weightGrams}
                          onChange={(event) => updateVariant(variant.id, { weightGrams: Number(event.target.value) })}
                          className={`${inputClass} w-20`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0"
                          value={variant.stockQuantity}
                          onChange={(event) => updateVariant(variant.id, { stockQuantity: Number(event.target.value) })}
                          className={`${inputClass} w-20`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <select value={variant.status} onChange={(event) => updateVariant(variant.id, { status: event.target.value as Variant["status"] })} className={inputClass}>
                          <option value="active">active</option>
                          <option value="archived">archived</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleSave} disabled={isPending} className="self-start border border-black bg-black px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60">
                  {isPending ? "Saving…" : "Save variants"}
                </button>
                {saveState.error && (
                  <p className="text-xs text-red-600" role="alert">
                    {saveState.error}
                  </p>
                )}
                {saveState.success && <p className="text-xs text-green-700">Saved.</p>}
              </div>
              <p className="text-xs text-black/40">Price override is optional — leave it blank to use the product&apos;s base price for that variant.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
