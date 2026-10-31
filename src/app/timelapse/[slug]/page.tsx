import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { siteConfig } from "@/app/site-config";

export const metadata: Metadata = {
  title: "Your timelapse | 3DCRAFTS",
  description: "Watch the timelapse of your 3DCRAFTS order.",
  robots: { index: false, follow: false },
};

type TimelapseRow = {
  etsy_order_id: string;
  video_url: string;
  customers: { name: string | null } | null;
};

export default async function TimelapsePage({ params }: PageProps<"/timelapse/[slug]">) {
  const { slug } = await params;

  // Looked up with the service-role client, bypassing RLS — order_timelapses
  // has no public read policy, so the slug itself is what gates this page,
  // same pattern as /track-order's order lookup.
  const supabase = createServiceRoleClient();
  const { data: timelapse } = await supabase
    .from("order_timelapses")
    .select("etsy_order_id, video_url, customers(name)")
    .eq("slug", slug)
    .maybeSingle()
    .returns<TimelapseRow | null>();

  if (!timelapse) notFound();

  const customerName = timelapse.customers?.name;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-black/50">Order #{timelapse.etsy_order_id}</p>
        <h1 className="text-2xl font-semibold">{customerName ? `Hi ${customerName} — here's your timelapse` : "Here's your timelapse"}</h1>
        <p className="text-sm text-black/60">Here&apos;s how your order came together, start to finish.</p>
      </div>

      <video controls playsInline className="w-full border border-black/10" src={timelapse.video_url} />

      <div className="flex flex-col gap-2 border-t border-black/10 pt-6 text-sm text-black/70">
        <p>Thanks for ordering from {siteConfig.name} — made to order in our Edinburgh workshop.</p>
        <div className="flex flex-wrap gap-4">
          <Link href={siteConfig.etsyUrl} className="font-medium text-black underline">
            Leave us a review on Etsy
          </Link>
          <Link href="/shop" className="font-medium text-black underline">
            Shop more pieces
          </Link>
        </div>
      </div>
    </main>
  );
}
