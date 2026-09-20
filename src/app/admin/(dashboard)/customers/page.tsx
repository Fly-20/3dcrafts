import { createServerAuthClient } from "@/lib/supabase/auth-server";

export default async function AdminCustomersPage() {
  const supabase = await createServerAuthClient();
  const { data: customers, error } = await supabase.from("customers").select("id, email, name, phone, created_at").order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <p className="text-sm text-black/60">Created automatically from guest checkouts — there&apos;s no separate customer account system in Phase 1.</p>

      {error && <p className="text-sm text-red-600">Couldn&apos;t load customers: {error.message}</p>}

      {!error && (customers?.length ?? 0) === 0 && <p className="text-sm text-black/60">No customers yet.</p>}

      {!error && (customers?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Phone</th>
              <th className="py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers!.map((customer) => (
              <tr key={customer.id} className="border-b border-black/5">
                <td className="py-3 pr-4 font-medium">{customer.email}</td>
                <td className="py-3 pr-4 text-black/60">{customer.name || "—"}</td>
                <td className="py-3 pr-4 text-black/60">{customer.phone || "—"}</td>
                <td className="py-3 text-black/60">{new Date(customer.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
