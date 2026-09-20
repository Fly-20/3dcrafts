"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-store";
import { formatPence } from "@/lib/money";

type PricedCart = {
  subtotalPence: number;
  discountPence: number;
  shippingPence: number;
  vatPence: number;
  totalPence: number;
};

export default function CartPage() {
  const { lines, setQuantity, removeLine, discountCode, setDiscountCode, giftCardCode, setGiftCardCode } = useCart();
  const [pricedCart, setPricedCart] = useState<PricedCart | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);

  useEffect(() => {
    // when the cart is empty, the render below shows the "empty cart" view instead of
    // the pricing summary, so there's no need to reset `pricedCart` here
    if (lines.length === 0) return;

    const controller = new AbortController();

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        discountCode: discountCode || undefined,
        giftCardCode: giftCardCode || undefined,
      }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? "We couldn't price your cart.");
        setPricedCart(body);
        setPricingError(null);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setPricedCart(null);
        setPricingError(error.message);
      });

    return () => controller.abort();
  }, [lines, discountCode, giftCardCode]);

  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold">Your cart</h1>

        {lines.length === 0 ? (
          <p className="text-sm text-black/60">
            Your cart is empty.{" "}
            <Link href="/shop" className="underline">
              Browse the shop
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            <ul className="flex flex-col gap-4">
              {lines.map((line) => (
                <li key={line.variantId} className="flex items-center gap-4 border-b border-black/10 pb-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-black/5">
                    {line.imageUrl && <Image src={line.imageUrl} alt={line.title} fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <Link href={`/shop/${line.slug}`} className="text-sm font-medium hover:underline">
                      {line.title}
                    </Link>
                    <p className="text-sm text-black/60">{formatPence(line.unitPricePence)} each</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) => setQuantity(line.variantId, Math.max(1, Number(event.target.value) || 1))}
                    className="w-16 border border-black/20 px-2 py-1 text-sm outline-none focus:border-black"
                  />
                  <button type="button" onClick={() => removeLine(line.variantId)} className="text-sm text-black/50 hover:text-red-600">
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Discount code"
                value={discountCode}
                onChange={(event) => setDiscountCode(event.target.value)}
                className="border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
              />
              <input
                type="text"
                placeholder="Gift card code"
                value={giftCardCode}
                onChange={(event) => setGiftCardCode(event.target.value)}
                className="border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            {pricingError && <p className="text-sm text-red-600">{pricingError}</p>}

            {pricedCart && (
              <div className="flex flex-col gap-2 border-t border-black/10 pt-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPence(pricedCart.subtotalPence)}</span>
                </div>
                {pricedCart.discountPence > 0 && (
                  <div className="flex justify-between text-black/60">
                    <span>Discount</span>
                    <span>-{formatPence(pricedCart.discountPence)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPence(pricedCart.shippingPence)}</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Includes VAT</span>
                  <span>{formatPence(pricedCart.vatPence)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPence(pricedCart.totalPence)}</span>
                </div>
              </div>
            )}

            <Link
              href="/checkout"
              aria-disabled={!pricedCart}
              className={`bg-black px-6 py-3 text-center text-sm font-medium text-white ${!pricedCart ? "pointer-events-none opacity-50" : ""}`}
            >
              {pricedCart ? "Proceed to checkout" : "Calculating total…"}
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
