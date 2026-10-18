"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useCart, type CartLine } from "@/lib/cart-store";

export function AddToCartButton({ line, maxQuantity, personalisationRequired = false }: { line: Omit<CartLine, "quantity">; maxQuantity: number | null; personalisationRequired?: boolean }) {
  const { addLine } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [personalisationText, setPersonalisationText] = useState("");
  const [personalisationError, setPersonalisationError] = useState(false);
  const personalisationRef = useRef<HTMLTextAreaElement>(null);
  const personalisationErrorId = useId();

  function showPersonalisationError() {
    setPersonalisationError(true);
    setAdded(false);
    personalisationRef.current?.focus();
  }

  if (maxQuantity === 0) {
    return <p className="text-sm text-black/60">Sold out.</p>;
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={(event) => {
      event.preventDefault();
      if (personalisationRequired && !personalisationText.trim()) {
        showPersonalisationError();
        return;
      }
      setPersonalisationError(false);
      addLine({ ...line, personalisationText: personalisationRequired ? personalisationText.trim() : undefined }, quantity);
      setAdded(true);
    }}>
      {personalisationRequired && (
        <label className="flex flex-col gap-1 text-sm">
          Personalisation (required)
          <textarea required maxLength={200} rows={3} value={personalisationText}
            ref={personalisationRef}
            aria-invalid={personalisationError || undefined}
            aria-describedby={personalisationError ? personalisationErrorId : undefined}
            onInvalid={(event) => { event.preventDefault(); showPersonalisationError(); }}
            onChange={(event) => { setPersonalisationText(event.target.value); if (event.target.value.trim()) setPersonalisationError(false); setAdded(false); }}
            placeholder="e.g. Emma, Oliver, Sophia"
            className={`border px-3 py-2 outline-none ${personalisationError ? "border-red-600 focus:border-red-600" : "border-black/20 focus:border-black"}`} />
          {personalisationError && (
            <span id={personalisationErrorId} role="alert" className="text-sm text-red-700">Please enter the names or text you&apos;d like on your item.</span>
          )}
          <span className="text-xs text-black/50">Enter all names or text in this field, separated by commas or new lines. For multiple items, make clear which name goes on each. Included in the price.</span>
          <span className="text-xs text-black/50">{personalisationText.length}/200 characters</span>
        </label>
      )}
      <div className="flex items-center gap-3">
        <div role="group" aria-label="Quantity" className="flex items-center">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => { setQuantity(Math.max(1, quantity - 1)); setAdded(false); }}
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
            onChange={(event) => { setQuantity(Math.min(maxQuantity ?? Infinity, Math.max(1, Math.floor(Number(event.target.value)) || 1))); setAdded(false); }}
            className="h-10 w-14 appearance-none border border-black/20 px-2 text-center text-sm outline-none focus:border-black [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={maxQuantity !== null && quantity >= maxQuantity}
            onClick={() => { setQuantity(Math.min(maxQuantity ?? Infinity, quantity + 1)); setAdded(false); }}
            className="flex h-10 w-10 items-center justify-center text-xl disabled:cursor-not-allowed disabled:opacity-30"
          >
            +
          </button>
        </div>
        <button
          type="submit"
          className="bg-black px-6 py-2 text-sm font-medium text-white"
        >
          Add to cart
        </button>
      </div>
      {added && (
        <p className="text-sm text-black/70">
          Added to cart.{" "}
          <Link href="/cart" className="underline">
            View cart
          </Link>
        </p>
      )}
    </form>
  );
}
