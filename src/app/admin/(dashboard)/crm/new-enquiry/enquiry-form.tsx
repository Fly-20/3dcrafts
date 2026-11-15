"use client";

import { useActionState, useState } from "react";
import { startEnquiry, type ConversationActionState } from "../conversation-actions";

const inputClass = "w-full border border-black/20 px-2.5 py-1.5 text-sm outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-xs text-black/60";

export function EnquiryForm({ aiLabel }: { aiLabel: string | null }) {
  const [state, action, pending] = useActionState<ConversationActionState, FormData>(startEnquiry, {});
  const [channel, setChannel] = useState("etsy");

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={labelClass}>
        Customer&apos;s message
        <textarea name="message" required rows={12} placeholder="Paste the Etsy (or email, Facebook…) message here" className={`${inputClass} font-mono text-xs`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Where it came from
          <select name="channel" value={channel} onChange={(event) => setChannel(event.target.value)} className={inputClass}>
            <option value="etsy">Etsy</option>
            <option value="website">Website</option>
            <option value="other">Other (Facebook, in person…)</option>
          </select>
        </label>
        <label className={labelClass}>
          Etsy username (optional)
          <input name="etsyUsername" className={inputClass} />
        </label>
        <label className={labelClass}>
          Email (optional)
          <input name="email" type="email" className={inputClass} />
        </label>
      </div>
      {channel === "etsy" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="orderedQuoteListing" />
          They&apos;ve ordered the £1 quote listing
        </label>
      )}
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? `Reading${aiLabel ? ` with ${aiLabel}` : ""}…` : "Save and draft a reply"}
        </button>
        {pending && aiLabel && <span className="text-xs text-black/50">This takes 10–30 seconds.</span>}
      </div>
    </form>
  );
}
