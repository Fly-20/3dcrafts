import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { getPricingSettings } from "@/lib/pricing/store";
import { aiEnabled } from "@/lib/pricing/ai";
import { EMPTY_QUOTE_INPUTS, type QuoteInputs } from "@/lib/pricing/engine";
import { QuoteBuilder, type QuoteBuilderInitial } from "../quote-builder";

export default async function NewQuotePage({ searchParams }: PageProps<"/admin/crm/new">) {
  const { project: projectParam } = await searchParams;
  const projectId = typeof projectParam === "string" ? projectParam : undefined;
  const supabase = await createServerAuthClient();
  const { settings, stored } = await getPricingSettings(supabase);

  // "New version" of an existing enquiry starts from its latest quote.
  let initial: QuoteBuilderInitial | undefined;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id, title, enquiry_text, channel, specs, customers(name, email, etsy_username), quotes(version, inputs, draft_reply)")
      .eq("id", projectId)
      .maybeSingle();
    if (project) {
      const quotes = (project.quotes ?? []) as { version: number; inputs: QuoteInputs }[];
      const latest = quotes.sort((a, b) => b.version - a.version)[0];
      const customer = (Array.isArray(project.customers) ? project.customers[0] : project.customers) as { name: string | null; email: string | null; etsy_username: string | null } | null;
      const specs = (project.specs ?? {}) as QuoteBuilderInitial["specs"];
      initial = {
        projectId: project.id,
        enquiry: project.enquiry_text,
        title: project.title,
        customerName: customer?.name ?? "",
        etsyUsername: customer?.etsy_username ?? "",
        email: customer?.email ?? "",
        missingInfo: specs.missingInfo ?? [],
        specs,
        inputs: { ...EMPTY_QUOTE_INPUTS, ...(latest?.inputs ?? {}), channel: project.channel },
      };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">{initial ? `New quote version: ${initial.title}` : "New quote"}</h1>
        <Link href="/admin/pricing" className="text-sm text-black/60 hover:text-black hover:underline">
          Pricing settings
        </Link>
      </div>
      {!stored && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Migration 0007 isn&apos;t applied yet, so this uses the built-in pricing figures and quotes can&apos;t be saved. Pricing and draft replies still work.
        </p>
      )}
      <QuoteBuilder settings={settings} aiEnabled={aiEnabled()} initial={initial} />
    </div>
  );
}
