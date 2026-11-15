import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedSpecs } from "./checks";

/**
 * Claude helpers for the New quote page. Only used when ANTHROPIC_API_KEY is
 * set; callers fall back to the rule-based reader and the template reply.
 *
 * The model never sets a price: it reads specs out of the customer's message,
 * and it writes a reply around price lines the pricing engine produced. The
 * draft checks then reject any £ figure that isn't one of the engine's.
 *
 * Refusal fallbacks are on (`fallbacks: "default"`): if Claude Opus 5.5
 * declines, the API reruns the same request on a fallback model.
 */

const MODEL = "claude-opus-5-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

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

function textOf(message: Anthropic.Beta.BetaMessage) {
  return message.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export async function extractSpecsWithClaude(enquiry: string): Promise<ExtractedSpecs> {
  const message = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SPEC_SCHEMA } },
    system:
      "You read customer enquiries for 3DCRAFTS, a one-person 3D printing (Bambu P2S, PLA/PETG) and laser cutting/engraving (3.6 mm plywood) business in Edinburgh. Extract the job details from the message. Don't guess numbers that aren't stated.",
    messages: [{ role: "user", content: `<enquiry>\n${enquiry}\n</enquiry>` }],
  });
  if (message.stop_reason === "refusal") throw new Error("Claude declined to read this message.");
  const parsed = JSON.parse(textOf(message)) as Omit<ExtractedSpecs, "quantity" | "pieceWidthMm" | "pieceHeightMm" | "pieceDepthMm"> & {
    quantity: number;
    pieceWidthMm: number;
    pieceHeightMm: number;
    pieceDepthMm: number;
  };
  const orNull = (value: number) => (value > 0 ? value : null);
  return {
    ...parsed,
    quantity: orNull(parsed.quantity),
    pieceWidthMm: orNull(parsed.pieceWidthMm),
    pieceHeightMm: orNull(parsed.pieceHeightMm),
    pieceDepthMm: orNull(parsed.pieceDepthMm),
  };
}

export async function draftReplyWithClaude({
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

  const message = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [
      "You draft replies to customer enquiries for 3DCRAFTS, a one-person 3D printing and laser business in Edinburgh. The owner reads and edits every draft before sending it themselves.",
      "Write in friendly, warm, plain UK English (colour, personalised, favourite), short paragraphs, no corporate phrasing, no emoji overload (one at most). Under 150 words.",
      "Prices: use ONLY the price lines given, with the £ amounts written exactly as given. Never calculate, round, total, discount or invent any other £ figure. You may list the options as bullet points.",
      "If information is missing, ask for it briefly. Don't promise delivery dates. Don't mention costs, margins, fees or how the price was worked out.",
      "Output only the message text, starting with the greeting and ending with a short sign-off such as 'Thanks!'.",
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: [
          `<enquiry>\n${enquiry}\n</enquiry>`,
          `<customer_name>${customerName || "unknown"}</customer_name>`,
          `<price_lines>\n${priceLines.join("\n")}\n</price_lines>`,
          `<missing_info>\n${missingInfo.join("\n") || "none"}\n</missing_info>`,
          flags.length ? `<owner_notes>Points to handle carefully (don't quote these notes verbatim): ${flags.join(" ")}</owner_notes>` : "",
          `<channel_rules>${channelRules}</channel_rules>`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });
  if (message.stop_reason === "refusal") throw new Error("Claude declined to draft this reply.");
  return textOf(message).trim();
}
