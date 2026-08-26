"use client";

import { FormEvent, useRef, useState } from "react";

const services = ["3D printing", "Laser cutting", "Laser engraving", "Not sure yet"];

export function QuoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/quote", { method: "POST", body: new FormData(event.currentTarget) });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) throw new Error(result.message || "We couldn't send your request. Please try again.");

      formRef.current?.reset();
      setStatus("success");
      setMessage("Thanks — your quote request is on its way. We’ll be in touch shortly.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We couldn't send your request. Please email us instead.");
    }
  }

  return (
    <form ref={formRef} className="quote-form" onSubmit={submitQuote} encType="multipart/form-data">
      <div className="quote-fields">
        <label>Name<input name="name" autoComplete="name" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Service required<select name="service" defaultValue="" required><option value="" disabled>Select a service</option>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
        <label>Quantity<input name="quantity" inputMode="numeric" placeholder="e.g. 25" required /></label>
        <label className="field-wide">Project description<textarea name="description" rows={5} placeholder="What would you like made? Include materials, finish or other important details." required /></label>
        <label>Approximate dimensions<input name="dimensions" placeholder="e.g. 120 × 80 × 30 mm" required /></label>
        <label>Deadline<input name="deadline" type="date" required /></label>
        <label className="field-wide file-field">Files <span>STL, STEP, SVG, images or sketches — up to 10 MB each</span><input name="files" type="file" multiple accept=".stl,.step,.stp,.svg,.png,.jpg,.jpeg,.webp,.pdf" /></label>
      </div>
      <div className="quote-form-footer"><button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Submit message"}</button></div>
      {status !== "idle" && <p className={`form-status ${status}`} role="status">{message}</p>}
    </form>
  );
}
