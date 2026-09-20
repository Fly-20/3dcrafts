"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, type CartLine } from "@/lib/cart-store";

export function AddToCartButton({ line, maxQuantity }: { line: Omit<CartLine, "quantity">; maxQuantity: number | null }) {
  const { addLine } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (maxQuantity === 0) {
    return <p className="text-sm text-black/60">Sold out.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Qty
          <input
            type="number"
            min={1}
            max={maxQuantity ?? undefined}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            className="w-16 border border-black/20 px-2 py-1 text-sm outline-none focus:border-black"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            addLine(line, quantity);
            setAdded(true);
          }}
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
    </div>
  );
}
