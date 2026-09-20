import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { updateDiscountCode } from "../actions";
import { DiscountForm, type DiscountFormValues } from "../discount-form";

/** <input type="datetime-local"> wants local wall-clock time, no timezone suffix — adjust the stored UTC timestamp accordingly. */
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function EditDiscountPage({ params }: PageProps<"/admin/discounts/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();
  const { data: discount } = await supabase.from("discount_codes").select("*").eq("id", id).maybeSingle();

  if (!discount) notFound();

  const initialValues: DiscountFormValues = {
    id: discount.id,
    code: discount.code,
    type: discount.type,
    valuePercent: discount.type === "percentage" ? discount.value : 10,
    valuePounds: discount.type === "fixed" ? discount.value / 100 : 0,
    startsAt: toDatetimeLocalValue(discount.starts_at),
    endsAt: toDatetimeLocalValue(discount.ends_at),
    usageLimit: discount.usage_limit,
    active: discount.active,
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{discount.code}</h1>
      <p className="text-sm text-black/60">
        Used {discount.times_used}
        {discount.usage_limit !== null ? ` of ${discount.usage_limit}` : ""} times.
      </p>
      <DiscountForm action={updateDiscountCode} initialValues={initialValues} submitLabel="Save changes" />
    </div>
  );
}
