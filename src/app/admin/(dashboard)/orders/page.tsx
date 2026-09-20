import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";
import { fulfilmentStatusLabel, paymentStatusLabel } from "@/lib/order-status";
import { StatusBadge } from "./status-badge";

type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  guest_email: string | null;
  total_pence: number;
  order_items: { quantity: number }[];
};

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const supabase = await createServerAuthClient();
  let request = supabase
    .from("orders")
    .select("id, order_number, created_at, status, guest_email, total_pence, order_items(quantity)")
    .order("created_at", { ascending: false });

  if (query) {
    // PostgREST's .or() filter syntax treats "," and "()" as structural, so strip them from user input rather than let them break (or alter) the filter.
    const safeQuery = query.replace(/[,()]/g, "");
    if (safeQuery) request = request.or(`order_number.ilike.%${safeQuery}%,guest_email.ilike.%${safeQuery}%`);
  }

  const { data: orders, error } = await request.returns<OrderRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <form action="/admin/orders" className="flex max-w-sm gap-2">
        <input type="search" name="q" defaultValue={query} placeholder="Search order # or email…" className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black" />
        <button type="submit" className="border border-black bg-black px-4 py-2 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600">Couldn&apos;t load orders: {error.message}</p>}

      {!error && (orders?.length ?? 0) === 0 && <p className="text-sm text-black/60">{query ? `No orders match "${query}".` : "No orders yet — they'll show up here once a payment completes."}</p>}

      {!error && (orders?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Order</th>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="py-2 pr-4 font-medium">Items</th>
              <th className="py-2 pr-4 font-medium">Total</th>
              <th className="py-2 pr-4 font-medium">Payment</th>
              <th className="py-2 font-medium">Fulfilment</th>
            </tr>
          </thead>
          <tbody>
            {orders!.map((order) => {
              const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <tr key={order.id} className="relative border-b border-black/5 hover:bg-black/[.02]">
                  <td className="py-3 pr-4 font-medium">
                    <Link href={`/admin/orders/${order.id}`} className="after:absolute after:inset-0">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-black/60">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-3 pr-4 text-black/60">{order.guest_email}</td>
                  <td className="py-3 pr-4 text-black/60">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </td>
                  <td className="py-3 pr-4">{formatPence(order.total_pence)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={paymentStatusLabel(order.status)} />
                  </td>
                  <td className="py-3">
                    <StatusBadge label={fulfilmentStatusLabel(order.status)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
