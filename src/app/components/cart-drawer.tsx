"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cartLineKey, findInvalidCartLine, useCart } from "@/lib/cart-store";
import { formatPence } from "@/lib/money";

type PricedCart = { subtotalPence: number; shippingPence: number; totalPence: number };

export function CartDrawer() {
  const { lines, itemCount, setQuantity, removeLine, isDrawerOpen, closeDrawer } = useCart();
  const [pricedCart, setPricedCart] = useState<PricedCart | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  useEffect(() => {
    // when the drawer is closed or the cart is empty, the render below shows the "empty cart" view
    // instead of the pricing summary, so there's no need to reset `pricedCart` here
    if (!isDrawerOpen || lines.length === 0) return;

    const controller = new AbortController();

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity, personalisationText: line.personalisationText })) }),
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
  }, [isDrawerOpen, lines]);

  const invalidLine = findInvalidCartLine(lines, pricingError);

  return (
    <div className={`cart-drawer-shell${isDrawerOpen ? " is-open" : ""}`}>
      <div className="cart-drawer-backdrop" aria-hidden="true" onClick={closeDrawer} />
      <aside id="cart-drawer" className="cart-drawer-panel" aria-hidden={!isDrawerOpen} aria-label="Cart">
        <div className="cart-drawer-heading">
          <span>Your cart{itemCount > 0 ? ` (${itemCount})` : ""}</span>
          <button
            ref={closeButtonRef}
            type="button"
            className="menu-close"
            aria-label="Close cart"
            tabIndex={isDrawerOpen ? 0 : -1}
            onClick={closeDrawer}
          >
            <span /><span />
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="cart-drawer-empty">
            Your cart is empty.{" "}
            <Link href="/shop" tabIndex={isDrawerOpen ? 0 : -1} onClick={closeDrawer}>
              Browse the shop
            </Link>
            .
          </p>
        ) : (
          <>
            <ul className="cart-drawer-lines">
              {lines.map((line) => (
                <li key={cartLineKey(line)} className="cart-drawer-line">
                  <div className="cart-drawer-line-image">
                    {line.imageUrl && <Image src={line.imageUrl} alt={line.title} fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="cart-drawer-line-details">
                    <Link href={`/shop/${line.slug}`} tabIndex={isDrawerOpen ? 0 : -1} onClick={closeDrawer}>
                      {line.title}
                    </Link>
                    <p>{formatPence(line.unitPricePence)} each</p>
                    {line.personalisationText && <p className="cart-drawer-personalisation">Personalisation: {line.personalisationText}</p>}
                    <div className="cart-drawer-line-actions">
                      <input
                        type="number"
                        min={1}
                        aria-label={`Quantity for ${line.title}`}
                        tabIndex={isDrawerOpen ? 0 : -1}
                        value={line.quantity}
                        onChange={(event) => setQuantity(cartLineKey(line), Math.max(1, Number(event.target.value) || 1))}
                      />
                      <button type="button" tabIndex={isDrawerOpen ? 0 : -1} onClick={() => removeLine(cartLineKey(line))}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-drawer-footer">
              {pricingError && (
                <p className="cart-drawer-error">
                  {invalidLine ? (
                    <>
                      &ldquo;{invalidLine.title}&rdquo; is no longer available.{" "}
                      <button type="button" onClick={() => removeLine(cartLineKey(invalidLine))}>Remove it</button> to continue.
                    </>
                  ) : (
                    pricingError
                  )}
                </p>
              )}
              {pricedCart && (
                <div className="cart-drawer-subtotal">
                  <span>Subtotal</span>
                  <span>{formatPence(pricedCart.subtotalPence)}</span>
                </div>
              )}
              <p className="cart-drawer-note">Shipping and discounts calculated at checkout.</p>
              <Link href="/cart" tabIndex={isDrawerOpen ? 0 : -1} className="cart-drawer-view-cart" onClick={closeDrawer}>
                View cart
              </Link>
              <Link
                href="/checkout"
                tabIndex={isDrawerOpen ? 0 : -1}
                aria-disabled={!pricedCart}
                className={`cart-drawer-checkout${!pricedCart ? " is-disabled" : ""}`}
                onClick={(event) => { if (!pricedCart) { event.preventDefault(); return; } closeDrawer(); }}
              >
                {pricedCart ? "Checkout" : "Calculating total…"}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
