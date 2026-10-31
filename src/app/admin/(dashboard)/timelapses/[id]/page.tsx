import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { siteConfig } from "@/app/site-config";
import { updateTimelapse } from "../actions";
import { TimelapseForm, type TimelapseFormValues } from "../timelapse-form";
import { SendTimelapseEmailButton } from "./send-email-button";
import { DeleteTimelapseButton } from "./delete-button";

type TimelapseDetail = {
  id: string;
  slug: string;
  etsy_order_id: string;
  customers: { name: string | null; email: string } | null;
};

export default async function TimelapseDetailPage({ params }: PageProps<"/admin/timelapses/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();
  const { data: timelapse } = await supabase
    .from("order_timelapses")
    .select("id, slug, etsy_order_id, customers(name, email)")
    .eq("id", id)
    .maybeSingle()
    .returns<TimelapseDetail | null>();

  if (!timelapse) notFound();

  const url = `${siteConfig.url}/timelapse/${timelapse.slug}`;
  const initialValues: TimelapseFormValues = {
    id: timelapse.id,
    customerName: timelapse.customers?.name || "",
    customerEmail: timelapse.customers?.email || "",
    etsyOrderId: timelapse.etsy_order_id,
    slug: timelapse.slug,
  };

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{timelapse.customers?.name || timelapse.customers?.email}</h1>
        <p className="text-sm text-black/60">Order #{timelapse.etsy_order_id}</p>
      </div>

      <section className="flex flex-col gap-3 border border-black/10 p-5">
        <h2 className="text-sm font-semibold">Share</h2>
        <p className="break-all text-sm">{url}</p>
        <div className="flex flex-wrap items-center gap-3">
          <a href={`/admin/timelapses/${timelapse.id}/label`} className="border border-black bg-black px-4 py-2 text-sm font-medium text-white">
            Download label (PDF)
          </a>
          <SendTimelapseEmailButton id={timelapse.id} />
        </div>
      </section>

      <section className="flex flex-col gap-3 border border-black/10 p-5">
        <h2 className="text-sm font-semibold">Details</h2>
        <TimelapseForm action={updateTimelapse} initialValues={initialValues} submitLabel="Save changes" requireVideo={false} />
      </section>

      <section className="flex flex-col gap-3 border border-red-200 p-5">
        <h2 className="text-sm font-semibold text-red-700">Delete</h2>
        <DeleteTimelapseButton id={timelapse.id} />
      </section>
    </div>
  );
}
