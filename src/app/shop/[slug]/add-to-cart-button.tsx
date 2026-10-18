"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartLine } from "@/lib/cart-store";

export function AddToCartButton({ line, maxQuantity, personalisationRequired = false }: { line: Omit<CartLine, "quantity">; maxQuantity: number | null; personalisationRequired?: boolean }) {
  const { addLine } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [personalisationText, setPersonalisationText] = useState("");
  const [personalisationError, setPersonalisationError] = useState(false);
  const personalisationRef = useRef<HTMLTextAreaElement>(null);
  const personalisationErrorId = useId();

  function showPersonalisationError() {
    setPersonalisationError(true);
    personalisationRef.current?.focus();
  }

  if (maxQuantity === 0) {
    return <p className="text-sm text-black/60">Sold out.</p>;
  }

  return (
    <form className="product-cart-form" onSubmit={(event) => {
      event.preventDefault();
      if (personalisationRequired && !personalisationText.trim()) {
        showPersonalisationError();
        return;
      }
      setPersonalisationError(false);
      addLine({ ...line, personalisationText: personalisationRequired ? personalisationText.trim() : undefined }, quantity);
      router.push("/cart");
    }}>
      {personalisationRequired && (
        <label className="product-personalisation">
          <span className="product-field-heading">Make it yours <span>Required</span></span>
          <textarea required maxLength={200} rows={3} value={personalisationText}
            ref={personalisationRef}
            aria-invalid={personalisationError || undefined}
            aria-describedby={personalisationError ? personalisationErrorId : undefined}
            onInvalid={(event) => { event.preventDefault(); showPersonalisationError(); }}
            onChange={(event) => { setPersonalisationText(event.target.value); if (event.target.value.trim()) setPersonalisationError(false); }}
            placeholder="e.g. Emma, Oliver, Sophia"
            className={`border px-3 py-2 outline-none ${personalisationError ? "border-red-600 focus:border-red-600" : "border-black/20 focus:border-black"}`} />
          {personalisationError && (
            <span id={personalisationErrorId} role="alert" className="text-sm text-red-700">Please enter the names or text you&apos;d like on your item.</span>
          )}
          <span className="text-xs text-black/50">Separate names with commas or new lines. Ordering more than one? Match each name to its item.</span>
          <span className="product-character-count">{personalisationText.length}/200 characters</span>
        </label>
      )}
      <div className="product-cart-actions">
        <div role="group" aria-label="Quantity" className="product-quantity">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => { setQuantity(Math.max(1, quantity - 1)); }}
            className="flex h-10 w-10 items-center justify-center text-xl disabled:cursor-not-allowed disabled:opacity-30"
          >
            −
          </button>
          <input
            type="number"
            aria-label="Quantity"
            min={1}
            max={maxQuantity ?? undefined}
            value={quantity}
            onChange={(event) => { setQuantity(Math.min(maxQuantity ?? Infinity, Math.max(1, Math.floor(Number(event.target.value)) || 1))); }}
            className="h-10 w-14 appearance-none border border-black/20 px-2 text-center text-sm outline-none focus:border-black [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={maxQuantity !== null && quantity >= maxQuantity}
            onClick={() => { setQuantity(Math.min(maxQuantity ?? Infinity, quantity + 1)); }}
            className="flex h-10 w-10 items-center justify-center text-xl disabled:cursor-not-allowed disabled:opacity-30"
          >
            +
          </button>
        </div>
        <button
          type="submit"
          className="product-add-button"
        >
          Add to cart
        </button>
      </div>
    </form>
  );
}
