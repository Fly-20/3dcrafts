/**
 * orders.status is a single column covering both payment and fulfilment
 * state (Section 4 schema) — Shopify shows these as two separate columns,
 * so these helpers derive that view rather than adding a second status
 * column that would need to stay in sync with the first. Shared between the
 * admin orders screens and the public /track-order lookup.
 */
export const orderStatuses = ["new", "paid", "print_queue", "printing", "quality_check", "packing", "dispatched", "completed", "cancelled", "refunded"] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export function paymentStatusLabel(status: string): string {
  if (status === "cancelled") return "Cancelled";
  if (status === "refunded") return "Refunded";
  if (status === "new") return "Pending";
  return "Paid";
}

export function fulfilmentStatusLabel(status: string): string {
  switch (status) {
    case "new":
    case "paid":
      return "Unfulfilled";
    case "print_queue":
    case "printing":
    case "quality_check":
    case "packing":
      return "In progress";
    case "dispatched":
    case "completed":
      return "Fulfilled";
    case "cancelled":
    case "refunded":
      return "—";
    default:
      return status;
  }
}

export function statusDotClass(label: string): string {
  switch (label) {
    case "Paid":
    case "Fulfilled":
      return "bg-green-600";
    case "In progress":
      return "bg-amber-500";
    case "Pending":
    case "Unfulfilled":
      return "bg-black/30";
    case "Cancelled":
    case "Refunded":
      return "bg-red-600";
    default:
      return "bg-black/30";
  }
}
