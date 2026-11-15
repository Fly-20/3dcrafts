"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { findCustomer } from "@/lib/crm/customers";
import { getPricingSettings } from "@/lib/pricing/store";
import { EMPTY_QUOTE_INPUTS, priceQuote, type Channel, type QuoteInputs } from "@/lib/pricing/engine";
import { checkDraft, extractSpecsWithRules, flagMessage, type DraftIssue, type ExtractedSpecs, type Flag } from "@/lib/pricing/checks";
import { allowedFigures, priceLines, templateReply } from "@/lib/pricing/reply";
import { draftReplyWithAi, extractSpecsWithAi } from "@/lib/pricing/ai";
import { getAiClient } from "@/lib/ai/provider";
import { PROJECT_STATUSES } from "@/lib/project-status";

const MAX_ENQUIRY_LENGTH = 20_000;
const CHANNELS: Channel[] = ["etsy", "website", "other"];

function readChannel(value: unknown): Channel {
  return CHANNELS.includes(value as Channel) ? (value as Channel) : "other";
}

/** Rebuilds QuoteInputs from untrusted client data: only known keys, only finite non-negative numbers. */
function readInputs(raw: unknown): QuoteInputs {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const number = (key: keyof QuoteInputs) => {
    const value = Number(source[key]);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  };
  const override = Number(source.priceOverride);
  return {
    ...EMPTY_QUOTE_INPUTS,
    channel: readChannel(source.channel),
    quantity: Math.max(1, Math.round(number("quantity"))),
    material: String(source.material ?? "").slice(0, 40),
    printGrams: number("printGrams"),
    printHours: number("printHours"),
    laserMinutes: number("laserMinutes"),
    plywoodAreaCm2: number("plywoodAreaCm2"),
    pieceWidthMm: number("pieceWidthMm"),
    pieceHeightMm: number("pieceHeightMm"),
    pieceDepthMm: number("pieceDepthMm"),
    labourMinutes: number("labourMinutes"),
    designHours: number("designHours"),
    priceOverride: source.priceOverride !== null && source.priceOverride !== "" && Number.isFinite(override) && override > 0 ? override : null,
  };
}

export type ReadEnquiryResult = { specs?: ExtractedSpecs; flags?: Flag[]; source?: "ai" | "rules"; notice?: string; error?: string };

/** Pulls specs and missing info out of a pasted message (AI if configured, else simple rules) and flags risky requests. */
export async function readEnquiry(enquiry: string): Promise<ReadEnquiryResult> {
  await requireAdmin();
  const text = String(enquiry ?? "").trim().slice(0, MAX_ENQUIRY_LENGTH);
  if (!text) return { error: "Paste the customer's message first." };

  const flags = flagMessage(text);
  const ai = getAiClient();
  if (ai) {
    try {
      return { specs: await extractSpecsWithAi(ai, text), flags, source: "ai" };
    } catch (error) {
      console.error("AI extraction failed", error);
      return { specs: extractSpecsWithRules(text), flags, source: "rules", notice: `${ai.label} couldn't read the message, so simple rules were used. Check the details.` };
    }
  }
  return { specs: extractSpecsWithRules(text), flags, source: "rules" };
}

export type DraftReplyResult = { text?: string; issues?: DraftIssue[]; allowed?: number[]; source?: "ai" | "template"; notice?: string; error?: string };

/**
 * Drafts the reply. Prices are recomputed here from the inputs and the stored
 * settings, never taken from the browser or the model, then the §5.2 checks
 * run on whatever text comes back.
 */
export async function draftReply(payload: {
  enquiry: string;
  customerName: string;
  summary: string;
  missingInfo: string[];
  inputs: unknown;
}): Promise<DraftReplyResult> {
  await requireAdmin();
  const supabase = await createServerAuthClient();
  const { settings } = await getPricingSettings(supabase);
  const inputs = readInputs(payload.inputs);
  const result = priceQuote(settings, inputs);
  const postagePence = Math.round(settings.postage * 100);
  const missingInfo = (Array.isArray(payload.missingInfo) ? payload.missingInfo : []).map(String).filter(Boolean).slice(0, 10);
  const customerName = String(payload.customerName ?? "").slice(0, 100);
  const enquiry = String(payload.enquiry ?? "").slice(0, MAX_ENQUIRY_LENGTH);
  const allowed = allowedFigures(result, postagePence, inputs.quantity);

  const fallback = () => templateReply({ customerName, inputs, result, postagePence, missingInfo, summary: String(payload.summary ?? "").slice(0, 100) });

  let text: string;
  let source: "ai" | "template" = "template";
  let notice: string | undefined;
  const ai = getAiClient();
  if (ai && enquiry.trim()) {
    try {
      text = await draftReplyWithAi(ai, {
        enquiry,
        channel: inputs.channel,
        customerName,
        priceLines: priceLines(inputs, result, postagePence),
        missingInfo,
        flags: flagMessage(enquiry).map((flag) => flag.message),
      });
      source = "ai";
    } catch (error) {
      console.error("AI draft failed", error);
      text = fallback();
      notice = `${ai.label} couldn't draft a reply, so the template was used.`;
    }
  } else {
    text = fallback();
  }

  return { text, issues: checkDraft(text, inputs.channel, allowed), allowed, source, notice };
}

export type SaveQuoteResult = { error?: string };

/** Saves customer + project + quote version + options. Nothing is sent to the customer. */
export async function saveQuote(payload: {
  projectId?: string;
  enquiry: string;
  title: string;
  customerName: string;
  etsyUsername: string;
  email: string;
  specs: unknown;
  inputs: unknown;
  draftReply: string;
}): Promise<SaveQuoteResult> {
  const session = await requireAdmin();
  const supabase = await createServerAuthClient();

  const enquiry = String(payload.enquiry ?? "").trim().slice(0, MAX_ENQUIRY_LENGTH);
  const customerName = String(payload.customerName ?? "").trim().slice(0, 100);
  const etsyUsername = String(payload.etsyUsername ?? "").trim().replace(/^@/, "").slice(0, 100);
  const email = String(payload.email ?? "").trim().slice(0, 200);
  const draft = String(payload.draftReply ?? "").slice(0, 10_000);
  if (!enquiry) return { error: "Paste the customer's message first." };
  if (!customerName && !etsyUsername && !email) return { error: "Add the customer's name, Etsy username or email so the quote can be found again." };
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: "That email address doesn't look right." };

  const { settings, stored } = await getPricingSettings(supabase);
  if (!stored) return { error: "The CRM tables aren't set up yet: migration 0007 needs to be applied before quotes can be saved." };

  const inputs = readInputs(payload.inputs);
  const result = priceQuote(settings, inputs);
  if (result.warnings.some((warning) => warning.level === "block")) return { error: "This quote is below cost. Change the price before saving." };
  const issues = draft ? checkDraft(draft, inputs.channel, allowedFigures(result, Math.round(settings.postage * 100), inputs.quantity)) : [];
  const title = String(payload.title ?? "").trim().slice(0, 120) || enquiry.split("\n")[0].slice(0, 80);
  const specs = payload.specs && typeof payload.specs === "object" ? payload.specs : {};

  let projectId = payload.projectId ? String(payload.projectId) : null;
  if (!projectId) {
    let customerId: string;
    try {
      customerId = await findCustomer(supabase, { email, customerName, etsyUsername, channel: inputs.channel });
    } catch {
      return { error: "Couldn't save the customer record." };
    }
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ customer_id: customerId, channel: inputs.channel, status: "quoting", title, enquiry_text: enquiry, specs: { ...specs, flags: flagMessage(enquiry) } })
      .select("id")
      .single();
    if (error || !project) return { error: error?.message || "Couldn't save the enquiry." };
    projectId = project.id as string;
    // The pasted message starts the conversation (needs migration 0008; skipped quietly before it).
    await supabase.from("messages").insert({ project_id: projectId, direction: "in", body: enquiry, created_by: session.userId });
  }

  const { data: latest } = await supabase.from("quotes").select("version").eq("project_id", projectId).order("version", { ascending: false }).limit(1).maybeSingle();
  const version = (latest?.version ?? 0) + 1;
  const [standard] = result.options;

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      project_id: projectId,
      version,
      inputs,
      settings,
      total_pence: result.quotedPrice,
      direct_cost_pence: Math.round(standard.costs.direct * 100),
      floor_pence: standard.floor,
      profit_pence: result.quotedProfit,
      draft_reply: draft || null,
      checks: [...result.warnings, ...issues],
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (quoteError || !quote) return { error: quoteError?.message || "Couldn't save the quote." };

  const { error: itemsError } = await supabase.from("quote_items").insert(
    result.options.map((option) => {
      const total = option.key === "standard" ? result.quotedPrice : option.price;
      return {
        quote_id: quote.id,
        option: option.key,
        description: option.description,
        quantity: inputs.quantity,
        total_pence: total,
        unit_pence: Math.round(total / inputs.quantity),
        cost_pence: Math.round(option.costs.direct * 100),
        floor_pence: option.floor,
        profit_pence: option.key === "standard" ? result.quotedProfit : option.profit,
      };
    }),
  );
  if (itemsError) return { error: itemsError.message };

  await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
  await supabase.from("admin_audit_log").insert({
    admin_user_id: session.userId,
    action: "quote.saved",
    entity_type: "project",
    entity_id: projectId,
    after: { quote_id: quote.id, version, total_pence: result.quotedPrice },
  });

  revalidatePath("/admin/crm");
  redirect(`/admin/crm/${projectId}`);
}

export async function updateProjectStatus(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !PROJECT_STATUSES.some((entry) => entry.value === status)) return;
  const supabase = await createServerAuthClient();
  const { data: current } = await supabase.from("projects").select("status").eq("id", id).maybeSingle();
  if (!current || current.status === status) return;
  const { error } = await supabase.from("projects").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return;
  await supabase.from("admin_audit_log").insert({
    admin_user_id: session.userId,
    action: "project.status_changed",
    entity_type: "project",
    entity_id: id,
    before: { status: current.status },
    after: { status },
  });
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${id}`);
}
