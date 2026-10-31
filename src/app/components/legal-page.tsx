import type { PropsWithChildren } from "react";

export const legalLastUpdated = "31 October 2026";

export function LegalPage({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <main className="legal">
      <h1>{title}</h1>
      <p className="legal-updated">Last updated: {legalLastUpdated}</p>
      {children}
    </main>
  );
}
