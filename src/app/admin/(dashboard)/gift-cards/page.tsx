import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";
import { deleteGiftCardAction } from "./actions";

type GiftCardRow = {
  id: string;
  code: string;
  initial_balance_pence: number;
  remaining_balance_pence: number;
  active: boolean;
  customers: { email: string } | null;
};

export default async function AdminGiftCardsPage({ searchParams }: PageProps<"/admin/gift-cards">) {
  const { error: errorParam } = await searchParams;
  const errorMessage = typeof errorParam === "string" ? errorParam : null;

  const supabase = await createServerAuthClient();
  const { data: giftCards, error } = await supabase
    .from("gift_cards")
    .select("id, code, initial_balance_pence, remaining_balance_pence, active, customers(email)")
    .order("created_at", { ascending: false })
    .returns<GiftCardRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gift cards</h1>
        <Link href="/admin/gift-cards/new" className="bg-black px-4 py-2 text-sm font-medium text-white">
          New gift card
        </Link>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      {error && <p className="text-sm text-red-600">Couldn&apos;t load gift cards: {error.message}</p>}

      {!error && (giftCards?.length ?? 0) === 0 && <p className="text-sm text-black/60">No gift cards yet.</p>}

      {!error && (giftCards?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Code</th>
              <th className="py-2 pr-4 font-medium">Balance</th>
              <th className="py-2 pr-4 font-medium">Issued to</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {giftCards!.map((card) => (
              <tr key={card.id} className="border-b border-black/5">
                <td className="py-3 pr-4 font-medium">
                  <Link href={`/admin/gift-cards/${card.id}`} className="hover:underline">
                    {card.code}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-black/60">
                  {formatPence(card.remaining_balance_pence)} / {formatPence(card.initial_balance_pence)}
                </td>
                <td className="py-3 pr-4 text-black/60">{card.customers?.email ?? "—"}</td>
                <td className="py-3 pr-4 text-black/60">{card.active ? "Active" : "Inactive"}</td>
                <td className="py-3 text-right">
                  <form action={deleteGiftCardAction}>
                    <input type="hidden" name="id" value={card.id} />
                    <button type="submit" className="border border-black/20 px-2 py-1 text-xs hover:border-red-600 hover:text-red-600">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
