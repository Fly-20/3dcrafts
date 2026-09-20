import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";

export default async function AdminProductsPage() {
  const supabase = await createServerAuthClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, title, status, fulfilment_type, base_price_pence")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="bg-black px-4 py-2 text-sm font-medium text-white">
          New product
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">Couldn&apos;t load products: {error.message}</p>}

      {!error && (products?.length ?? 0) === 0 && <p className="text-sm text-black/60">No products yet. Create the first one to test checkout end-to-end.</p>}

      {!error && (products?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Fulfilment</th>
              <th className="py-2 font-medium">Base price</th>
            </tr>
          </thead>
          <tbody>
            {products!.map((product) => (
              <tr key={product.id} className="border-b border-black/5">
                <td className="py-3">
                  <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">
                    {product.title}
                  </Link>
                </td>
                <td className="py-3 text-black/60">{product.status}</td>
                <td className="py-3 text-black/60">{product.fulfilment_type}</td>
                <td className="py-3 text-black/60">{formatPence(product.base_price_pence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
