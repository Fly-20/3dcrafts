import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { fulfilmentStatusLabel, paymentStatusLabel } from "@/lib/order-status";

export const runtime = "nodejs";

type OrderLookupRow = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_pence: number;
  guest_email: string | null;
  order_items: { quantity: number; product_variants: { products: { title: string } | null } | null }[];
};

/**
 * Guest order lookup (Section 6c) — order_number + the email used at
 * checkout, nothing else. `orders` has no public RLS read policy (only
 * admins can select it directly), so this goes through the service role
 * key and returns only what a customer needs to see their status, not the
 * full order row. Tightly rate-limited (6g) since this is exactly the kind
 * of endpoint that invites enumeration attempts.
 */
export async function POST(request: Request) {
  const rateLimit = await checkRateLimit("track-order", request, 10, 60);
  if (!rateLimit.success) return rateLimitedResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim().toUpperCase() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!orderNumber || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ message: "Enter your order number and the email used at checkout." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, created_at, total_pence, guest_email, order_items(quantity, product_variants(products(title)))")
    .eq("order_number", orderNumber)
    .ilike("guest_email", email)
    .maybeSingle()
    .returns<OrderLookupRow | null>();

  if (!order) {
    return Response.json({ message: "We couldn't find an order with that number and email." }, { status: 404 });
  }

  return Response.json({
    orderNumber: order.order_number,
    createdAt: order.created_at,
    totalPence: order.total_pence,
    paymentStatus: paymentStatusLabel(order.status),
    fulfilmentStatus: fulfilmentStatusLabel(order.status),
    items: order.order_items.map((item) => ({ title: item.product_variants?.products?.title ?? "Item", quantity: item.quantity })),
  });
}
