"use client";

import { useActionState } from "react";
import { updateOrderStatusAction } from "../actions";
import { orderStatuses } from "@/lib/order-status";

export function OrderStatusForm({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [state, formAction, pending] = useActionState(updateOrderStatusAction, {});

  return (
    <form action={formAction} className="flex items-end gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="flex flex-col gap-1 text-sm">
        Status
        <select name="status" defaultValue={currentStatus} className="border border-black/20 px-3 py-2">
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="border border-black bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Saving…" : "Update status"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-700">Saved.</p>}
    </form>
  );
}
