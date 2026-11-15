"use client";

import { useMemo, useState, useTransition } from "react";
import type { PricingSettings } from "@/lib/pricing/settings";
import { EMPTY_QUOTE_INPUTS, priceQuote, type Channel, type QuoteInputs } from "@/lib/pricing/engine";
import { checkDraft, flagMessage, type DraftIssue, type ExtractedSpecs } from "@/lib/pricing/checks";
import { allowedFigures, formatPounds } from "@/lib/pricing/reply";
import { draftReply, readEnquiry, saveQuote } from "./actions";

const inputClass = "w-full border border-black/20 px-2.5 py-1.5 text-sm outline-none focus:border-black";
const labelClass = "flex flex-col gap-1 text-xs text-black/60";
const buttonClass = "border border-black px-3 py-1.5 text-sm font-medium hover:bg-black hover:text-white disabled:opacity-50";
const primaryButtonClass = "bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60";

type NumberField = Exclude<keyof QuoteInputs, "channel" | "material" | "priceOverride">;
type FormState = Record<NumberField | "priceOverride", string> & { channel: Channel; material: string };

export type QuoteBuilderInitial = {
  projectId?: string;
  enquiry: string;
  title: string;
  customerName: string;
  etsyUsername: string;
  email: string;
  missingInfo: string[];
  specs: Partial<ExtractedSpecs>;
  inputs: QuoteInputs;
};

const blankInitial: QuoteBuilderInitial = {
  enquiry: "",
  title: "",
  customerName: "",
  etsyUsername: "",
  email: "",
  missingInfo: [],
  specs: {},
  inputs: EMPTY_QUOTE_INPUTS,
};

function toForm(inputs: QuoteInputs): FormState {
  const text = (value: number) => (value ? String(value) : "");
  return {
    channel: inputs.channel,
    material: inputs.material,
    quantity: String(inputs.quantity || 1),
    printGrams: text(inputs.printGrams),
    printHours: text(inputs.printHours),
    laserMinutes: text(inputs.laserMinutes),
    plywoodAreaCm2: text(inputs.plywoodAreaCm2),
    pieceWidthMm: text(inputs.pieceWidthMm),
    pieceHeightMm: text(inputs.pieceHeightMm),
    pieceDepthMm: text(inputs.pieceDepthMm),
    labourMinutes: text(inputs.labourMinutes),
    designHours: text(inputs.designHours),
    priceOverride: inputs.priceOverride ? String(inputs.priceOverride) : "",
  };
}

function toInputs(form: FormState): QuoteInputs {
  const number = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };
  return {
    channel: form.channel,
    material: form.material,
    quantity: Math.max(1, Math.round(number(form.quantity))),
    printGrams: number(form.printGrams),
    printHours: number(form.printHours),
    laserMinutes: number(form.laserMinutes),
    plywoodAreaCm2: number(form.plywoodAreaCm2),
    pieceWidthMm: number(form.pieceWidthMm),
    pieceHeightMm: number(form.pieceHeightMm),
    pieceDepthMm: number(form.pieceDepthMm),
    labourMinutes: number(form.labourMinutes),
    designHours: number(form.designHours),
    priceOverride: number(form.priceOverride) || null,
  };
}

const levelStyles: Record<string, string> = {
  block: "border-red-600 bg-red-50 text-red-800",
  warn: "border-amber-500 bg-amber-50 text-amber-900",
  info: "border-black/20 bg-black/[.03] text-black/70",
};

export function QuoteBuilder({ settings, aiLabel, initial = blankInitial }: { settings: PricingSettings; aiLabel: string | null; initial?: QuoteBuilderInitial }) {
  const [enquiry, setEnquiry] = useState(initial.enquiry);
  const [title, setTitle] = useState(initial.title);
  const [customerName, setCustomerName] = useState(initial.customerName);
  const [etsyUsername, setEtsyUsername] = useState(initial.etsyUsername);
  const [email, setEmail] = useState(initial.email);
  const [specs, setSpecs] = useState<Partial<ExtractedSpecs>>(initial.specs);
  const [missingInfo, setMissingInfo] = useState(initial.missingInfo.join("\n"));
  const [form, setForm] = useState<FormState>(toForm(initial.inputs));
  const [draft, setDraft] = useState("");
  const [draftSource, setDraftSource] = useState<"ai" | "template" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reading, startReading] = useTransition();
  const [drafting, startDrafting] = useTransition();
  const [saving, startSaving] = useTransition();

  const inputs = useMemo(() => toInputs(form), [form]);
  const result = useMemo(() => priceQuote(settings, inputs), [settings, inputs]);
  const flags = useMemo(() => flagMessage(enquiry), [enquiry]);
  const postagePence = Math.round(settings.postage * 100);
  const draftIssues: DraftIssue[] = useMemo(
    () => (draft ? checkDraft(draft, inputs.channel, allowedFigures(result, postagePence, inputs.quantity)) : []),
    [draft, inputs.channel, inputs.quantity, result, postagePence],
  );
  const [standard] = result.options;
  const missingList = missingInfo.split("\n").map((line) => line.trim()).filter(Boolean);
  const isLaser = inputs.laserMinutes > 0 || inputs.plywoodAreaCm2 > 0 || specs.isLaser;

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));

  function applySpecs(next: ExtractedSpecs) {
    setSpecs(next);
    if (next.customerName && !customerName) setCustomerName(next.customerName);
    if (next.etsyUsername && !etsyUsername) setEtsyUsername(next.etsyUsername);
    if (next.email && !email) setEmail(next.email);
    if (next.summary && !title) setTitle(next.summary);
    setMissingInfo(next.missingInfo.join("\n"));
    setForm((current) => ({
      ...current,
      quantity: next.quantity ? String(next.quantity) : current.quantity,
      material: next.material || current.material,
      pieceWidthMm: next.pieceWidthMm ? String(next.pieceWidthMm) : current.pieceWidthMm,
      pieceHeightMm: next.pieceHeightMm ? String(next.pieceHeightMm) : current.pieceHeightMm,
      pieceDepthMm: next.pieceDepthMm ? String(next.pieceDepthMm) : current.pieceDepthMm,
    }));
  }

  function onRead() {
    setError(null);
    setNotice(null);
    startReading(async () => {
      const response = await readEnquiry(enquiry);
      if (response.error) return setError(response.error);
      if (response.specs) applySpecs(response.specs);
      setNotice(response.notice ?? (response.source === "ai" ? `Details filled in by ${aiLabel ?? "AI"}. Check them against the message.` : "Details filled in by simple rules. Check them against the message."));
    });
  }

  function onDraft() {
    setError(null);
    setNotice(null);
    startDrafting(async () => {
      const response = await draftReply({ enquiry, customerName, summary: title, missingInfo: missingList, inputs });
      if (response.error) return setError(response.error);
      setDraft(response.text ?? "");
      setDraftSource(response.source ?? null);
      if (response.notice) setNotice(response.notice);
    });
  }

  function onSave() {
    setError(null);
    startSaving(async () => {
      const response = await saveQuote({
        projectId: initial.projectId,
        enquiry,
        title,
        customerName,
        etsyUsername,
        email,
        specs: { ...specs, missingInfo: missingList },
        inputs,
        draftReply: draft,
      });
      if (response?.error) setError(response.error);
    });
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy: select the text and copy it by hand.");
    }
  }

  const blocked = result.warnings.some((warning) => warning.level === "block");

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Left: the enquiry and what we know */}
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">1. Customer message</h2>
          <textarea
            value={enquiry}
            onChange={(event) => setEnquiry(event.target.value)}
            rows={9}
            placeholder="Paste the Etsy (or email, Facebook…) message here"
            className={`${inputClass} font-mono text-xs`}
            readOnly={Boolean(initial.projectId)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <select value={form.channel} onChange={set("channel")} className="border border-black/20 px-2 py-1.5 text-sm">
              <option value="etsy">Etsy</option>
              <option value="website">Website</option>
              <option value="other">Other (Facebook, in person…)</option>
            </select>
            <button type="button" onClick={onRead} disabled={reading || !enquiry.trim()} className={buttonClass}>
              {reading ? "Reading…" : aiLabel ? `Read message with ${aiLabel}` : "Read message"}
            </button>
            {!aiLabel && <span className="text-xs text-black/40">No AI key set (ANTHROPIC_API_KEY or OPENAI_API_KEY): using simple rules and a template reply.</span>}
          </div>
          {flags.length > 0 && (
            <ul className="flex flex-col gap-2">
              {flags.map((flag) => (
                <li key={flag.kind} className={`border-l-4 px-3 py-2 text-xs ${levelStyles.warn}`}>
                  <strong className="capitalize">{flag.kind === "safety" ? "Safety-critical?" : flag.kind === "food" ? "Food contact" : flag.kind === "copyright" ? "Copyright?" : "Children's item"}</strong> ({flag.matches.join(", ")}): {flag.message}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <h2 className="col-span-full text-sm font-semibold">2. Customer and job</h2>
          <label className={`${labelClass} col-span-2`}>
            Job title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="30 club keyrings" className={inputClass} />
          </label>
          <label className={labelClass}>
            Name
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className={inputClass} disabled={Boolean(initial.projectId)} />
          </label>
          <label className={labelClass}>
            Etsy username
            <input value={etsyUsername} onChange={(event) => setEtsyUsername(event.target.value)} className={inputClass} disabled={Boolean(initial.projectId)} />
          </label>
          <label className={`${labelClass} col-span-2`}>
            Email (optional)
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className={inputClass} disabled={Boolean(initial.projectId)} />
          </label>
          <label className={labelClass}>
            Colours
            <input value={specs.colours ?? ""} onChange={(event) => setSpecs((current) => ({ ...current, colours: event.target.value }))} className={inputClass} />
          </label>
          <label className={labelClass}>
            Needed by
            <input value={specs.deadline ?? ""} onChange={(event) => setSpecs((current) => ({ ...current, deadline: event.target.value }))} className={inputClass} />
          </label>
          <label className={`${labelClass} col-span-full`}>
            Still to ask the customer (one per line)
            <textarea value={missingInfo} onChange={(event) => setMissingInfo(event.target.value)} rows={3} className={inputClass} />
          </label>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <h2 className="col-span-full text-sm font-semibold">3. Making it</h2>
          <label className={labelClass}>
            Quantity
            <input value={form.quantity} onChange={set("quantity")} type="number" min="1" step="1" className={inputClass} />
          </label>
          <label className={labelClass}>
            Material
            <select value={form.material} onChange={set("material")} className={inputClass}>
              <option>PLA</option>
              <option>PETG</option>
              <option>Plywood</option>
              <option>Other</option>
            </select>
          </label>
          <label className={labelClass}>
            Design (hours)
            <input value={form.designHours} onChange={set("designHours")} type="number" min="0" step="0.25" className={inputClass} />
          </label>
          <label className={labelClass}>
            Your time (minutes)
            <input value={form.labourMinutes} onChange={set("labourMinutes")} type="number" min="0" step="5" className={inputClass} title="Setup, finishing and packing for the whole order" />
          </label>
          <p className="col-span-full -mb-1 text-xs text-black/40">3D print: whole order, from Bambu Studio</p>
          <label className={labelClass}>
            Filament (g)
            <input value={form.printGrams} onChange={set("printGrams")} type="number" min="0" step="1" className={inputClass} />
          </label>
          <label className={labelClass}>
            Print time (hours)
            <input value={form.printHours} onChange={set("printHours")} type="number" min="0" step="0.1" className={inputClass} />
          </label>
          <p className="col-span-full -mb-1 text-xs text-black/40">Laser: whole order</p>
          <label className={labelClass}>
            Laser (minutes)
            <input value={form.laserMinutes} onChange={set("laserMinutes")} type="number" min="0" step="1" className={inputClass} />
          </label>
          <label className={labelClass}>
            Plywood (cm²)
            <input
              value={form.plywoodAreaCm2}
              onChange={set("plywoodAreaCm2")}
              type="number"
              min="0"
              step="1"
              placeholder={isLaser && result.plywoodAreaCm2 ? `${Math.round(result.plywoodAreaCm2)} from size` : ""}
              className={inputClass}
            />
          </label>
          <p className="col-span-full -mb-1 text-xs text-black/40">Size of one piece (mm), for the fit check{isLaser ? " and plywood area" : ""}</p>
          <label className={labelClass}>
            Width
            <input value={form.pieceWidthMm} onChange={set("pieceWidthMm")} type="number" min="0" className={inputClass} />
          </label>
          <label className={labelClass}>
            Height
            <input value={form.pieceHeightMm} onChange={set("pieceHeightMm")} type="number" min="0" className={inputClass} />
          </label>
          <label className={labelClass}>
            Depth
            <input value={form.pieceDepthMm} onChange={set("pieceDepthMm")} type="number" min="0" className={inputClass} />
          </label>
        </section>
      </div>

      {/* Right: the price and the reply */}
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">4. Price</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs text-black/50">
                <th className="py-1.5 pr-3 font-medium">Option</th>
                <th className="py-1.5 pr-3 font-medium">Price</th>
                {inputs.channel === "etsy" && <th className="py-1.5 pr-3 font-medium">Etsy item + postage</th>}
                <th className="py-1.5 pr-3 font-medium">Floor</th>
                <th className="py-1.5 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {result.options.map((option) => {
                const price = option.key === "standard" ? result.quotedPrice : option.price;
                const profit = option.key === "standard" ? result.quotedProfit : option.profit;
                return (
                  <tr key={option.key} className="border-b border-black/5 align-top">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-black/50">{option.description}</div>
                    </td>
                    <td className="py-2 pr-3 font-semibold">
                      {formatPounds(price)}
                      {inputs.quantity > 1 && <div className="text-xs font-normal text-black/50">{formatPounds(Math.round(price / inputs.quantity))} each</div>}
                      {option.key === "standard" && inputs.priceOverride && <div className="text-xs font-normal text-black/50">engine: {formatPounds(option.price)}</div>}
                    </td>
                    {inputs.channel === "etsy" && (
                      <td className="py-2 pr-3 text-black/70">
                        {formatPounds(price - postagePence)} + {formatPounds(postagePence)}
                      </td>
                    )}
                    <td className="py-2 pr-3 text-black/70">{formatPounds(option.floor)}</td>
                    <td className={`py-2 ${profit < 0 ? "text-red-700" : "text-black/70"}`}>{formatPounds(profit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-black/50">
            Prices include VAT ({formatPounds(standard.vat)} on Standard) and {formatPounds(postagePence)} postage. Profit is on top of paying you £{settings.labourPerHour}/h, after {inputs.channel === "etsy" ? "Etsy" : "Stripe"} fees ({formatPounds(standard.fees)}).
          </p>
          <label className={`${labelClass} max-w-xs`}>
            Your price for Standard (£, optional)
            <input value={form.priceOverride} onChange={set("priceOverride")} type="number" min="0" step="0.5" placeholder={(standard.price / 100).toFixed(2)} className={inputClass} />
          </label>

          {result.warnings.length > 0 && (
            <ul className="flex flex-col gap-2">
              {result.warnings.map((warning) => (
                <li key={warning.message} className={`border-l-4 px-3 py-2 text-xs ${levelStyles[warning.level]}`}>
                  {warning.message}
                </li>
              ))}
            </ul>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-xs font-medium text-black/60">Cost breakdown (Standard)</summary>
            <table className="mt-2 w-full max-w-sm text-xs">
              <tbody>
                {(
                  [
                    ["Filament", standard.costs.filament],
                    ["Printer time (incl. failure buffer)", standard.costs.printer],
                    ["Plywood (incl. wastage)", standard.costs.plywood],
                    ["Laser time (incl. failure buffer)", standard.costs.laser],
                    ["Laser consumables", standard.costs.consumables],
                    ["Your time", standard.costs.labour],
                    ["Design", standard.costs.design],
                    ["Box", standard.costs.packaging],
                    ["Postage", standard.costs.postage],
                    ["Acquisition", standard.costs.acquisition],
                  ] as [string, number][]
                )
                  .filter(([, value]) => value > 0)
                  .map(([label, value]) => (
                    <tr key={label} className="border-b border-black/5">
                      <td className="py-1 pr-3 text-black/60">{label}</td>
                      <td className="py-1 text-right">{formatPounds(Math.round(value * 100))}</td>
                    </tr>
                  ))}
                <tr className="font-semibold">
                  <td className="py-1 pr-3">Direct cost</td>
                  <td className="py-1 text-right">{formatPounds(Math.round(standard.costs.direct * 100))}</td>
                </tr>
                <tr className="text-black/60">
                  <td className="py-1 pr-3">Break-even price</td>
                  <td className="py-1 text-right">{formatPounds(standard.breakEven)}</td>
                </tr>
              </tbody>
            </table>
          </details>

          <details className="text-sm" open={inputs.quantity > 1}>
            <summary className="cursor-pointer text-xs font-medium text-black/60">Quantity breaks (Standard)</summary>
            <table className="mt-2 w-full max-w-sm text-xs">
              <thead>
                <tr className="text-black/50">
                  <th className="py-1 text-left font-medium">Qty</th>
                  <th className="py-1 text-right font-medium">Total</th>
                  <th className="py-1 text-right font-medium">Each</th>
                </tr>
              </thead>
              <tbody>
                {result.breaks.map((row) => (
                  <tr key={row.quantity} className={`border-b border-black/5 ${row.quantity === inputs.quantity ? "font-semibold" : ""}`}>
                    <td className="py-1">{row.quantity}</td>
                    <td className="py-1 text-right">{formatPounds(row.price)}</td>
                    <td className="py-1 text-right">{formatPounds(row.perUnit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-black/40">Scaled from this order: materials and machine time per unit; setup ({settings.setupMinutes} min) and design once.</p>
          </details>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">5. Draft reply</h2>
            <button type="button" onClick={onDraft} disabled={drafting} className={buttonClass}>
              {drafting ? "Drafting…" : draft ? "Redraft" : aiLabel ? `Draft with ${aiLabel}` : "Draft from template"}
            </button>
          </div>
          {draft ? (
            <>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={14} className={inputClass} />
              <ul className="flex flex-col gap-2">
                {draftIssues.length === 0 ? (
                  <li className="border-l-4 border-green-600 bg-green-50 px-3 py-2 text-xs text-green-800">
                    Checks passed: every £ figure matches the quote{inputs.channel === "etsy" ? "; no links, emails, phone numbers or website mentions" : ""}.
                  </li>
                ) : (
                  draftIssues.map((issue) => (
                    <li key={issue.message} className={`border-l-4 px-3 py-2 text-xs ${levelStyles[issue.level]}`}>
                      {issue.message}
                    </li>
                  ))
                )}
              </ul>
              <div className="flex items-center gap-3">
                <button type="button" onClick={onCopy} className={buttonClass}>
                  {copied ? "Copied" : "Copy"}
                </button>
                <span className="text-xs text-black/40">
                  {draftSource === "ai" ? `Written by ${aiLabel ?? "AI"} around the engine's prices. ` : ""}Nothing is sent from here: paste it into {inputs.channel === "etsy" ? "Etsy" : "your reply"} and send it yourself.
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-black/50">The reply uses the prices above. Change the inputs first, then draft.</p>
          )}
        </section>

        <section className="flex flex-col gap-2 border-t border-black/10 pt-4">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {notice && <p className="text-xs text-black/60">{notice}</p>}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onSave} disabled={saving || blocked || !enquiry.trim()} className={primaryButtonClass}>
              {saving ? "Saving…" : initial.projectId ? "Save as new quote version" : "Save enquiry and quote"}
            </button>
            {blocked && <span className="text-xs text-red-700">Below cost: change the price to save.</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
