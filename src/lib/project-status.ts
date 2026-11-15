/** Project pipeline (HQ technical brief §6.4). Must match the check constraint in migration 0007. */
export const PROJECT_STATUSES = [
  { value: "enquiry", label: "Enquiry" },
  { value: "needs_info", label: "Needs info" },
  { value: "quoting", label: "Quoting" },
  { value: "awaiting_approval", label: "Awaiting approval" },
  { value: "quote_sent", label: "Quote sent" },
  { value: "accepted", label: "Accepted" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "in_design", label: "In design" },
  { value: "in_production", label: "In production" },
  { value: "post_processing", label: "Post-processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "review_requested", label: "Review requested" },
  { value: "completed", label: "Completed" },
  { value: "lost", label: "Lost" },
] as const;

export function projectStatusLabel(status: string) {
  return PROJECT_STATUSES.find((entry) => entry.value === status)?.label ?? status;
}

export const CHANNEL_LABELS: Record<string, string> = { etsy: "Etsy", website: "Website", other: "Other" };
