import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PricedCart } from "@/lib/cart";
import { sendOrderConfirmationEmail, sendStaffNewOrderNotification, sendPaymentFailedEmail, sendStaffFailedPaymentAlert } from "@/lib/notify";
import { getBusinessSettings } from "@/lib/business-settings";

export const runtime = "nodejs";

/**
 * Source of truth for order creation and payment confirmation (not the
 * success-page redirect, which is not guaranteed to fire). See Section 6 of
 * the technical plan.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return Response.json({ message: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  if (!signature) return Response.json({ message: "Missing signature." }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return Response.json({ message: "Invalid signature." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Idempotency: skip events we've already processed.
  const { data: existingEvent } = await supabase.from("payment_events").select("id").eq("stripe_event_id", event.id).maybeSingle();
  if (existingEvent) return Response.json({ received: true });

  if (event.type === "checkout.session.completed") {
    await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
  } else if (event.type === "checkout.session.expired") {
    await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session, supabase);
  }

  await supabase.from("payment_events").insert({ stripe_event_id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> });

  return Response.json({ received: true });
}

type SupabaseServiceClient = ReturnType<typeof createServiceRoleClient>;

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: SupabaseServiceClient) {
  const cartSessionId = session.metadata?.cart_session_id;
  const email = session.customer_details?.email ?? session.customer_email;
  if (!cartSessionId || !email) {
    console.error("Checkout session completed without cart_session_id or email:", session.id);
    return;
  }

  const { data: cartSession, error: cartSessionError } = await supabase.from("cart_sessions").select("cart_payload").eq("id", cartSessionId).single();
  if (cartSessionError || !cartSession) {
    console.error("Could not find cart session for completed checkout:", cartSessionId, cartSessionError);
    return;
  }
  const pricedCart = cartSession.cart_payload as PricedCart;

  const { data: customer } = await supabase
    .from("customers")
    .upsert({ email, name: session.customer_details?.name ?? null }, { onConflict: "email" })
    .select("id")
    .single();

  const shippingDetails = session.collected_information?.shipping_details;
  let shippingAddressId: string | null = null;
  if (shippingDetails?.address) {
    const { data: address } = await supabase
      .from("addresses")
      .insert({
        customer_id: customer?.id ?? null,
        type: "shipping",
        line1: shippingDetails.address.line1 ?? "",
        line2: shippingDetails.address.line2,
        city: shippingDetails.address.city ?? "",
        postcode: shippingDetails.address.postal_code ?? "",
        country: shippingDetails.address.country ?? "GB",
      })
      .select("id")
      .single();
    shippingAddressId = address?.id ?? null;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customer?.id ?? null,
      guest_email: email,
      status: "paid",
      subtotal_pence: pricedCart.subtotalPence,
      discount_pence: pricedCart.discountPence,
      discount_code_id: pricedCart.discountCodeId,
      gift_card_id: pricedCart.giftCardId,
      gift_card_applied_pence: pricedCart.giftCardAppliedPence,
      shipping_pence: pricedCart.shippingPence,
      vat_pence: pricedCart.vatPence,
      total_pence: pricedCart.totalPence,
      shipping_address_id: shippingAddressId,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      stripe_checkout_session_id: session.id,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    console.error("Failed to create order from webhook:", orderError);
    return;
  }

  await supabase.from("order_items").insert(
    pricedCart.lineItems.map((item) => ({
      order_id: order.id,
      product_variant_id: item.variantId,
      quantity: item.quantity,
      unit_price_pence: item.unitPricePence,
      line_total_pence: item.lineTotalPence,
    })),
  );

  await decrementStock(supabase, order.id, pricedCart);

  if (pricedCart.discountCodeId) {
    await supabase.rpc("increment_discount_code_usage", { discount_code_id: pricedCart.discountCodeId }).then(({ error }) => {
      if (error) console.error("Failed to increment discount code usage:", error);
    });
  }
  if (pricedCart.giftCardId && pricedCart.giftCardAppliedPence > 0) {
    await supabase.rpc("decrement_gift_card_balance", { gift_card_id: pricedCart.giftCardId, amount_pence: pricedCart.giftCardAppliedPence }).then(({ error }) => {
      if (error) console.error("Failed to decrement gift card balance:", error);
    });
  }

  const shippingAddressText = shippingDetails?.address
    ? [shippingDetails.address.line1, shippingDetails.address.line2, shippingDetails.address.city, shippingDetails.address.postal_code].filter(Boolean).join(", ")
    : undefined;

  const business = await getBusinessSettings(supabase);

  await Promise.allSettled([
    sendOrderConfirmationEmail({
      to: email,
      orderNumber: order.order_number,
      createdAt: new Date(),
      lineItems: pricedCart.lineItems,
      subtotalPence: pricedCart.subtotalPence,
      discountPence: pricedCart.discountPence,
      shippingPence: pricedCart.shippingPence,
      vatPence: pricedCart.vatPence,
      totalPence: pricedCart.totalPence,
      shippingAddress: shippingAddressText,
      business,
    }),
    sendStaffNewOrderNotification({ orderId: order.id, orderNumber: order.order_number, lineItems: pricedCart.lineItems, totalPence: pricedCart.totalPence, customerEmail: email }),
  ]);
}

/** Section 6a: the customer sees "Thank you" only after a real payment — an expired-unpaid session (abandoned or a card that never got resubmitted) needs its own notification, not silence. */
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session, supabase: SupabaseServiceClient) {
  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const cartSessionId = session.metadata?.cart_session_id;

  let totalPence: number | null = null;
  if (cartSessionId) {
    const { data: cartSession } = await supabase.from("cart_sessions").select("cart_payload").eq("id", cartSessionId).maybeSingle();
    totalPence = (cartSession?.cart_payload as PricedCart | undefined)?.totalPence ?? null;
  }

  console.warn(`Checkout session expired without payment: ${session.id}`, { email, totalPence });

  await Promise.allSettled([
    email ? sendPaymentFailedEmail({ to: email }) : Promise.resolve(false),
    sendStaffFailedPaymentAlert({ sessionId: session.id, email, totalPence }),
  ]);
}

/** Atomic conditional stock decrement (Section 6b) — flags the order for manual review on oversell instead of failing, since payment is already captured. */
async function decrementStock(supabase: SupabaseServiceClient, orderId: string, pricedCart: PricedCart) {
  for (const item of pricedCart.lineItems) {
    if (item.fulfilmentType !== "stock") continue;

    const { data, error } = await supabase.rpc("decrement_variant_stock", { variant_id: item.variantId, qty: item.quantity }).select();
    const succeeded = !error && Array.isArray(data) && data.length > 0;
    if (!succeeded) {
      console.error(`Stock oversell detected for variant ${item.variantId} on order ${orderId} — flagging for manual review.`);
      await supabase
        .from("orders")
        .update({ internal_notes: `OVERSELL: insufficient stock for variant ${item.variantId} (sku ${item.sku}), qty ${item.quantity}. Needs manual review.` })
        .eq("id", orderId);
    }
  }
}
