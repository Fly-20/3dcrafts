import { createServiceRoleClient } from "@/lib/supabase/server";
import { priceCart, CartPricingError, type CartItemInput } from "@/lib/cart";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Server-side cart pricing preview — the same pricing logic /api/checkout uses, so the cart page never has to trust client-side maths. */
export async function POST(request: Request) {
  // Generous limit — the cart page calls this on every quantity/discount-code edit — but still bounds discount-code brute-forcing (Section 6g).
  const rateLimit = await checkRateLimit("cart", request, 30, 60);
  if (!rateLimit.success) return rateLimitedResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const items = body?.items as CartItemInput[] | undefined;
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ message: "Your cart is empty." }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const pricedCart = await priceCart(supabase, items, {
      discountCode: typeof body?.discountCode === "string" ? body.discountCode : undefined,
      giftCardCode: typeof body?.giftCardCode === "string" ? body.giftCardCode : undefined,
    });
    return Response.json(pricedCart);
  } catch (error) {
    if (error instanceof CartPricingError) return Response.json({ message: error.message }, { status: 400 });
    console.error("Cart pricing failed:", error);
    return Response.json({ message: "We couldn't price your cart. Please try again." }, { status: 500 });
  }
}
