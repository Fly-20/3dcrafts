import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { updateShippingRate } from "../actions";
import { ShippingRateForm, type ShippingRateFormValues } from "../shipping-rate-form";

export default async function EditShippingRatePage({ params }: PageProps<"/admin/shipping-rates/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();
  const { data: rate } = await supabase.from("shipping_rates").select("*").eq("id", id).maybeSingle();

  if (!rate) notFound();

  const initialValues: ShippingRateFormValues = {
    id: rate.id,
    name: rate.name,
    minWeightGrams: rate.min_weight_grams,
    maxWeightGrams: rate.max_weight_grams,
    pricePounds: rate.price_pence / 100,
    freeShippingThresholdPounds: rate.free_shipping_threshold_pence !== null ? rate.free_shipping_threshold_pence / 100 : null,
    active: rate.active,
    sortOrder: rate.sort_order,
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{rate.name}</h1>
      <ShippingRateForm action={updateShippingRate} initialValues={initialValues} submitLabel="Save changes" />
    </div>
  );
}
