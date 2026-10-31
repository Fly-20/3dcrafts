import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { deleteTimelapseFromListAction } from "./actions";

type TimelapseRow = {
  id: string;
  slug: string;
  etsy_order_id: string;
  created_at: string;
  customers: { name: string | null; email: string } | null;
};

export default async function AdminTimelapsesPage({ searchParams }: PageProps<"/admin/timelapses">) {
  const { error: errorParam } = await searchParams;
  const errorMessage = typeof errorParam === "string" ? errorParam : null;

  const supabase = await createServerAuthClient();
  const { data: timelapses, error } = await supabase
    .from("order_timelapses")
    .select("id, slug, etsy_order_id, created_at, customers(name, email)")
    .order("created_at", { ascending: false })
    .returns<TimelapseRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Timelapses</h1>
        <Link href="/admin/timelapses/new" className="bg-black px-4 py-2 text-sm font-medium text-white">
          New timelapse
        </Link>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      {error && <p className="text-sm text-red-600">Couldn&apos;t load timelapses: {error.message}</p>}
      {!error && (timelapses?.length ?? 0) === 0 && <p className="text-sm text-black/60">No timelapses yet.</p>}

      {!error && (timelapses?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="py-2 pr-4 font-medium">Etsy order</th>
              <th className="py-2 pr-4 font-medium">Link</th>
              <th className="py-2 pr-4 font-medium">Created</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {timelapses!.map((timelapse) => (
              <tr key={timelapse.id} className="border-b border-black/5">
                <td className="py-3 pr-4 font-medium">
                  <Link href={`/admin/timelapses/${timelapse.id}`} className="hover:underline">
                    {timelapse.customers?.name || timelapse.customers?.email || "—"}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-black/60">{timelapse.etsy_order_id}</td>
                <td className="py-3 pr-4 text-black/60">/timelapse/{timelapse.slug}</td>
                <td className="py-3 pr-4 text-black/60">
                  {new Date(timelapse.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="py-3 text-right">
                  <form action={deleteTimelapseFromListAction}>
                    <input type="hidden" name="id" value={timelapse.id} />
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
