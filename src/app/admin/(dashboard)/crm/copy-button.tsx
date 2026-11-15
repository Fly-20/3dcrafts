"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked: the text is still there to select by hand.
        }
      }}
      className="border border-black px-3 py-1.5 text-sm font-medium hover:bg-black hover:text-white"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
