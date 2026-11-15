"use client";

import { useActionState, useMemo, useState } from "react";
import { checkDraft } from "@/lib/pricing/checks";
import type { Channel } from "@/lib/pricing/engine";
import { PROJECT_STATUSES } from "@/lib/project-status";
import { addMessage, markReplySent, redraftReply, type ConversationActionState } from "../conversation-actions";

const inputClass = "w-full border border-black/20 px-2.5 py-1.5 text-sm outline-none focus:border-black";
const buttonClass = "border border-black px-3 py-1.5 text-sm font-medium hover:bg-black hover:text-white disabled:opacity-50";
const primaryButtonClass = "bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60";

function Feedback({ state }: { state: ConversationActionState }) {
  if (state.error) return <p className="text-sm text-red-700">{state.error}</p>;
  if (state.notice) return <p className="text-sm text-amber-800">{state.notice}</p>;
  return null;
}

/** Paste the customer's reply (or add a private note); the assistant then re-reads the whole conversation. */
export function AddMessageForm({ projectId, aiLabel }: { projectId: string; aiLabel: string | null }) {
  const [state, action, pending] = useActionState<ConversationActionState, FormData>(addMessage, {});
  const [direction, setDirection] = useState<"in" | "note">("in");
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" name="direction" value="in" checked={direction === "in"} onChange={() => setDirection("in")} />
          Customer replied
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="direction" value="note" checked={direction === "note"} onChange={() => setDirection("note")} />
          Private note
        </label>
      </div>
      <textarea
        name="body"
        rows={5}
        required
        placeholder={direction === "in" ? "Paste their latest message here" : "e.g. They ordered the £1 quote listing / Sliced it: 42 g, 3.5 h"}
        className={`${inputClass} font-mono text-xs`}
      />
      <Feedback state={state} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? `Reading${aiLabel ? ` with ${aiLabel}` : ""}…` : "Add and update the draft"}
        </button>
      </div>
    </form>
  );
}

export type DraftView = {
  text: string;
  allowed: number[];
  source: "ai" | "template";
  priceNote: string | null;
};

/** The draft reply: edit it, copy it into Etsy or email, then mark it as sent. */
export function DraftPanel({
  projectId,
  channel,
  draft,
  defaultStatus,
  aiLabel,
}: {
  projectId: string;
  channel: Channel;
  draft: DraftView | null;
  defaultStatus: string;
  aiLabel: string | null;
}) {
  const [text, setText] = useState(draft?.text ?? "");
  const [copied, setCopied] = useState(false);
  const [sentState, sentAction, sending] = useActionState<ConversationActionState, FormData>(markReplySent, {});
  const [redraftState, redraftAction, redrafting] = useActionState<ConversationActionState, FormData>(redraftReply, {});
  const issues = useMemo(() => (draft && text ? checkDraft(text, channel, draft.allowed) : []), [text, channel, draft]);
  const blocked = issues.some((issue) => issue.level === "block");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the text is still there to select by hand.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {draft ? (
        <>
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={14} className={`${inputClass} leading-relaxed`} />
          <p className="text-xs text-black/50">
            {draft.source === "ai" ? `Drafted by ${aiLabel ?? "AI"}. ` : "Drafted from the template. "}
            {draft.priceNote ?? "No price in this reply."} Nothing is sent from here.
          </p>
          {issues.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {issues.map((issue) => (
                <li key={issue.message} className={`border-l-4 px-3 py-2 text-xs ${issue.level === "block" ? "border-red-600 bg-red-50 text-red-800" : "border-amber-500 bg-amber-50 text-amber-900"}`}>
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-green-800">✓ Checks passed: prices match the engine{channel === "etsy" ? ", nothing points off Etsy" : ""}.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={copy} disabled={!text.trim()} className={buttonClass}>
              {copied ? "Copied" : "Copy"}
            </button>
            <form action={sentAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="body" value={text} />
              <span className="text-xs text-black/50">After sending it, set status to</span>
              <select name="status" defaultValue={defaultStatus} className="border border-black/20 px-2 py-1.5 text-sm">
                {PROJECT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={sending || !text.trim() || blocked} className={primaryButtonClass} title={blocked ? "Fix the checks first" : undefined}>
                {sending ? "Saving…" : "I've sent it"}
              </button>
            </form>
          </div>
          <Feedback state={sentState} />
        </>
      ) : (
        <p className="text-sm text-black/60">No draft waiting. When the customer replies, paste it in on the left and a new draft appears here.</p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-black/60">{draft ? "Redraft with instructions" : "Draft a reply anyway"}</summary>
        <form action={redraftAction} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <textarea name="instructions" rows={3} placeholder="Optional, e.g. 'Say I can have it ready by Friday' or 'Offer the Premium option only'" className={inputClass} />
          <label className="flex items-center gap-2 text-xs text-black/60">
            <input type="checkbox" name="reanalyse" />
            Re-read the whole conversation first
          </label>
          <Feedback state={redraftState} />
          <div>
            <button type="submit" disabled={redrafting} className={buttonClass}>
              {redrafting ? "Drafting…" : "Redraft"}
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
