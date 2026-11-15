"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { getAiClient } from "@/lib/ai/provider";
import { getPricingSettings } from "@/lib/pricing/store";
import { mergePricingSettings } from "@/lib/pricing/settings";
import { flagMessage } from "@/lib/pricing/checks";
import type { Channel, QuoteInputs } from "@/lib/pricing/engine";
import { findCustomer } from "@/lib/crm/customers";
import { analyseWithAi, analyseWithRules, buildDraft, normaliseAnalysis, pricingFor, type Analysis, type Draft, type ThreadMessage } from "@/lib/crm/assistant";
import { PROJECT_STATUSES } from "@/lib/project-status";

const MAX_MESSAGE_LENGTH = 20_000;
const CHANNELS: Channel[] = ["etsy", "website", "other"];
const NEEDS_0008 = "The conversation table isn't set up yet: migration 0008 needs to be applied first.";

export type ConversationActionState = { error?: string; notice?: string };

/** What's kept in projects.specs.assistant: the latest reading of the conversation and the draft reply. */
export type AssistantState = {
  analysis: Analysis;
  analysisSource: "ai" | "rules";
  provider: string | null;
  analysedAt: string;
  draft: (Draft & { createdAt: string }) | null;
  /** Standard price (pence) from the assistant's estimate, when there's no saved quote yet. */
  estimatePence: number | null;
  notice: string | null;
};

/**
 * Re-reads the conversation (if asked) and drafts the next reply, then stores
 * both on the project. AI failures fall back to the rules and the template.
 */
async function runAssistant(supabase: SupabaseClient, projectId: string, { reanalyse, instructions = "" }: { reanalyse: boolean; instructions?: string }) {
  const { data: project } = await supabase.from("projects").select("id, channel, specs").eq("id", projectId).maybeSingle();
  if (!project) throw new Error("Enquiry not found.");
  const { data: messages, error: messagesError } = await supabase.from("messages").select("direction, body, created_at").eq("project_id", projectId).order("created_at");
  if (messagesError) throw new Error(NEEDS_0008);
  const { data: latestQuote } = await supabase
    .from("quotes")
    .select("version, inputs, settings")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const channel = project.channel as Channel;
  const thread = (messages ?? []) as ThreadMessage[];
  const specs = (project.specs ?? {}) as Record<string, unknown> & { assistant?: AssistantState };
  const { settings } = await getPricingSettings(supabase);
  const ai = getAiClient();
  const notices: string[] = [];

  let analysis = specs.assistant?.analysis ? normaliseAnalysis(specs.assistant.analysis) : null;
  let analysisSource = specs.assistant?.analysisSource ?? "rules";
  let analysedAt = specs.assistant?.analysedAt ?? new Date().toISOString();
  if (reanalyse || !analysis) {
    analysis = null;
    if (ai) {
      try {
        analysis = await analyseWithAi(ai, thread, channel);
        analysisSource = "ai";
      } catch (error) {
        console.error("AI analysis failed", error);
        notices.push(`${ai.label} couldn't read the conversation, so simple rules were used.`);
      }
    }
    if (!analysis) {
      analysis = analyseWithRules(thread);
      analysisSource = "rules";
    }
    analysedAt = new Date().toISOString();
  }

  const pricing = pricingFor({
    settings,
    channel,
    analysis,
    latestQuote: latestQuote ? { version: latestQuote.version, inputs: latestQuote.inputs as QuoteInputs, settings: mergePricingSettings(latestQuote.settings) } : null,
  });

  let draft: Draft;
  try {
    draft = await buildDraft({ ai, thread, channel, analysis, pricing, settings, instructions });
  } catch (error) {
    console.error("AI draft failed", error);
    notices.push(`${ai?.label ?? "The AI"} couldn't draft a reply, so the template was used.`);
    draft = await buildDraft({ ai: null, thread, channel, analysis, pricing, settings });
  }

  const customerText = thread.filter((message) => message.direction === "in").map((message) => message.body).join("\n\n");
  const assistant: AssistantState = {
    analysis,
    analysisSource,
    provider: ai?.label ?? null,
    analysedAt,
    draft: { ...draft, createdAt: new Date().toISOString() },
    estimatePence: pricing?.source.kind === "estimate" ? pricing.result.quotedPrice : null,
    notice: notices.join(" ") || null,
  };
  const { error } = await supabase
    .from("projects")
    .update({
      specs: { ...specs, colours: analysis.colours, deadline: analysis.deadline, missingInfo: analysis.questions, flags: flagMessage(customerText), assistant },
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  return assistant;
}

function readText(formData: FormData, key: string, max = MAX_MESSAGE_LENGTH) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

/** A new prospect: saves the customer, the project and their first message, then reads it and drafts a reply. */
export async function startEnquiry(_state: ConversationActionState, formData: FormData): Promise<ConversationActionState> {
  const session = await requireAdmin();
  const supabase = await createServerAuthClient();
  const message = readText(formData, "message");
  const channel = CHANNELS.includes(formData.get("channel") as Channel) ? (formData.get("channel") as Channel) : "other";
  const etsyUsername = readText(formData, "etsyUsername", 100).replace(/^@/, "");
  const email = readText(formData, "email", 200);
  const orderedQuoteListing = formData.get("orderedQuoteListing") === "on";
  if (!message) return { error: "Paste the customer's message first." };
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: "That email address doesn't look right." };

  const { error: tableError } = await supabase.from("messages").select("id").limit(1);
  if (tableError) return { error: NEEDS_0008 };

  let customerId: string;
  try {
    customerId = await findCustomer(supabase, { email, customerName: "", etsyUsername, channel });
  } catch {
    return { error: "Couldn't save the customer record." };
  }
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ customer_id: customerId, channel, status: "enquiry", title: message.split("\n").find((line) => line.trim())?.slice(0, 80) || "New enquiry", enquiry_text: message })
    .select("id")
    .single();
  if (error || !project) return { error: error?.message || "Couldn't save the enquiry." };

  const rows = [{ project_id: project.id, direction: "in", body: message, created_by: session.userId }];
  if (orderedQuoteListing) rows.push({ project_id: project.id, direction: "note", body: "They ordered the £1 quote listing.", created_by: session.userId });
  const { error: messageError } = await supabase.from("messages").insert(rows);
  if (messageError) return { error: messageError.message };

  try {
    const { analysis } = await runAssistant(supabase, project.id, { reanalyse: true });
    // Fill in what the message told us: a proper title, and the customer's name if we didn't have one.
    if (analysis.title) await supabase.from("projects").update({ title: analysis.title }).eq("id", project.id);
    if (analysis.customerName || analysis.email || analysis.etsyUsername) {
      const { data: customer } = await supabase.from("customers").select("name, email, etsy_username").eq("id", customerId).maybeSingle();
      const update: Record<string, string> = {};
      if (analysis.customerName && (!customer?.name || customer.name === customer.etsy_username)) update.name = analysis.customerName;
      if (analysis.etsyUsername && !customer?.etsy_username) update.etsy_username = analysis.etsyUsername;
      if (Object.keys(update).length) await supabase.from("customers").update(update).eq("id", customerId);
    }
  } catch (assistantError) {
    console.error("Assistant failed on a new enquiry", assistantError);
  }

  await supabase.from("admin_audit_log").insert({ admin_user_id: session.userId, action: "enquiry.created", entity_type: "project", entity_id: project.id, after: { channel } });
  revalidatePath("/admin/crm");
  redirect(`/admin/crm/${project.id}`);
}

/** Adds the customer's latest message (or a private note) to the conversation, then re-reads it and redrafts. */
export async function addMessage(_state: ConversationActionState, formData: FormData): Promise<ConversationActionState> {
  const session = await requireAdmin();
  const supabase = await createServerAuthClient();
  const projectId = readText(formData, "projectId", 64);
  const body = readText(formData, "body");
  const direction = formData.get("direction") === "note" ? "note" : "in";
  if (!projectId || !body) return { error: direction === "note" ? "Write the note first." : "Paste the customer's message first." };

  const { error } = await supabase.from("messages").insert({ project_id: projectId, direction, body, created_by: session.userId });
  if (error) return { error: /relation|schema cache/i.test(error.message) ? NEEDS_0008 : error.message };
  return refresh(supabase, projectId, { reanalyse: true });
}

/** Redrafts the reply (optionally re-reading the conversation first), with optional instructions from the owner. */
export async function redraftReply(_state: ConversationActionState, formData: FormData): Promise<ConversationActionState> {
  await requireAdmin();
  const supabase = await createServerAuthClient();
  const projectId = readText(formData, "projectId", 64);
  if (!projectId) return { error: "Enquiry not found." };
  return refresh(supabase, projectId, { reanalyse: formData.get("reanalyse") === "on", instructions: readText(formData, "instructions", 1000) });
}

async function refresh(supabase: SupabaseClient, projectId: string, options: { reanalyse: boolean; instructions?: string }): Promise<ConversationActionState> {
  try {
    const assistant = await runAssistant(supabase, projectId, options);
    revalidatePath(`/admin/crm/${projectId}`);
    revalidatePath("/admin/crm");
    return { notice: assistant.notice ?? undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't update the draft." };
  }
}

/**
 * Records the reply the owner sent (after they've pasted it into Etsy or
 * email themselves) and moves the project on. Nothing is sent from here.
 */
export async function markReplySent(_state: ConversationActionState, formData: FormData): Promise<ConversationActionState> {
  const session = await requireAdmin();
  const supabase = await createServerAuthClient();
  const projectId = readText(formData, "projectId", 64);
  const body = readText(formData, "body");
  const status = String(formData.get("status") ?? "");
  if (!projectId || !body) return { error: "There's no reply to save." };

  const { data: project } = await supabase.from("projects").select("status, specs").eq("id", projectId).maybeSingle();
  if (!project) return { error: "Enquiry not found." };
  const { error } = await supabase.from("messages").insert({ project_id: projectId, direction: "out", body, created_by: session.userId });
  if (error) return { error: error.message };

  const specs = (project.specs ?? {}) as Record<string, unknown> & { assistant?: AssistantState };
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (specs.assistant) update.specs = { ...specs, assistant: { ...specs.assistant, draft: null } };
  const newStatus = PROJECT_STATUSES.some((entry) => entry.value === status) && status !== project.status ? status : null;
  if (newStatus) update.status = newStatus;
  await supabase.from("projects").update(update).eq("id", projectId);
  await supabase.from("admin_audit_log").insert({
    admin_user_id: session.userId,
    action: "reply.marked_sent",
    entity_type: "project",
    entity_id: projectId,
    before: { status: project.status },
    after: { status: newStatus ?? project.status },
  });
  revalidatePath(`/admin/crm/${projectId}`);
  revalidatePath("/admin/crm");
  return {};
}
