"use client";

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from "react";

const services = ["3D printing", "Laser cutting", "Laser engraving", "Not sure yet"];
const allowedExtensions = new Set(["stl", "step", "stp", "svg", "png", "jpg", "jpeg", "webp", "pdf", "doc", "docx", "txt", "rtf", "odt", "csv"]);
const maxTotalFileSize = 4 * 1024 * 1024;
const maxFiles = 10;

export function QuoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  function updateFiles(nextFiles: File[]) {
    const unsupported = nextFiles.some((file) => !allowedExtensions.has(file.name.split(".").pop()?.toLowerCase() || ""));
    const tooLarge = nextFiles.reduce((total, file) => total + file.size, 0) > maxTotalFileSize;
    if (unsupported || tooLarge || nextFiles.length > maxFiles) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFiles([]);
      setStatus("error");
      setMessage(unsupported ? "Please choose STL, STEP, SVG, PDF, image or document files (DOC, DOCX, TXT, RTF, ODT, CSV)." : `Choose up to ${maxFiles} files, with a combined size of 4 MB or less.`);
      return;
    }

    const transfer = new DataTransfer();
    nextFiles.forEach((file) => transfer.items.add(file));
    if (fileInputRef.current) fileInputRef.current.files = transfer.files;
    setFiles(nextFiles);
    setStatus("idle");
    setMessage("");
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
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(result?.message || (response.status === 413 ? "Attachments exceed the upload limit. Please choose smaller files." : "We couldn't send your request. Please try again."));
      }

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
        <label className={`field-wide file-field drop-zone${isDragging ? " is-dragging" : ""}${files.length ? " has-files" : ""}`} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false); }} onDrop={handleDrop}>
          <span className="file-title">Attachments</span>
          <span className="file-hint">Drag and drop STL, STEP, SVG, PDF, images or documents here, or <strong>browse your device</strong>.</span>
          <span className="file-limit">Up to 10 files, 4 MB total</span>
          <input ref={fileInputRef} className="file-input" name="files" type="file" multiple accept=".stl,.step,.stp,.svg,.png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.txt,.rtf,.odt,.csv" onChange={handleFileChange} />
          {files.length > 0 && <span className="selected-files">{files.length} file{files.length === 1 ? "" : "s"} selected: {files.map((file) => file.name).join(", ")}</span>}
        </label>
      </div>
      <div className="quote-form-footer"><button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Submit message"}</button></div>
      {status !== "idle" && <p className={`form-status ${status}`} role="status">{message}</p>}
    </form>
  );
}
