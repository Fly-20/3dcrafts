"use client";

import { useState, useTransition } from "react";
import { sendTimelapseEmailAction } from "../actions";

export function SendTimelapseEmailButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendTimelapseEmailAction(id);
      setMessage(result.error ? { type: "error", text: result.error } : { type: "success", text: "Email sent." });
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={handleClick} disabled={isPending} className="border border-black/20 px-4 py-2 text-sm font-medium disabled:opacity-60">
        {isPending ? "Sending…" : "Send email to customer"}
      </button>
      {message && <span className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>{message.text}</span>}
    </div>
  );
}
