import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";
import { deleteShippingRateAction } from "./actions";

type ShippingRateRow = {
  id: string;
  name: string;
  min_weight_grams: number;
  max_weight_grams: number | null;
  price_pence: number;
  active: boolean;
  sort_order: number;
};

export default async function AdminShippingRatesPage() {
  const supabase = await createServerAuthClient();
  const { data: rates, error } = await supabase.from("shipping_rates").select("id, name, min_weight_grams, max_weight_grams, price_pence, active, sort_order").order("sort_order").returns<ShippingRateRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Shipping rates</h1>
        <Link href="/admin/shipping-rates/new" className="bg-black px-4 py-2 text-sm font-medium text-white">
          New rate
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">Couldn&apos;t load shipping rates: {error.message}</p>}

      {!error && (rates?.length ?? 0) === 0 && <p className="text-sm text-black/60">No shipping rates yet — checkout can&apos;t price any cart until at least one band exists.</p>}

      {!error && (rates?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Weight range</th>
              <th className="py-2 pr-4 font-medium">Price</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rates!.map((rate) => (
              <tr key={rate.id} className="border-b border-black/5">
                <td className="py-3 pr-4 font-medium">
                  <Link href={`/admin/shipping-rates/${rate.id}`} className="hover:underline">
                    {rate.name}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-black/60">
                  {rate.min_weight_grams}g – {rate.max_weight_grams !== null ? `${rate.max_weight_grams}g` : "no limit"}
                </td>
                <td className="py-3 pr-4 text-black/60">{formatPence(rate.price_pence)}</td>
                <td className="py-3 pr-4 text-black/60">{rate.active ? "Active" : "Inactive"}</td>
                <td className="py-3 text-right">
                  <form action={deleteShippingRateAction}>
                    <input type="hidden" name="id" value={rate.id} />
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
