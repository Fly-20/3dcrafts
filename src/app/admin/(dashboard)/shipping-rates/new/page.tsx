import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { createShippingRate } from "../actions";
import { ShippingRateForm, type ShippingRateFormValues } from "../shipping-rate-form";

export default async function NewShippingRatePage() {
  const supabase = await createServerAuthClient();
  const { count } = await supabase.from("shipping_rates").select("id", { count: "exact", head: true });

  const emptyValues: ShippingRateFormValues = {
    name: "",
    minWeightGrams: 0,
    maxWeightGrams: null,
    pricePounds: 0,
    freeShippingThresholdPounds: null,
    active: true,
    sortOrder: count ?? 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New shipping rate</h1>
      <ShippingRateForm action={createShippingRate} initialValues={emptyValues} submitLabel="Create rate" />
    </div>
  );
}
