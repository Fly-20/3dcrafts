"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import type { ProductFormState } from "./actions";
import { RichTextEditor } from "./rich-text-editor";

const fulfilmentTypes = ["stock", "made_to_order", "pre_order", "quote_only", "unavailable"];
const statuses = ["draft", "active", "archived"];

const inputClass = "border border-black/20 px-3 py-2 outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-sm";
const cardClass = "flex flex-col gap-5 border border-black/10 p-5";
const cardHeadingClass = "text-sm font-semibold";

function slugifyHandle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export type ProductFormValues = {
  productId?: string;
  variantId?: string;
  title: string;
  description: string;
  fulfilmentType: string;
  status: string;
  basePricePounds: number;
  vatRatePercent: number;
  sku: string;
  weightGrams: number;
  stockQuantity: number;
  productionTimeMinutes: number | null;
  categoryId: string | null;
  urlHandle: string;
  seoTitle: string;
  seoDescription: string;
};

export function ProductForm({
  action,
  initialValues,
  submitLabel,
  imagesField,
  categories,
  variantsField,
  hasOptions = false,
}: {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initialValues: ProductFormValues;
  submitLabel: string;
  /** Rendered inside the Media block — only passed on the create flow, since editing manages already-uploaded images separately (ProductImagesManager) below the form. */
  imagesField?: React.ReactNode;
  categories: { id: string; name: string }[];
  /** Options/variants manager (VariantsManager) — only passed on the edit page. Always rendered when present (so a plain product can gain its first option), regardless of hasOptions. */
  variantsField?: React.ReactNode;
  /** True once the product has at least one option — hides the inline single-variant SKU/weight/stock fields (managed via variantsField's table instead) and tells the server action to skip the variant update. */
  hasOptions?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  const handleInputRef = useRef<HTMLInputElement>(null);
  const handleTouchedRef = useRef(Boolean(initialValues.urlHandle));
  const [seoTitleLength, setSeoTitleLength] = useState(initialValues.seoTitle.length);
  const [seoDescriptionLength, setSeoDescriptionLength] = useState(initialValues.seoDescription.length);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (handleTouchedRef.current || !handleInputRef.current) return;
    handleInputRef.current.value = slugifyHandle(event.target.value);
  }

  return (
    <form action={formAction} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
      {initialValues.productId && <input type="hidden" name="productId" defaultValue={initialValues.productId} />}
      {!hasOptions && initialValues.variantId && <input type="hidden" name="variantId" defaultValue={initialValues.variantId} />}
      <input type="hidden" name="hasOptions" value={hasOptions ? "true" : "false"} />

      <div className="flex flex-col gap-6">
        {/* Title, description, media, category */}
        <div className={cardClass}>
          <label className={labelClass}>
            Title
            <input name="title" required defaultValue={initialValues.title} onChange={handleTitleChange} className={inputClass} />
          </label>

          <div className={labelClass}>
            Description
            <RichTextEditor name="description" initialHtml={initialValues.description} />
          </div>

          {imagesField}

          <label className={labelClass}>
            Category
            <select name="categoryId" defaultValue={initialValues.categoryId ?? ""} className={inputClass}>
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-black/40">
              Manage categories in{" "}
              <Link href="/admin/categories" className="underline">
                Categories
              </Link>
              .
            </span>
          </label>
        </div>

        {/* Pricing */}
        <div className={cardClass}>
          <h2 className={cardHeadingClass}>Pricing</h2>
          <div className="grid grid-cols-2 gap-5">
            <label className={labelClass}>
              Base price (£, inc. VAT)
              <input name="basePrice" type="number" min="0" step="0.01" required defaultValue={initialValues.basePricePounds} className={inputClass} />
            </label>
            <label className={labelClass}>
              VAT rate (%)
              <input name="vatRatePercent" type="number" min="0" max="100" step="0.1" required defaultValue={initialValues.vatRatePercent} className={inputClass} />
            </label>
          </div>
        </div>

        {/* Inventory & shipping — stands in for Shopify's Shipping + Variants blocks. Products with no options get one default variant edited inline here; once options exist, variantsField (VariantsManager) replaces the inline fields below. */}
        <div className={cardClass}>
          <h2 className={cardHeadingClass}>Inventory &amp; shipping</h2>
          <label className={labelClass}>
            Fulfilment type
            <select name="fulfilmentType" defaultValue={initialValues.fulfilmentType} className={inputClass}>
              {fulfilmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          {!hasOptions && (
            <>
              <p className="text-xs text-black/50">Every product needs at least one variant to be purchasable — this is its single default one. Add an option below to sell multiple variants instead.</p>
              <div className="grid grid-cols-2 gap-5">
                <label className={labelClass}>
                  SKU
                  <input name="sku" required defaultValue={initialValues.sku} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Weight (grams)
                  <input name="weightGrams" type="number" min="1" required defaultValue={initialValues.weightGrams} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Stock quantity
                  <input name="stockQuantity" type="number" min="0" defaultValue={initialValues.stockQuantity} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Production time (minutes)
                  <input name="productionTimeMinutes" type="number" min="0" defaultValue={initialValues.productionTimeMinutes ?? ""} className={inputClass} />
                </label>
              </div>
            </>
          )}

          {variantsField && (
            <div className={hasOptions ? "" : "border-t border-black/10 pt-4"}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-black/50">Options &amp; variants</h3>
              {variantsField}
            </div>
          )}
        </div>

        {/* Search engine listing */}
        <div className={cardClass}>
          <h2 className={cardHeadingClass}>Search engine listing</h2>
          <p className="text-xs text-black/50">Add a title and description to see how this product might appear in a search engine listing.</p>

          <label className={labelClass}>
            Page title
            <input name="seoTitle" defaultValue={initialValues.seoTitle} maxLength={70} onChange={(event) => setSeoTitleLength(event.target.value.length)} className={inputClass} />
            <span className="text-xs text-black/40">{seoTitleLength} of 70 characters used</span>
          </label>

          <label className={labelClass}>
            Meta description
            <textarea
              name="seoDescription"
              rows={3}
              defaultValue={initialValues.seoDescription}
              maxLength={160}
              onChange={(event) => setSeoDescriptionLength(event.target.value.length)}
              className={inputClass}
            />
            <span className="text-xs text-black/40">{seoDescriptionLength} of 160 characters used</span>
          </label>

          <label className={labelClass}>
            URL handle
            <div className="flex items-center border border-black/20 focus-within:border-black">
              <span className="pl-3 text-sm text-black/40">/shop/</span>
              <input
                ref={handleInputRef}
                name="urlHandle"
                defaultValue={initialValues.urlHandle}
                onChange={(event) => {
                  handleTouchedRef.current = true;
                  event.target.value = slugifyHandle(event.target.value);
                }}
                placeholder="auto-generated-from-title"
                className="w-full px-2 py-2 text-sm outline-none"
              />
            </div>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Status */}
        <div className={cardClass}>
          <h2 className={cardHeadingClass}>Status</h2>
          <select name="status" defaultValue={initialValues.status} className={inputClass}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        {state.success && <p className="text-sm text-green-700">Saved.</p>}

        <button type="submit" disabled={pending} className="bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
