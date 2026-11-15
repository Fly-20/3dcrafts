import type { AiClient } from "@/lib/ai/provider";
import { EMPTY_QUOTE_INPUTS, priceQuote, type Channel, type QuoteInputs, type QuoteResult } from "@/lib/pricing/engine";
import type { PricingSettings } from "@/lib/pricing/settings";
import { checkDraft, extractSpecsWithRules, type DraftIssue } from "@/lib/pricing/checks";
import { allowedFigures, formatPounds, priceLines, templateReply } from "@/lib/pricing/reply";
import { SHOP_FACTS } from "./shop-facts";

/**
 * The enquiry assistant. For a conversation with a customer it works out
 * what's known, what's missing and what to do next (ask, quote, confirm or
 * decline), then drafts the next reply for the owner to approve and send.
 *
 * Prices only ever come from the pricing engine: either the latest saved
 * quote, or the engine run on the assistant's rough estimate of filament,
 * print time and labour (shown to the owner as an estimate to check).
 * Nothing here sends anything.
 *
 * Pure apart from the AI call, which is passed in, so tests can use a fake.
 */

export type ThreadMessage = { direction: "in" | "out" | "note"; body: string; created_at?: string };

export type NextStep = "ask_customer" | "send_quote" | "confirm_order" | "decline";

export const NEXT_STEP_LABELS: Record<NextStep, string> = {
  ask_customer: "Ask the customer first",
  send_quote: "Ready to quote",
  confirm_order: "Customer wants to go ahead",
  decline: "Suggest declining",
};

/** Status to suggest once the owner has sent the draft: a "quote" reply with no price in it is really still gathering details. */
export function statusAfterSending(nextStep: NextStep, draftHasPrice: boolean): string {
  if (nextStep === "send_quote" && !draftHasPrice) return "needs_info";
  return STATUS_AFTER_SENDING[nextStep];
}

/** Status to move the project to once the owner sends a reply of this kind. */
export const STATUS_AFTER_SENDING: Record<NextStep, string> = {
  ask_customer: "needs_info",
  send_quote: "quote_sent",
  confirm_order: "accepted",
  decline: "lost",
};

export type Estimate = {
  printGrams: number;
  printHours: number;
  laserMinutes: number;
  plywoodAreaCm2: number;
  labourMinutes: number;
  designHours: number;
};

export type Analysis = {
  customerName: string;
  etsyUsername: string;
  email: string;
  title: string;
  summary: string;
  quantity: number;
  material: string;
  colours: string;
  pieceWidthMm: number;
  pieceHeightMm: number;
  pieceDepthMm: number;
  deadline: string;
  isLaser: boolean;
  hasFile: boolean;
  needsDesign: boolean;
  quoteListingOrdered: boolean;
  nextStep: NextStep;
  reason: string;
  customerAsked: string[];
  questions: string[];
  ownerTasks: string[];
  risks: string[];
  estimate: Estimate;
};

const NEXT_STEPS: NextStep[] = ["ask_customer", "send_quote", "confirm_order", "decline"];
const EMPTY_ESTIMATE: Estimate = { printGrams: 0, printHours: 0, laserMinutes: 0, plywoodAreaCm2: 0, labourMinutes: 0, designHours: 0 };

const stringList = { type: "array", items: { type: "string" } } as const;

export const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "customerName",
    "etsyUsername",
    "email",
    "title",
    "summary",
    "quantity",
    "material",
    "colours",
    "pieceWidthMm",
    "pieceHeightMm",
    "pieceDepthMm",
    "deadline",
    "isLaser",
    "hasFile",
    "needsDesign",
    "quoteListingOrdered",
    "nextStep",
    "reason",
    "customerAsked",
    "questions",
    "ownerTasks",
    "risks",
    "estimate",
  ],
  properties: {
    customerName: { type: "string", description: "Customer's name as they sign off, else empty" },
    etsyUsername: { type: "string", description: "Etsy username if visible, else empty" },
    email: { type: "string", description: "Email address if given, else empty" },
    title: { type: "string", description: "Short job title under 60 characters, e.g. 'Baby monitor mount (custom design)'" },
    summary: { type: "string", description: "Two or three sentences for the owner: what they want and where the conversation is up to" },
    quantity: { type: "integer", description: "Units wanted; 1 if clearly a single item; 0 if unknown" },
    material: { type: "string", description: "PLA, PETG, Plywood, or empty" },
    colours: { type: "string", description: "Colours wanted, or empty" },
    pieceWidthMm: { type: "number", description: "Size of one finished piece in mm (convert cm/inches); 0 if unknown" },
    pieceHeightMm: { type: "number" },
    pieceDepthMm: { type: "number" },
    deadline: { type: "string", description: "When they need it, as written, or empty" },
    isLaser: { type: "boolean", description: "Laser cut/engraved wood rather than a 3D print" },
    hasFile: { type: "boolean", description: "They have shared (or linked) a ready 3D file or model page" },
    needsDesign: { type: "boolean", description: "We'd need to design or modify the model" },
    quoteListingOrdered: { type: "boolean", description: "The conversation or an owner note says they ordered the £1 quote listing" },
    nextStep: {
      type: "string",
      enum: NEXT_STEPS,
      description:
        "ask_customer: something essential is missing to price it. send_quote: enough is known to give a price now (minor details like colour can be asked in the same reply). confirm_order: they've accepted a quote and want to go ahead. decline: we shouldn't take it on.",
    },
    reason: { type: "string", description: "One sentence for the owner explaining the next step" },
    customerAsked: { ...stringList, description: "Questions the customer asked us that the reply must answer" },
    questions: { ...stringList, description: "Questions to ask the customer, customer-facing, at most 4, only what's needed" },
    ownerTasks: { ...stringList, description: "Things the owner must do or decide, e.g. 'Download the 5 files and slice them at 50% scale'" },
    risks: { ...stringList, description: "Size, copyright/trademark, safety, food-contact or children's-item concerns, one line each" },
    estimate: {
      type: "object",
      additionalProperties: false,
      required: ["printGrams", "printHours", "laserMinutes", "plywoodAreaCm2", "labourMinutes", "designHours"],
      description: "Rough first estimate for the WHOLE order so a price can be worked out; the owner checks it. 0 where it can't be guessed.",
      properties: {
        printGrams: { type: "number" },
        printHours: { type: "number" },
        laserMinutes: { type: "number" },
        plywoodAreaCm2: { type: "number" },
        labourMinutes: { type: "number", description: "Setup, finishing and packing; at least 10 for any job" },
        designHours: { type: "number", description: "Modelling time if needed: simple 0.5, moderate 2, complex 5 (per design)" },
      },
    },
  },
} as const;

/** Lays the conversation out for the model, oldest first. */
export function formatThread(thread: ThreadMessage[]): string {
  const who = { in: "Customer", out: "Us (sent)", note: "Owner note (not seen by customer)" };
  return thread.map((message, index) => `<message n="${index + 1}" from="${who[message.direction]}">\n${message.body.trim()}\n</message>`).join("\n");
}

const ANALYSIS_SYSTEM = `You help the owner of 3DCRAFTS handle customer enquiries. Read the whole conversation and decide what should happen next.

<shop_facts>
${SHOP_FACTS}
</shop_facts>

How to decide:
- Quote as soon as you reasonably can. Prefer send_quote with a question or two folded in (e.g. colour) over holding the price back for small details.
- Use ask_customer only when something essential is missing: we don't know what to make (no file, photo or clear description), or the size or quantity is unknown and changes the price a lot.
- If they say they have a file but haven't shared it, ask them to share it (on Etsy: a Google Drive link).
- If the file is on Google Drive, MakerWorld, Printables or similar, you can't open it: estimate from what they say, and add an owner task to download and slice it.
- Check sizes against the 256 mm printer limit and say what's possible (sections, scaling).
- Fill customerAsked with every direct question they asked, so the reply answers each one.
- Questions must be friendly and customer-facing. Owner tasks are for the owner (checks, slicing, licences, decisions not covered by the shop facts).
- The estimate is a rough first guess for the whole order (PLA is about 1.24 g per cm3 of solid plastic; typical prints are 15-20% infill with walls, so roughly a third of the solid weight). A 25 mm figurine is about 5 g and 0.5 h. Give 0 where you can't guess.
- Don't invent facts about the shop. Never set prices.`;

export async function analyseWithAi(ai: AiClient, thread: ThreadMessage[], channel: Channel): Promise<Analysis> {
  const raw = await ai.json<Analysis>({
    schemaName: "enquiry_analysis",
    schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
    system: ANALYSIS_SYSTEM,
    prompt: `<channel>${channel}</channel>\n<conversation>\n${formatThread(thread)}\n</conversation>`,
  });
  return normaliseAnalysis(raw);
}

/** Cleans up whatever came back (or was stored) into a well-formed analysis. */
export function normaliseAnalysis(raw: unknown): Analysis {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const text = (key: string, max = 300) => String(source[key] ?? "").trim().slice(0, max);
  const number = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };
  const list = (key: string, max = 8) => (Array.isArray(source[key]) ? (source[key] as unknown[]).map((item) => String(item).trim().slice(0, 300)).filter(Boolean).slice(0, max) : []);
  const estimateSource = (source.estimate && typeof source.estimate === "object" ? source.estimate : {}) as Record<string, unknown>;
  const estimate = Object.fromEntries(Object.keys(EMPTY_ESTIMATE).map((key) => [key, number(estimateSource[key])])) as Estimate;
  const nextStep = NEXT_STEPS.includes(source.nextStep as NextStep) ? (source.nextStep as NextStep) : "ask_customer";
  return {
    customerName: text("customerName", 100),
    etsyUsername: text("etsyUsername", 100).replace(/^@/, ""),
    email: text("email", 200),
    title: text("title", 80),
    summary: text("summary", 800),
    quantity: Math.round(number(source.quantity)),
    material: text("material", 40),
    colours: text("colours", 120),
    pieceWidthMm: number(source.pieceWidthMm),
    pieceHeightMm: number(source.pieceHeightMm),
    pieceDepthMm: number(source.pieceDepthMm),
    deadline: text("deadline", 120),
    isLaser: source.isLaser === true,
    hasFile: source.hasFile === true,
    needsDesign: source.needsDesign === true,
    quoteListingOrdered: source.quoteListingOrdered === true,
    nextStep,
    reason: text("reason", 400),
    customerAsked: list("customerAsked"),
    questions: list("questions", 5),
    ownerTasks: list("ownerTasks"),
    risks: list("risks"),
    estimate,
  };
}

const FILE_PATTERN = /\b(stl|3mf|obj|step)\b|makerworld|printables|thingiverse|drive\.google|dropbox|attached/i;
const DESIGN_PATTERN = /\b(design|model) (it|this|one|something)|don'?t have (an? |the )?(stl|file)|no (stl|file)|from (a |my )?(photo|picture|sketch|drawing)s?|create (a |the )?(design|model)/i;

/** Without an AI key: a rough reading of the customer's messages by simple rules. */
export function analyseWithRules(thread: ThreadMessage[]): Analysis {
  const customerText = thread.filter((message) => message.direction === "in").map((message) => message.body).join("\n\n");
  const notes = thread.filter((message) => message.direction === "note").map((message) => message.body).join("\n");
  const specs = extractSpecsWithRules(customerText);
  const hasFile = FILE_PATTERN.test(customerText) && !/(don'?t|do not) have (an? |the |any )?(stl|3d file|file)|no (stl|3d file)/i.test(customerText);
  const needsDesign = DESIGN_PATTERN.test(customerText);
  // Short answers in later replies ("just 1 please", "no rush") count as answered.
  const singleUnit = /\b(?:just|only)\s+(?:1|one)\b|\b(?:1|one)\s+please\b/i.test(customerText);
  const noDeadline = /\bno rush\b|\bwhenever\b|\bno hurry\b/i.test(customerText);
  const questions = specs.missingInfo.filter(
    (item) =>
      !(hasFile && /file, photo or sketch/.test(item)) && !(hasFile && /size/.test(item)) && !(singleUnit && /How many/.test(item)) && !(noDeadline && /When you need/.test(item)),
  );
  const ownerTasks: string[] = [];
  if (hasFile) ownerTasks.push("Download and slice their file, then enter the grams and print time in a quote");
  if (needsDesign) ownerTasks.push("Estimate the design time");
  const sentQuote = thread.some((message) => message.direction === "out" && /£\d/.test(message.body));
  const lastCustomer = [...thread].reverse().find((message) => message.direction === "in")?.body ?? "";
  const accepted = sentQuote && /\b(go ahead|yes please|happy to proceed|let'?s do it|i'?ll take|sounds (good|great))\b/i.test(lastCustomer);
  const nextStep: NextStep = accepted ? "confirm_order" : questions.length > 1 && !hasFile ? "ask_customer" : "send_quote";
  return normaliseAnalysis({
    ...specs,
    title: "",
    quantity: specs.quantity ?? (singleUnit ? 1 : 0),
    hasFile,
    needsDesign,
    quoteListingOrdered: /£\s?1\b|quote listing/i.test(notes),
    nextStep,
    reason: "Read by simple rules (no AI key set): check it.",
    questions,
    ownerTasks,
    estimate: EMPTY_ESTIMATE,
  });
}

/** Quote inputs from the assistant's estimate, or null if it has nothing to price. */
export function estimateInputs(analysis: Analysis, channel: Channel): QuoteInputs | null {
  const { estimate } = analysis;
  const printing = estimate.printGrams > 0 && estimate.printHours > 0;
  const laser = estimate.laserMinutes > 0;
  if (!printing && !laser && estimate.designHours <= 0) return null;
  return {
    ...EMPTY_QUOTE_INPUTS,
    channel,
    quantity: Math.max(1, analysis.quantity || 1),
    material: analysis.material || (analysis.isLaser ? "Plywood" : "PLA"),
    printGrams: estimate.printGrams,
    printHours: estimate.printHours,
    laserMinutes: estimate.laserMinutes,
    plywoodAreaCm2: estimate.plywoodAreaCm2,
    pieceWidthMm: analysis.pieceWidthMm,
    pieceHeightMm: analysis.pieceHeightMm,
    pieceDepthMm: analysis.pieceDepthMm,
    labourMinutes: Math.max(estimate.labourMinutes, 10),
    designHours: estimate.designHours,
  };
}

export type PriceSource = { kind: "quote"; version: number } | { kind: "estimate" };

export type Pricing = { inputs: QuoteInputs; result: QuoteResult; source: PriceSource };

/**
 * The price a reply may use: the latest saved quote (recomputed from its
 * stored inputs and settings, so it matches to the penny) or, before any
 * quote is saved, the engine run on the assistant's estimate.
 */
export function pricingFor({
  settings,
  channel,
  analysis,
  latestQuote,
}: {
  settings: PricingSettings;
  channel: Channel;
  analysis: Analysis;
  latestQuote: { version: number; inputs: QuoteInputs; settings: PricingSettings } | null;
}): Pricing | null {
  if (latestQuote) return { inputs: latestQuote.inputs, result: priceQuote(latestQuote.settings, latestQuote.inputs), source: { kind: "quote", version: latestQuote.version } };
  const inputs = estimateInputs(analysis, channel);
  if (!inputs) return null;
  return { inputs, result: priceQuote(settings, inputs), source: { kind: "estimate" } };
}

/** Every £ figure the draft may contain: the quote's figures, plus the £1 quote listing on Etsy. */
export function draftAllowedFigures(pricing: Pricing | null, settings: PricingSettings, channel: Channel): number[] {
  const postagePence = Math.round(settings.postage * 100);
  const figures = pricing ? allowedFigures(pricing.result, postagePence, pricing.inputs.quantity) : [];
  if (channel === "etsy") figures.push(Math.round(settings.quoteListingFee * 100));
  return figures;
}

function channelRules(channel: Channel, settings: PricingSettings) {
  return channel === "etsy"
    ? `This reply goes in an Etsy message. Etsy rules: no links, no web addresses, no email addresses, no phone numbers, and never mention our website, ordering directly, or paying any other way. If they want to go ahead, say you'll set up a listing for them here on Etsy. The quote listing is ${formatPounds(Math.round(settings.quoteListingFee * 100))}.`
    : "If they want to go ahead, say you'll send a payment link.";
}

const DRAFT_SYSTEM = `You draft the next reply to a customer for the owner of 3DCRAFTS, who reads and edits every draft and sends it themselves.

<shop_facts>
${SHOP_FACTS}
</shop_facts>

Style: friendly, warm, plain UK English (colour, personalised, favourite), short paragraphs, no corporate phrasing, at most one emoji. Keep it as short as the content allows (usually under 170 words). Open by thanking them for their message (or for ordering the quote listing, if they have).
Content:
- Answer every question in <customer_asked> honestly from the shop facts. If the facts don't cover something, say you'll check and come back to them rather than promising.
- Ask the questions in <questions_to_ask>, briefly, as a short list if there are several.
- Prices: use ONLY the price lines given, with every £ amount written exactly as given. Never calculate, round, total, discount or invent any other £ figure. If there are no price lines, don't mention any price. If the price is marked as a rough guide, present it as a rough guide ("from around"), not a firm quote.
- Don't promise delivery dates. Don't mention costs, margins, fees or how the price was worked out. Don't repeat the owner's notes or tasks verbatim.
- Output only the message text, starting with the greeting and ending with a short sign-off such as "Thanks!".`;

export async function draftWithAi(
  ai: AiClient,
  {
    thread,
    channel,
    analysis,
    lines,
    roughGuide,
    instructions,
    settings,
  }: { thread: ThreadMessage[]; channel: Channel; analysis: Analysis; lines: string[]; roughGuide: boolean; instructions: string; settings: PricingSettings },
): Promise<string> {
  return ai.text({
    system: DRAFT_SYSTEM,
    prompt: [
      `<conversation>\n${formatThread(thread)}\n</conversation>`,
      `<customer_name>${analysis.customerName || "unknown"}</customer_name>`,
      `<next_step>${analysis.nextStep}: ${NEXT_STEP_LABELS[analysis.nextStep]}. ${analysis.reason}</next_step>`,
      `<customer_asked>\n${analysis.customerAsked.join("\n") || "none"}\n</customer_asked>`,
      `<questions_to_ask>\n${analysis.questions.join("\n") || "none"}\n</questions_to_ask>`,
      lines.length ? `<price_lines${roughGuide ? ' kind="rough guide, to be confirmed"' : ""}>\n${lines.join("\n")}\n</price_lines>` : "<price_lines>none: don't mention a price</price_lines>",
      analysis.risks.length ? `<points_to_handle_carefully>\n${analysis.risks.join("\n")}\n</points_to_handle_carefully>` : "",
      analysis.quoteListingOrdered ? "<note>They have ordered the quote listing: thank them for it.</note>" : "",
      instructions ? `<owner_instructions>\n${instructions}\n</owner_instructions>` : "",
      `<channel_rules>${channelRules(channel, settings)}</channel_rules>`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
}

/** Without an AI key: a plain reply built from the analysis and the engine's price lines. */
export function templateDraft({
  analysis,
  channel,
  pricing,
  settings,
}: {
  analysis: Analysis;
  channel: Channel;
  pricing: Pricing | null;
  settings: PricingSettings;
}): string {
  const name = analysis.customerName.split(" ")[0];
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const thanks = analysis.quoteListingOrdered ? "Thanks so much for ordering the quote listing!" : "Thanks so much for your message!";
  const goAhead = channel === "etsy" ? "I'll set up a listing for you here on Etsy" : "I'll send over a payment link";
  const postagePence = Math.round(settings.postage * 100);

  if (analysis.nextStep === "decline") {
    return [greeting, "", `${thanks} Unfortunately this isn't something I'm able to make, so I'm sorry I can't help this time.`, "", "Thanks!"].join("\n");
  }
  if (analysis.nextStep === "confirm_order") {
    return [greeting, "", `Brilliant, thank you! ${goAhead} shortly, and I'll get started as soon as it's ordered.`, "", "Thanks!"].join("\n");
  }
  if (analysis.nextStep === "send_quote" && pricing) {
    return templateReply({ customerName: analysis.customerName, inputs: pricing.inputs, result: pricing.result, postagePence, missingInfo: analysis.questions, summary: "" });
  }
  if (!analysis.questions.length) {
    return [greeting, "", `${thanks} I'll take a proper look at this and come back to you with a price shortly.`, "", "Thanks!"].join("\n");
  }
  const questions = analysis.questions;
  return [greeting, "", `${thanks} I'd love to help. So I can give you an accurate price, could you let me know:`, ...questions.map((item) => `• ${item}`), "", "Thanks!"].join("\n");
}

export type Draft = { text: string; issues: DraftIssue[]; allowed: number[]; source: "ai" | "template"; priceSource: PriceSource | null; lines: string[] };

/** Builds the draft (AI or template) and runs the draft checks on it. */
export async function buildDraft({
  ai,
  thread,
  channel,
  analysis,
  pricing,
  settings,
  instructions = "",
}: {
  ai: AiClient | null;
  thread: ThreadMessage[];
  channel: Channel;
  analysis: Analysis;
  pricing: Pricing | null;
  settings: PricingSettings;
  instructions?: string;
}): Promise<Draft> {
  const postagePence = Math.round(settings.postage * 100);
  // Price lines only when quoting, or as a rough guide when they asked about cost.
  const askedPrice = analysis.customerAsked.some((question) => /cost|price|how much|charge|quote/i.test(question));
  const showPrice = pricing && analysis.nextStep !== "decline" && (analysis.nextStep !== "ask_customer" || askedPrice);
  const lines = showPrice ? priceLines(pricing.inputs, pricing.result, postagePence) : [];
  const roughGuide = Boolean(showPrice && (analysis.nextStep === "ask_customer" || pricing.source.kind === "estimate"));
  const allowed = draftAllowedFigures(pricing, settings, channel);

  let text: string;
  let source: Draft["source"] = "template";
  if (ai) {
    text = (await draftWithAi(ai, { thread, channel, analysis, lines, roughGuide, instructions, settings })).trim();
    source = "ai";
  } else {
    text = templateDraft({ analysis, channel, pricing: showPrice ? pricing : null, settings });
  }
  return { text, issues: checkDraft(text, channel, allowed), allowed, source, priceSource: showPrice ? pricing.source : null, lines };
}
