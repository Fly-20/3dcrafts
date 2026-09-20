import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";

type DiscountRow = {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  active: boolean;
  times_used: number;
  usage_limit: number | null;
};

function valueLabel(discount: DiscountRow) {
  if (discount.type === "percentage") return `${discount.value}% off`;
  if (discount.type === "fixed") return `${formatPence(discount.value)} off`;
  return "Free shipping";
}

export default async function AdminDiscountsPage() {
  const supabase = await createServerAuthClient();
  const { data: discounts, error } = await supabase.from("discount_codes").select("id, code, type, value, active, times_used, usage_limit").order("code").returns<DiscountRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discounts</h1>
        <Link href="/admin/discounts/new" className="bg-black px-4 py-2 text-sm font-medium text-white">
          New discount
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">Couldn&apos;t load discount codes: {error.message}</p>}

      {!error && (discounts?.length ?? 0) === 0 && <p className="text-sm text-black/60">No discount codes yet — create one to test the code field at checkout.</p>}

      {!error && (discounts?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Code</th>
              <th className="py-2 pr-4 font-medium">Discount</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Usage</th>
            </tr>
          </thead>
          <tbody>
            {discounts!.map((discount) => (
              <tr key={discount.id} className="relative border-b border-black/5 hover:bg-black/[.02]">
                <td className="py-3 pr-4 font-medium">
                  <Link href={`/admin/discounts/${discount.id}`} className="after:absolute after:inset-0">
                    {discount.code}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-black/60">{valueLabel(discount)}</td>
                <td className="py-3 pr-4 text-black/60">{discount.active ? "Active" : "Inactive"}</td>
                <td className="py-3 text-black/60">
                  {discount.times_used}
                  {discount.usage_limit !== null ? ` / ${discount.usage_limit}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
