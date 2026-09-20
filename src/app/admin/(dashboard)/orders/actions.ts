"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { orderStatuses } from "@/lib/order-status";

export type OrderStatusFormState = { error?: string; success?: boolean };

export async function updateOrderStatusAction(_prevState: OrderStatusFormState, formData: FormData): Promise<OrderStatusFormState> {
  const session = await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const nextStatus = String(formData.get("status") || "");
  if (!orderId || !orderStatuses.includes(nextStatus as (typeof orderStatuses)[number])) {
    return { error: "Invalid order or status." };
  }

  const supabase = await createServerAuthClient();
  const { data: current } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  if (!current) return { error: "Order not found." };
  if (current.status === nextStatus) return { success: true };

  const { error } = await supabase.from("orders").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
  if (error) return { error: error.message };

  await supabase.from("admin_audit_log").insert({
    admin_user_id: session.userId,
    action: "order.status_changed",
    entity_type: "order",
    entity_id: orderId,
    before: { status: current.status },
    after: { status: nextStatus },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}
