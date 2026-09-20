"use client";

import { useState, type FormEvent } from "react";
import { formatPence } from "@/lib/money";

type OrderResult = {
  orderNumber: string;
  createdAt: string;
  totalPence: number;
  paymentStatus: string;
  fulfilmentStatus: string;
  items: { title: string; quantity: number }[];
};

export function TrackOrderForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setOrder(null);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: formData.get("orderNumber"), email: formData.get("email") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "We couldn't find that order.");
      setOrder(result);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We couldn't find that order.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Order number
          <input name="orderNumber" required placeholder="3DC-10001" className="border border-black/20 px-3 py-2 outline-none focus:border-black" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email used at checkout
          <input name="email" type="email" required className="border border-black/20 px-3 py-2 outline-none focus:border-black" />
        </label>
        <button type="submit" disabled={status === "loading"} className="self-start bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {status === "loading" ? "Looking up…" : "Track order"}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        )}
      </form>

      {order && (
        <div className="flex max-w-sm flex-col gap-3 border border-black/10 p-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{order.orderNumber}</span>
            <span className="text-black/60">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span>
              Payment: <strong>{order.paymentStatus}</strong>
            </span>
            <span>
              Fulfilment: <strong>{order.fulfilmentStatus}</strong>
            </span>
          </div>
          <ul className="flex flex-col gap-1 border-t border-black/10 pt-3 text-black/70">
            {order.items.map((item, index) => (
              <li key={index}>
                {item.quantity} × {item.title}
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-black/10 pt-3 font-semibold">
            <span>Total</span>
            <span>{formatPence(order.totalPence)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
