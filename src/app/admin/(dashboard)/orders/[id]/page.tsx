import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";
import { fulfilmentStatusLabel, paymentStatusLabel } from "@/lib/order-status";
import { StatusBadge } from "../status-badge";
import { OrderStatusForm } from "./order-status-form";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price_pence: number;
  line_total_pence: number;
  product_variants: { sku: string; products: { title: string } | null } | null;
};

type Address = { line1: string; line2: string | null; city: string; postcode: string; country: string } | null;

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*, shipping_address:shipping_address_id(line1, line2, city, postcode, country)").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("id, quantity, unit_price_pence, line_total_pence, product_variants(sku, products(title))").eq("order_id", id).returns<OrderItem[]>(),
  ]);

  if (!order) notFound();
  const shippingAddress = order.shipping_address as Address;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.order_number}</h1>
          <p className="text-sm text-black/60">{new Date(order.created_at).toLocaleString("en-GB")}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge label={paymentStatusLabel(order.status)} />
          <StatusBadge label={fulfilmentStatusLabel(order.status)} />
        </div>
      </div>

      <section className="flex flex-col gap-3 border border-black/10 p-5">
        <h2 className="text-sm font-semibold">Update status</h2>
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
      </section>

      <section className="flex flex-col gap-3 border border-black/10 p-5">
        <h2 className="text-sm font-semibold">Items</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Product</th>
              <th className="py-2 pr-4 font-medium">SKU</th>
              <th className="py-2 pr-4 font-medium">Qty</th>
              <th className="py-2 pr-4 font-medium">Unit price</th>
              <th className="py-2 font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-black/5">
                <td className="py-3 pr-4">{item.product_variants?.products?.title ?? "—"}</td>
                <td className="py-3 pr-4 text-black/60">{item.product_variants?.sku ?? "—"}</td>
                <td className="py-3 pr-4 text-black/60">{item.quantity}</td>
                <td className="py-3 pr-4 text-black/60">{formatPence(item.unit_price_pence)}</td>
                <td className="py-3">{formatPence(item.line_total_pence)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-black/60">Subtotal</span>
            <span>{formatPence(order.subtotal_pence)}</span>
          </div>
          {order.discount_pence > 0 && (
            <div className="flex justify-between">
              <span className="text-black/60">Discount</span>
              <span>-{formatPence(order.discount_pence)}</span>
            </div>
          )}
          {order.gift_card_applied_pence > 0 && (
            <div className="flex justify-between">
              <span className="text-black/60">Gift card</span>
              <span>-{formatPence(order.gift_card_applied_pence)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-black/60">Shipping</span>
            <span>{formatPence(order.shipping_pence)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">VAT</span>
            <span>{formatPence(order.vat_pence)}</span>
          </div>
          <div className="flex justify-between border-t border-black/10 pt-1 font-semibold">
            <span>Total</span>
            <span>{formatPence(order.total_pence)}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 border border-black/10 p-5 text-sm">
          <h2 className="text-sm font-semibold">Customer</h2>
          <p>{order.guest_email}</p>
        </div>
        <div className="flex flex-col gap-2 border border-black/10 p-5 text-sm">
          <h2 className="text-sm font-semibold">Shipping address</h2>
          {shippingAddress ? (
            <address className="not-italic text-black/70">
              {shippingAddress.line1}
              {shippingAddress.line2 && (
                <>
                  <br />
                  {shippingAddress.line2}
                </>
              )}
              <br />
              {shippingAddress.city}, {shippingAddress.postcode}
              <br />
              {shippingAddress.country}
            </address>
          ) : (
            <p className="text-black/40">No address on file.</p>
          )}
        </div>
      </section>

      {order.internal_notes && (
        <section className="flex flex-col gap-2 border border-red-200 bg-red-50 p-5 text-sm">
          <h2 className="text-sm font-semibold text-red-700">Internal notes</h2>
          <p className="text-red-700">{order.internal_notes}</p>
        </section>
      )}

      <section className="flex flex-col gap-2 border border-black/10 p-5 text-xs text-black/50">
        <h2 className="text-sm font-semibold text-black">Payment reference</h2>
        <p>Stripe payment intent: {order.stripe_payment_intent_id ?? "—"}</p>
        <p>Stripe checkout session: {order.stripe_checkout_session_id ?? "—"}</p>
      </section>
    </div>
  );
}
