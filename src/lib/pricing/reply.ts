import type { QuoteInputs, QuoteResult } from "./engine";

/**
 * Builds the reply text shared by the template and the AI draft. Prices only
 * ever come from the pricing engine's result; the model is given these same
 * figures and the checks reject any other £ amount.
 */

export function formatPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

/** Every £ amount a draft may mention: option totals, Etsy item prices, per-unit prices, quantity breaks and postage. */
export function allowedFigures(result: QuoteResult, postagePence: number, quantity: number): number[] {
  const units = Math.max(1, quantity);
  const totals = [result.quotedPrice, ...result.options.map((option) => option.price)];
  const figures = new Set<number>([postagePence]);
  for (const total of totals) {
    for (const amount of [total, total - postagePence]) {
      figures.add(amount);
      figures.add(Math.round(amount / units));
    }
  }
  for (const quantityBreak of result.breaks) {
    figures.add(quantityBreak.price);
    figures.add(quantityBreak.perUnit);
  }
  return [...figures];
}

/** The price lines in a customer-facing form. Etsy shows item price + postage, since Etsy charges postage separately. */
export function priceLines(inputs: QuoteInputs, result: QuoteResult, postagePence: number): string[] {
  const quantity = Math.max(1, inputs.quantity);
  const each = (pence: number) => (quantity > 1 ? ` (${formatPounds(Math.round(pence / quantity))} each)` : "");
  const line = (label: string, total: number, description: string) =>
    inputs.channel === "etsy"
      ? `${label}: ${formatPounds(total - postagePence)}${each(total - postagePence)} + ${formatPounds(postagePence)} postage. ${description}`
      : `${label}: ${formatPounds(total)} including VAT and postage${each(total)}. ${description}`;

  const [standard, premium, express] = result.options;
  return [
    line("Standard", result.quotedPrice, standard.description),
    line("Premium", premium.price, premium.description),
    line("Express", express.price, express.description),
  ];
}

export function templateReply({
  customerName,
  inputs,
  result,
  postagePence,
  missingInfo,
  summary,
}: {
  customerName: string;
  inputs: QuoteInputs;
  result: QuoteResult;
  postagePence: number;
  missingInfo: string[];
  summary: string;
}): string {
  const greeting = customerName ? `Hi ${customerName.split(" ")[0]},` : "Hi there,";
  const what = summary ? ` about ${summary.charAt(0).toLowerCase()}${summary.slice(1).replace(/[.!?]+$/, "")}` : "";
  const quantity = Math.max(1, inputs.quantity);
  const lines = [
    greeting,
    "",
    `Thanks so much for getting in touch${what}! Here's what it would cost${quantity > 1 ? ` for ${quantity}` : ""}:`,
    "",
    ...priceLines(inputs, result, postagePence).map((line) => `• ${line}`),
  ];
  if (missingInfo.length) {
    lines.push("", "Before I confirm, could you let me know:", ...missingInfo.map((item) => `• ${item}`));
  }
  lines.push(
    "",
    inputs.channel === "etsy"
      ? "If you're happy to go ahead, just let me know which option suits and I'll set up a listing for you here on Etsy."
      : "If you're happy to go ahead, just let me know which option suits and I'll send over a payment link.",
    "",
    "Thanks!",
  );
  return lines.join("\n");
}
