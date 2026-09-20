"use client";

import { useMemo, useState } from "react";
import { formatPence } from "@/lib/money";
import { AddToCartButton } from "./add-to-cart-button";

type OptionValue = { id: string; value: string };
type Option = { id: string; name: string; values: OptionValue[] };
type Variant = { id: string; status: string; pricePence: number | null; stockQuantity: number; valueIds: string[] };

/**
 * Only rendered when a product has options (Section 7 Stage 2 multi-variant
 * support) — picks a variant from the selected option-value combination,
 * showing its price/stock and passing the right variantId to the cart.
 * Products with no options keep the old static price+button rendering
 * directly in page.tsx.
 */
export function VariantPicker({
  options,
  variants,
  slug,
  title,
  imageUrl,
  basePricePence,
  fulfilmentType,
}: {
  options: Option[];
  variants: Variant[];
  slug: string;
  title: string;
  imageUrl: string | null;
  basePricePence: number;
  fulfilmentType: string;
}) {
  const [selected, setSelected] = useState<Record<string, string>>(() => Object.fromEntries(options.map((option) => [option.id, option.values[0]?.id ?? ""])));

  const variant = useMemo(() => {
    const selectedIds = options.map((option) => selected[option.id]).sort();
    return variants.find((candidate) => candidate.status === "active" && [...candidate.valueIds].sort().join(",") === selectedIds.join(","));
  }, [options, selected, variants]);

  const unitPricePence = variant?.pricePence ?? basePricePence;
  const maxQuantity = variant ? (fulfilmentType === "stock" ? variant.stockQuantity : null) : 0;
  const variantLabel = options
    .map((option) => option.values.find((value) => value.id === selected[option.id])?.value)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <label key={option.id} className="flex flex-col gap-1 text-sm">
          {option.name}
          <select
            value={selected[option.id]}
            onChange={(event) => setSelected((prev) => ({ ...prev, [option.id]: event.target.value }))}
            className="border border-black/20 px-3 py-2 outline-none focus:border-black"
          >
            {option.values.map((value) => (
              <option key={value.id} value={value.id}>
                {value.value}
              </option>
            ))}
          </select>
        </label>
      ))}

      <p className="text-lg">{formatPence(unitPricePence)}</p>

      {variant ? (
        <AddToCartButton
          line={{ variantId: variant.id, slug, title: variantLabel ? `${title} — ${variantLabel}` : title, imageUrl, unitPricePence }}
          maxQuantity={maxQuantity}
        />
      ) : (
        <p className="text-sm text-black/60">This combination isn&apos;t available.</p>
      )}
    </div>
  );
}
