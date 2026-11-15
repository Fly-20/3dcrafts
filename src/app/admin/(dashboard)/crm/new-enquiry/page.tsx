import Link from "next/link";
import { aiConfig } from "@/lib/ai/provider";
import { EnquiryForm } from "./enquiry-form";

export default function NewEnquiryPage() {
  const ai = aiConfig();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/admin/crm" className="text-xs text-black/50 hover:underline">
          ← Enquiries
        </Link>
        <h1 className="text-2xl font-semibold">New enquiry</h1>
        <p className="mt-1 text-sm text-black/60">
          Paste a new customer&apos;s first message. {ai ? ai.label : "The assistant"} reads it, says whether you can quote straight away or need to ask something first, and drafts the reply. Nothing is sent: you copy the reply and send it
          yourself.
        </p>
        {!ai && <p className="mt-2 text-xs text-black/50">No AI key set (ANTHROPIC_API_KEY or OPENAI_API_KEY), so simple rules and a template are used for now.</p>}
      </div>
      <EnquiryForm aiLabel={ai?.label ?? null} />
    </div>
  );
}
