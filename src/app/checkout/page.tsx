"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatPence } from "@/lib/money";

type PricedCart = { totalPence: number };

export default function CheckoutPage() {
  const { lines, discountCode, giftCardCode } = useCart();
  const [email, setEmail] = useState("");
  const [pricedCart, setPricedCart] = useState<PricedCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkedEmpty, setCheckedEmpty] = useState(false);

  useEffect(() => {
    // cart-store hydrates from localStorage after mount, so wait a tick before deciding the cart is empty
    const timeout = setTimeout(() => setCheckedEmpty(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (lines.length === 0) return;
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      })
      .catch((err) => setError(err.message));
  }, [lines, discountCode, giftCardCode]);

  if (checkedEmpty && lines.length === 0) {
    return (
      <>
        <main className="mx-auto max-w-md px-6 py-10">
          <p className="text-sm text-black/60">
            Your cart is empty.{" "}
            <Link href="/shop" className="underline">
              Browse the shop
            </Link>
            .
          </p>
        </main>
      </>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
          email,
          discountCode: discountCode || undefined,
          giftCardCode: giftCardCode || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "We couldn't start checkout.");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't start checkout.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className="mx-auto max-w-md px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold">Checkout</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border border-black/20 px-3 py-2 outline-none focus:border-black"
            />
          </label>

          <p className="text-xs text-black/50">You&apos;ll enter your delivery address and payment details on the next step (secure Stripe checkout).</p>

          {pricedCart && (
            <div className="flex justify-between border-t border-black/10 pt-4 text-base font-semibold">
              <span>Total</span>
              <span>{formatPence(pricedCart.totalPence)}</span>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting || !pricedCart} className="bg-black px-6 py-3 text-sm font-medium text-white disabled:opacity-50">
            {submitting ? "Redirecting…" : "Continue to payment"}
          </button>
        </form>
      </main>
    </>
  );
}
