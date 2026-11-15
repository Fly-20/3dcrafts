import type { AiClient } from "@/lib/ai/provider";
import type { ExtractedSpecs } from "./checks";

/**
 * AI helpers for the New quote page (any provider, see src/lib/ai/provider.ts).
 * Callers fall back to the rule-based reader and the template reply when no
 * AI key is set.
 *
 * The model never sets a price: it reads specs out of the customer's message,
 * and it writes a reply around price lines the pricing engine produced. The
 * draft checks then reject any £ figure that isn't one of the engine's.
 */

const SPEC_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "customerName",
    "etsyUsername",
    "email",
    "summary",
    "quantity",
    "material",
    "colours",
    "pieceWidthMm",
    "pieceHeightMm",
    "pieceDepthMm",
    "deadline",
    "isLaser",
    "missingInfo",
  ],
  properties: {
    customerName: { type: "string", description: "Customer's first name (or full name) if given, else empty" },
    etsyUsername: { type: "string", description: "Etsy username if visible in the pasted text, else empty" },
    email: { type: "string", description: "Email address if given, else empty" },
    summary: { type: "string", description: "Short description of the job, under 70 characters, e.g. '30 custom keyrings with a club logo'" },
    quantity: { type: "integer", description: "Number of units wanted; 0 if not stated" },
    material: { type: "string", description: "PLA, PETG, Plywood, or empty if not stated and not obvious" },
    colours: { type: "string", description: "Colours requested, comma separated, or empty" },
    pieceWidthMm: { type: "number", description: "Size of one piece in mm (convert cm/inches); 0 if unknown" },
    pieceHeightMm: { type: "number", description: "0 if unknown" },
    pieceDepthMm: { type: "number", description: "0 if unknown" },
    deadline: { type: "string", description: "When they need it, as written, or empty" },
    isLaser: { type: "boolean", description: "True if it's a laser-cut or engraved wood/acrylic job rather than a 3D print" },
    missingInfo: {
      type: "array",
      items: { type: "string" },
      description: "Questions to ask before a firm quote, written as short customer-facing phrases (e.g. 'What size you'd like it'). Only things genuinely missing.",
    },
  },
} as const;


export async function extractSpecsWithAi(ai: AiClient, enquiry: string): Promise<ExtractedSpecs> {
  const parsed = await ai.json<Omit<ExtractedSpecs, "quantity" | "pieceWidthMm" | "pieceHeightMm" | "pieceDepthMm"> & {
    quantity: number;
    pieceWidthMm: number;
    pieceHeightMm: number;
    pieceDepthMm: number;
  }>({
    schemaName: "enquiry_specs",
    schema: SPEC_SCHEMA as unknown as Record<string, unknown>,
    system:
      "You read customer enquiries for 3DCRAFTS, a one-person 3D printing (Bambu P2S, PLA/PETG) and laser cutting/engraving (3.6 mm plywood) business in Edinburgh. Extract the job details from the message. Don't guess numbers that aren't stated.",
    prompt: `<enquiry>\n${enquiry}\n</enquiry>`,
  });
  const orNull = (value: number) => (value > 0 ? value : null);
  return {
    ...parsed,
    quantity: orNull(parsed.quantity),
    pieceWidthMm: orNull(parsed.pieceWidthMm),
    pieceHeightMm: orNull(parsed.pieceHeightMm),
    pieceDepthMm: orNull(parsed.pieceDepthMm),
  };
}

export async function draftReplyWithAi(ai: AiClient, {
  enquiry,
  channel,
  customerName,
  priceLines,
  missingInfo,
  flags,
}: {
  enquiry: string;
  channel: "etsy" | "website" | "other";
  customerName: string;
  priceLines: string[];
  missingInfo: string[];
  flags: string[];
}): Promise<string> {
  const channelRules =
    channel === "etsy"
      ? "This reply goes in an Etsy message. Etsy rules: no links, no web addresses, no email addresses, no phone numbers, and never mention our website, ordering directly, or paying any other way. If they want to go ahead, say you'll set up a listing for them here on Etsy."
      : "If they want to go ahead, say you'll send a payment link.";

  return ai.text({
    system: [
      "You draft replies to customer enquiries for 3DCRAFTS, a one-person 3D printing and laser business in Edinburgh. The owner reads and edits every draft before sending it themselves.",
      "Write in friendly, warm, plain UK English (colour, personalised, favourite), short paragraphs, no corporate phrasing, no emoji overload (one at most). Under 150 words.",
      "Prices: use ONLY the price lines given, with the £ amounts written exactly as given. Never calculate, round, total, discount or invent any other £ figure. You may list the options as bullet points.",
      "If information is missing, ask for it briefly. Don't promise delivery dates. Don't mention costs, margins, fees or how the price was worked out.",
      "Output only the message text, starting with the greeting and ending with a short sign-off such as 'Thanks!'.",
    ].join("\n"),
    prompt: [
      `<enquiry>\n${enquiry}\n</enquiry>`,
      `<customer_name>${customerName || "unknown"}</customer_name>`,
      `<price_lines>\n${priceLines.join("\n")}\n</price_lines>`,
      `<missing_info>\n${missingInfo.join("\n") || "none"}\n</missing_info>`,
      flags.length ? `<owner_notes>Points to handle carefully (don't quote these notes verbatim): ${flags.join(" ")}</owner_notes>` : "",
      `<channel_rules>${channelRules}</channel_rules>`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
}
