import type { Metadata } from "next";
import { TrackOrderForm } from "./track-order-form";

export const metadata: Metadata = {
  title: "Track your order | 3DCRAFTS",
  description: "Look up your 3DCRAFTS order status using your order number and email.",
};

export default function TrackOrderPage() {
  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-2 pb-8">
          <h1 className="text-2xl font-semibold">Track your order</h1>
          <p className="text-sm text-black/60">Enter your order number and the email you used at checkout.</p>
        </div>
        <TrackOrderForm />
      </main>
    </>
  );
}
