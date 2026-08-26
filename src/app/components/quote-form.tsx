"use client";

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from "react";

const services = ["3D printing", "Laser cutting", "Laser engraving", "Not sure yet"];

export function QuoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  function updateFiles(nextFiles: File[]) {
    const transfer = new DataTransfer();
    nextFiles.forEach((file) => transfer.items.add(file));
    if (fileInputRef.current) fileInputRef.current.files = transfer.files;
    setFiles(nextFiles);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    updateFiles(Array.from(event.target.files || []));
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    updateFiles(Array.from(event.dataTransfer.files));
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/quote", { method: "POST", body: new FormData(event.currentTarget) });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) throw new Error(result.message || "We couldn't send your request. Please try again.");

      formRef.current?.reset();
      setFiles([]);
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
        <label className="field-wide">Project description<textarea name="description" rows={5} placeholder="What would you like made? Include materials, finish or other important details." required /></label>
        <label className={`field-wide file-field drop-zone${isDragging ? " is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false); }} onDrop={handleDrop}>
          <span className="file-title">Files</span>
          <span className="file-hint">Drag and drop STL, STEP, SVG, images or sketches here, or <strong>browse your device</strong>.</span>
          <span className="file-limit">Up to 10 MB per file</span>
          <input ref={fileInputRef} className="file-input" name="files" type="file" multiple accept=".stl,.step,.stp,.svg,.png,.jpg,.jpeg,.webp,.pdf" onChange={handleFileChange} />
          {files.length > 0 && <span className="selected-files">{files.length} file{files.length === 1 ? "" : "s"} selected: {files.map((file) => file.name).join(", ")}</span>}
        </label>
      </div>
      <div className="quote-form-footer"><button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Submit message"}</button></div>
      {status !== "idle" && <p className={`form-status ${status}`} role="status">{message}</p>}
    </form>
  );
}
