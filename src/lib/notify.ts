import { formatPence } from "./money";
import type { PricedLineItem } from "./cart";
import type { BusinessSettings } from "./business-settings";

/** Shared Resend sender, following the same raw-fetch pattern as `api/quote/route.ts`. */
export async function sendEmail(options: { to: string; subject: string; text: string; from?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — skipping email send.");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: options.from || process.env.ORDERS_FROM_EMAIL || process.env.QUOTE_FROM_EMAIL || "3DCRAFTS Orders <onboarding@resend.dev>",
      to: options.to,
      subject: options.subject,
      text: options.text,
    }),
  });

  if (!response.ok) console.error("Email delivery failed:", await response.text());
  return response.ok;
}

/** Reuses the Discord webhook notification pattern already proven in `api/quote/route.ts`. */
export async function sendDiscordNotification(options: { title: string; description: string; fields: { name: string; value: string; inline?: boolean }[]; color?: number }) {
  const discordWebhookUrl = process.env.ORDERS_DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!discordWebhookUrl) {
    console.error("No Discord webhook configured — skipping order notification.");
    return false;
  }

  const response = await fetch(`${discordWebhookUrl}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "3DCRAFTS Orders",
      allowed_mentions: { parse: [] },
      embeds: [{ title: options.title, description: options.description, color: options.color ?? 3066993, fields: options.fields }],
    }),
  });

  if (!response.ok) console.error("Discord order notification failed:", await response.text());
  return response.ok;
}

function orderLinesText(lineItems: PricedLineItem[]) {
  return lineItems.map((item) => `${item.quantity} x ${item.productTitle} (${item.sku}) — ${formatPence(item.lineTotalPence)}`).join("\n");
}

/** All products default to 20% VAT (Section 8), but vat_rate is per-product — show the rate only when every line shares one, otherwise just the amount. */
function vatRateLabel(lineItems: PricedLineItem[]): string {
  const rates = new Set(lineItems.map((item) => item.vatRate));
  if (rates.size === 1) return `${Math.round([...rates][0] * 100)}%`;
  return "mixed rates";
}

/**
 * Section 6e: standard UK VAT invoice fields on the confirmation email —
 * business name/address/VAT number, invoice/order number, and VAT shown as
 * its own line (not just folded into the total). `business` comes from
 * `business_settings` — address/VAT number lines are omitted if that
 * row hasn't been filled in yet, rather than printing a placeholder to the
 * customer.
 */
export async function sendOrderConfirmationEmail(options: {
  to: string;
  orderNumber: string;
  createdAt: Date;
  lineItems: PricedLineItem[];
  subtotalPence: number;
  discountPence: number;
  shippingPence: number;
  vatPence: number;
  totalPence: number;
  shippingAddress?: string;
  business: BusinessSettings;
}) {
  const text = [
    options.business.companyName,
    options.business.companyAddress,
    options.business.vatNumber ? `VAT registration number: ${options.business.vatNumber}` : null,
    "",
    `Invoice for order ${options.orderNumber}`,
    `Date: ${options.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    "",
    orderLinesText(options.lineItems),
    "",
    `Subtotal (inc. VAT): ${formatPence(options.subtotalPence)}`,
    options.discountPence > 0 ? `Discount: -${formatPence(options.discountPence)}` : null,
    `VAT (${vatRateLabel(options.lineItems)}) included in the above: ${formatPence(options.vatPence)}`,
    `Shipping: ${formatPence(options.shippingPence)}`,
    `Total: ${formatPence(options.totalPence)}`,
    options.shippingAddress ? `\nDelivery address:\n${options.shippingAddress}` : "",
    "\nWe'll email you again once your order ships.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return sendEmail({ to: options.to, subject: `Order confirmed — ${options.orderNumber}`, text });
}

/** Section 6a: sent when a Stripe Checkout Session expires unpaid (`checkout.session.expired`) — covers both genuine declines and plain abandonment, since Checkout doesn't distinguish the two at this point. */
export async function sendPaymentFailedEmail(options: { to: string }) {
  const text = [
    "We noticed your order wasn't completed — no payment went through, so you haven't been charged.",
    "",
    "If you'd still like to order, you're welcome to head back to the shop and check out again.",
    "",
    "If you were trying to pay and ran into trouble, just reply to this email and we'll help sort it out.",
  ].join("\n");

  return sendEmail({ to: options.to, subject: "Your order wasn't completed", text });
}

/**
 * Fraud-awareness alert for failed high-value attempts (Section 6a — a log
 * entry is enough for Phase 1, but abandoned checkouts are common enough
 * that alerting on every one would just be noise, so this only notifies
 * Discord above HIGH_VALUE_ABANDONED_CART_PENCE; smaller ones are still
 * logged to the console by the caller).
 */
export async function sendStaffFailedPaymentAlert(options: { sessionId: string; email: string | null; totalPence: number | null }) {
  const thresholdPence = Number(process.env.HIGH_VALUE_ABANDONED_CART_PENCE || 15000);
  if (options.totalPence === null || options.totalPence < thresholdPence) return false;

  return sendDiscordNotification({
    title: "High-value checkout didn't complete",
    description: `A checkout session expired without payment. Worth a look if this happens repeatedly from the same customer.`,
    color: 15158332,
    fields: [
      { name: "Amount", value: formatPence(options.totalPence), inline: true },
      { name: "Email", value: options.email ?? "unknown", inline: true },
      { name: "Stripe session", value: options.sessionId },
    ],
  });
}

export async function sendStaffNewOrderNotification(options: { orderId: string; orderNumber: string; lineItems: PricedLineItem[]; totalPence: number; customerEmail: string }) {
  const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL;
  const emailPromise = staffEmail
    ? sendEmail({
        to: staffEmail,
        subject: `New order — ${options.orderNumber}`,
        text: [`New order ${options.orderNumber} from ${options.customerEmail}`, "", orderLinesText(options.lineItems), "", `Total: ${formatPence(options.totalPence)}`, `\n${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/orders/${options.orderId}`].join("\n"),
      })
    : Promise.resolve(false);

  const discordPromise = sendDiscordNotification({
    title: `New order ${options.orderNumber}`,
    description: orderLinesText(options.lineItems).slice(0, 1024),
    fields: [
      { name: "Customer", value: options.customerEmail, inline: true },
      { name: "Total", value: formatPence(options.totalPence), inline: true },
      { name: "Order link", value: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/orders/${options.orderId}` },
    ],
  });

  await Promise.allSettled([emailPromise, discordPromise]);
}
