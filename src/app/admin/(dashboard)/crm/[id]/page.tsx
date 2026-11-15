import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";
import { CHANNEL_LABELS, PROJECT_STATUSES } from "@/lib/project-status";
import { aiConfig } from "@/lib/ai/provider";
import { NEXT_STEP_LABELS, normaliseAnalysis, statusAfterSending } from "@/lib/crm/assistant";
import type { Channel } from "@/lib/pricing/engine";
import { formatPounds } from "@/lib/pricing/reply";
import { updateProjectStatus } from "../actions";
import type { AssistantState } from "../conversation-actions";
import { CopyButton } from "../copy-button";
import { AddMessageForm, DraftPanel } from "./conversation";

type QuoteRow = {
  id: string;
  version: number;
  total_pence: number;
  direct_cost_pence: number;
  floor_pence: number;
  profit_pence: number;
  draft_reply: string | null;
  checks: { level: string; message: string }[];
  created_at: string;
  quote_items: { option: string; description: string; quantity: number; total_pence: number; unit_pence: number; floor_pence: number; profit_pence: number }[];
};

type ProjectRow = {
  id: string;
  title: string;
  channel: string;
  status: string;
  enquiry_text: string;
  specs: { colours?: string; deadline?: string; missingInfo?: string[]; flags?: { kind: string; message: string; matches: string[] }[]; assistant?: AssistantState };
  created_at: string;
  customers: { id: string; name: string | null; email: string | null; etsy_username: string | null } | null;
  quotes: QuoteRow[];
};

const OPTION_ORDER = ["standard", "premium", "express"];

type MessageRow = { id: string; direction: "in" | "out" | "note"; body: string; created_at: string };

const STEP_STYLES: Record<string, string> = {
  ask_customer: "border-amber-500 bg-amber-50 text-amber-900",
  send_quote: "border-green-700 bg-green-50 text-green-900",
  confirm_order: "border-green-700 bg-green-50 text-green-900",
  decline: "border-red-600 bg-red-50 text-red-800",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50">{title}</h3>
      <ul className="ml-5 mt-1 list-disc text-sm text-black/80">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProjectPage({ params }: PageProps<"/admin/crm/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, channel, status, enquiry_text, specs, created_at, customers(id, name, email, etsy_username), quotes(id, version, total_pence, direct_cost_pence, floor_pence, profit_pence, draft_reply, checks, created_at, quote_items(option, description, quantity, total_pence, unit_pence, floor_pence, profit_pence))",
    )
    .eq("id", id)
    .maybeSingle<ProjectRow>();

  if (!project) notFound();
  const quotes = [...project.quotes].sort((a, b) => b.version - a.version);
  const customer = project.customers;
  const specs = project.specs ?? {};
  // Fetched on its own so the page still works before migration 0008.
  const { data: messageRows, error: messagesError } = await supabase.from("messages").select("id, direction, body, created_at").eq("project_id", project.id).order("created_at").returns<MessageRow[]>();
  const messages: MessageRow[] = messagesError || !messageRows?.length ? [{ id: "enquiry", direction: "in", body: project.enquiry_text, created_at: project.created_at }] : messageRows;
  const ai = aiConfig();
  const assistant = specs.assistant;
  const analysis = assistant ? normaliseAnalysis(assistant.analysis) : null;
  const draft = assistant?.draft ?? null;
  const priceNote = !draft?.priceSource
    ? null
    : draft.priceSource.kind === "quote"
      ? `Prices from saved quote v${draft.priceSource.version}.`
      : "Prices from the assistant's rough estimate: check it in the calculator before sending a firm quote.";
  const known = analysis
    ? [
        analysis.quantity ? `Quantity: ${analysis.quantity}` : "",
        analysis.pieceWidthMm ? `Size: ${[analysis.pieceWidthMm, analysis.pieceHeightMm, analysis.pieceDepthMm].filter(Boolean).join(" × ")} mm` : "",
        analysis.material ? `Material: ${analysis.material}` : "",
        analysis.colours ? `Colours: ${analysis.colours}` : "",
        analysis.deadline ? `Needed by: ${analysis.deadline}` : "",
        analysis.hasFile ? "They have a 3D file" : "",
        analysis.needsDesign ? "Needs design work" : "",
        analysis.quoteListingOrdered ? "Ordered the quote listing" : "",
      ].filter(Boolean)
    : [];
  const estimate = analysis?.estimate;
  const estimateParts = estimate
    ? [
        estimate.printGrams ? `${estimate.printGrams} g` : "",
        estimate.printHours ? `${estimate.printHours} h printing` : "",
        estimate.laserMinutes ? `${estimate.laserMinutes} min laser` : "",
        estimate.labourMinutes ? `${estimate.labourMinutes} min your time` : "",
        estimate.designHours ? `${estimate.designHours} h design` : "",
      ].filter(Boolean)
    : [];

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/crm" className="text-xs text-black/50 hover:underline">
            ← Enquiries
          </Link>
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <p className="text-sm text-black/60">
            {CHANNEL_LABELS[project.channel] ?? project.channel} ·{" "}
            {customer ? (
              <Link href={`/admin/customers/${customer.id}`} className="hover:underline">
                {customer.name || customer.etsy_username || customer.email || "Customer"}
              </Link>
            ) : (
              "No customer"
            )}
            {customer?.etsy_username ? ` (Etsy: ${customer.etsy_username})` : ""} · {new Date(project.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form action={updateProjectStatus} className="flex items-center gap-2">
            <input type="hidden" name="id" value={project.id} />
            <select name="status" defaultValue={project.status} className="border border-black/20 px-2 py-1.5 text-sm">
              {PROJECT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <button type="submit" className="border border-black/30 px-3 py-1.5 text-sm hover:border-black">
              Update
            </button>
          </form>
          <Link href={`/admin/crm/new?project=${project.id}`} className="bg-black px-4 py-2 text-sm font-medium text-white">
            New quote version
          </Link>
        </div>
      </div>

      {messagesError && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900">Migration 0008 isn&apos;t applied yet, so the conversation and assistant aren&apos;t available. Showing the original message.</p>
      )}

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Conversation</h2>
          <ol className="flex flex-col gap-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className={`flex flex-col gap-1 border p-3 ${message.direction === "out" ? "ml-8 border-black/10 bg-black/[.04]" : message.direction === "note" ? "border-amber-300 bg-amber-50" : "mr-8 border-black/15"}`}
              >
                <span className="text-xs text-black/50">
                  {message.direction === "out" ? "You" : message.direction === "note" ? "Private note" : customer?.name || "Customer"} · {when(message.created_at)}
                </span>
                <p className="whitespace-pre-wrap text-sm">{message.body}</p>
              </li>
            ))}
          </ol>
          {!messagesError && <AddMessageForm projectId={project.id} aiLabel={ai?.label ?? null} />}
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold">Assistant</h2>
          {analysis ? (
            <>
              <div className={`border-l-4 px-3 py-2 ${STEP_STYLES[analysis.nextStep]}`}>
                <p className="text-sm font-semibold">{NEXT_STEP_LABELS[analysis.nextStep]}</p>
                {analysis.reason && <p className="text-sm">{analysis.reason}</p>}
                <p className="mt-1 text-xs opacity-70">
                  Read by {assistant?.analysisSource === "ai" ? assistant.provider : "simple rules"} · {when(assistant!.analysedAt)}
                </p>
              </div>
              {assistant?.notice && <p className="text-sm text-amber-800">{assistant.notice}</p>}
              {analysis.summary && <p className="text-sm text-black/80">{analysis.summary}</p>}
              <List title="What we know" items={known} />
              <List title="They asked" items={analysis.customerAsked} />
              <List title="Still to ask them" items={analysis.questions} />
              <List title="Your to-dos" items={analysis.ownerTasks} />
              <List title="Watch out for" items={[...analysis.risks, ...(specs.flags ?? []).map((flag) => flag.message)]} />
              {estimateParts.length > 0 && quotes.length === 0 && (
                <div className="border border-black/10 p-3 text-sm">
                  <p>
                    <strong>Rough estimate:</strong> {estimateParts.join(", ")}
                    {assistant?.estimatePence ? ` → Standard ${formatPounds(assistant.estimatePence)}` : ""}.
                  </p>
                  <p className="mt-1 text-xs text-black/50">A guess from the message, not from Bambu Studio. Check it before you send a firm price.</p>
                  <Link href={`/admin/crm/new?project=${project.id}`} className="mt-2 inline-block text-sm underline">
                    Check and save it as a quote
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-black/60">The assistant hasn&apos;t read this conversation yet. Use Redraft below, ticking &ldquo;Re-read the whole conversation&rdquo;.</p>
          )}

          {!messagesError && (
            <div className="flex flex-col gap-2 border-t border-black/10 pt-4">
              <h2 className="text-sm font-semibold">Next reply</h2>
              <DraftPanel
                key={draft?.createdAt ?? "none"}
                projectId={project.id}
                channel={project.channel as Channel}
                draft={draft ? { text: draft.text, allowed: draft.allowed, source: draft.source, priceNote } : null}
                defaultStatus={analysis ? statusAfterSending(analysis.nextStep, Boolean(draft?.priceSource)) : project.status}
                aiLabel={ai?.label ?? null}
              />
            </div>
          )}
        </div>
      </section>

      {quotes.map((quote) => (
        <section key={quote.id} className="flex flex-col gap-3 border-t border-black/10 pt-6">
          <h2 className="text-sm font-semibold">
            Quote v{quote.version} · {formatPence(quote.total_pence)}{" "}
            <span className="font-normal text-black/50">
              · cost {formatPence(quote.direct_cost_pence)} · floor {formatPence(quote.floor_pence)} · profit {formatPence(quote.profit_pence)} ·{" "}
              {new Date(quote.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </h2>
          <table className="w-full max-w-2xl text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs text-black/50">
                <th className="py-1.5 pr-3 font-medium">Option</th>
                <th className="py-1.5 pr-3 font-medium">Qty</th>
                <th className="py-1.5 pr-3 font-medium">Total</th>
                <th className="py-1.5 pr-3 font-medium">Each</th>
                <th className="py-1.5 pr-3 font-medium">Floor</th>
                <th className="py-1.5 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {[...quote.quote_items]
                .sort((a, b) => OPTION_ORDER.indexOf(a.option) - OPTION_ORDER.indexOf(b.option))
                .map((item) => (
                  <tr key={item.option} className="border-b border-black/5">
                    <td className="py-2 pr-3 capitalize">{item.option}</td>
                    <td className="py-2 pr-3">{item.quantity}</td>
                    <td className="py-2 pr-3 font-medium">{formatPence(item.total_pence)}</td>
                    <td className="py-2 pr-3 text-black/60">{formatPence(item.unit_pence)}</td>
                    <td className="py-2 pr-3 text-black/60">{formatPence(item.floor_pence)}</td>
                    <td className="py-2 text-black/60">{formatPence(item.profit_pence)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {quote.checks.length > 0 && (
            <ul className="flex flex-col gap-1">
              {quote.checks.map((check) => (
                <li key={check.message} className={`text-xs ${check.level === "block" ? "text-red-700" : check.level === "warn" ? "text-amber-800" : "text-black/50"}`}>
                  {check.message}
                </li>
              ))}
            </ul>
          )}
          {quote.draft_reply && (
            <div className="flex max-w-2xl flex-col gap-2">
              <pre className="whitespace-pre-wrap border border-black/10 p-3 text-sm">{quote.draft_reply}</pre>
              <div className="flex items-center gap-3">
                <CopyButton text={quote.draft_reply} />
                <span className="text-xs text-black/40">Not sent. Copy it into {project.channel === "etsy" ? "Etsy" : "your reply"} and send it yourself.</span>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
