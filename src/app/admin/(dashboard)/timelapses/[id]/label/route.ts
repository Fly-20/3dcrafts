import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { buildTimelapseLabelPdf } from "@/lib/timelapse-label";
import { siteConfig } from "@/app/site-config";

export async function GET(_request: Request, context: RouteContext<"/admin/timelapses/[id]/label">) {
  await requireAdmin();
  const { id } = await context.params;

  const supabase = await createServerAuthClient();
  const { data: timelapse } = await supabase
    .from("order_timelapses")
    .select("slug, etsy_order_id, customers(name)")
    .eq("id", id)
    .maybeSingle()
    .returns<{ slug: string; etsy_order_id: string; customers: { name: string | null } | null } | null>();
  if (!timelapse) return new Response("Not found", { status: 404 });

  const url = `${siteConfig.url}/timelapse/${timelapse.slug}`;
  const customerName = timelapse.customers?.name || "";
  const pdfBytes = await buildTimelapseLabelPdf({ url, etsyOrderId: timelapse.etsy_order_id, customerName });
  const filename = `order-${timelapse.etsy_order_id.replace(/[^a-zA-Z0-9-]/g, "") || "timelapse"}-timelapse-label.pdf`;

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
