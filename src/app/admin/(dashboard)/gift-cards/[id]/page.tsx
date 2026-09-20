import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { updateGiftCard } from "../actions";
import { GiftCardForm, type GiftCardFormValues } from "../gift-card-form";

export default async function EditGiftCardPage({ params }: PageProps<"/admin/gift-cards/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();

  const [{ data: giftCard }, { data: customers }] = await Promise.all([
    supabase.from("gift_cards").select("*").eq("id", id).maybeSingle(),
    supabase.from("customers").select("id, email").order("email"),
  ]);

  if (!giftCard) notFound();

  const initialValues: GiftCardFormValues = {
    id: giftCard.id,
    code: giftCard.code,
    initialBalancePounds: giftCard.initial_balance_pence / 100,
    remainingBalancePounds: giftCard.remaining_balance_pence / 100,
    issuedToCustomerId: giftCard.issued_to_customer_id,
    active: giftCard.active,
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{giftCard.code}</h1>
      <GiftCardForm action={updateGiftCard} initialValues={initialValues} submitLabel="Save changes" customers={customers ?? []} isEdit />
    </div>
  );
}
