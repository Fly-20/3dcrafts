"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";

export default function CheckoutSuccessPage() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // clears the local cart once payment has succeeded — the order itself is
    // created by the Stripe webhook (source of truth), not this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-4 text-2xl font-semibold">Thank you for your order!</h1>
        <p className="mb-8 text-sm text-black/60">We&apos;ve received your payment and you&apos;ll get a confirmation email shortly with your order details.</p>
        <Link href="/shop" className="underline">
          Continue shopping
        </Link>
      </main>
    </>
  );
}
