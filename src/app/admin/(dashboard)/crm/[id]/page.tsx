import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";
import { CHANNEL_LABELS, PROJECT_STATUSES } from "@/lib/project-status";
import { updateProjectStatus } from "../actions";
import { CopyButton } from "../copy-button";

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
  specs: { colours?: string; deadline?: string; missingInfo?: string[]; flags?: { kind: string; message: string; matches: string[] }[] };
  created_at: string;
  customers: { id: string; name: string | null; email: string | null; etsy_username: string | null } | null;
  quotes: QuoteRow[];
};

const OPTION_ORDER = ["standard", "premium", "express"];

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

  return (
    <div className="flex max-w-5xl flex-col gap-8">
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

      <section className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Customer message</h2>
          <pre className="whitespace-pre-wrap border border-black/10 bg-black/[.02] p-3 text-xs">{project.enquiry_text}</pre>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <h2 className="text-sm font-semibold">Details</h2>
          <p className="text-black/70">Colours: {specs.colours || "—"}</p>
          <p className="text-black/70">Needed by: {specs.deadline || "—"}</p>
          {specs.missingInfo && specs.missingInfo.length > 0 && (
            <div className="text-black/70">
              Still to ask:
              <ul className="ml-5 list-disc">
                {specs.missingInfo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {specs.flags?.map((flag) => (
            <p key={flag.kind} className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <strong className="capitalize">{flag.kind}</strong> ({flag.matches.join(", ")}): {flag.message}
            </p>
          ))}
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
