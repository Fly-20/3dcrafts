import { createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { priceCart, CartPricingError, type CartItemInput } from "@/lib/cart";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Creates a Stripe Checkout Session for the cart. The cart is recalculated
 * from the database (never trusts client-submitted prices) and its priced
 * snapshot is stored in `cart_sessions` rather than embedded directly in
 * Stripe session metadata — Stripe metadata values are capped at 500
 * characters each, which a multi-item cart can easily exceed. Only the
 * small `cart_session_id` reference goes into metadata; the webhook looks
 * the snapshot up from there to create the order (see Section 6 of the
 * technical plan).
 */
export async function POST(request: Request) {
  // Stricter than /api/cart — each call creates a real Stripe Checkout Session (Section 6g).
  const rateLimit = await checkRateLimit("checkout", request, 10, 60);
  if (!rateLimit.success) return rateLimitedResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const items = body?.items as CartItemInput[] | undefined;
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ message: "Your cart is empty." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  let pricedCart;
  try {
    pricedCart = await priceCart(supabase, items, {
      discountCode: typeof body?.discountCode === "string" ? body.discountCode : undefined,
      giftCardCode: typeof body?.giftCardCode === "string" ? body.giftCardCode : undefined,
    });
  } catch (error) {
    if (error instanceof CartPricingError) return Response.json({ message: error.message }, { status: 400 });
    console.error("Cart pricing failed:", error);
    return Response.json({ message: "We couldn't price your cart. Please try again." }, { status: 500 });
  }

  const { data: cartSession, error: cartSessionError } = await supabase
    .from("cart_sessions")
    .insert({ email, cart_payload: pricedCart, discount_code_id: pricedCart.discountCodeId })
    .select("id")
    .single();

  if (cartSessionError || !cartSession) {
    console.error("Failed to persist cart session:", cartSessionError);
    return Response.json({ message: "We couldn't start checkout. Please try again." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const stripe = getStripe();

  const deductionPence = pricedCart.discountPence + pricedCart.giftCardAppliedPence;
  const coupon = deductionPence > 0 ? await stripe.coupons.create({ amount_off: deductionPence, currency: "gbp", duration: "once", name: "Order discount" }) : null;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: pricedCart.lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "gbp",
          unit_amount: item.unitPricePence,
          product_data: { name: item.productTitle, metadata: { sku: item.sku, variant_id: item.variantId } },
        },
      })),
      shipping_address_collection: { allowed_countries: ["GB"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: pricedCart.shippingRateName ?? "Shipping",
            fixed_amount: { amount: pricedCart.shippingPence, currency: "gbp" },
          },
        },
      ],
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
      metadata: { cart_session_id: cartSession.id },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Session creation failed:", error);
    return Response.json({ message: "We couldn't start checkout. Please try again." }, { status: 502 });
  }
}
