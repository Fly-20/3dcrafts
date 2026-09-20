import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { createGiftCard } from "../actions";
import { GiftCardForm, type GiftCardFormValues } from "../gift-card-form";

const emptyValues: GiftCardFormValues = {
  code: "",
  initialBalancePounds: 0,
  remainingBalancePounds: 0,
  issuedToCustomerId: null,
  active: true,
};

export default async function NewGiftCardPage() {
  const supabase = await createServerAuthClient();
  const { data: customers } = await supabase.from("customers").select("id, email").order("email");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New gift card</h1>
      <GiftCardForm action={createGiftCard} initialValues={emptyValues} submitLabel="Create gift card" customers={customers ?? []} isEdit={false} />
    </div>
  );
}
