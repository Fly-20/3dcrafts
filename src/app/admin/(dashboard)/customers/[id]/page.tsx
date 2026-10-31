import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { addTagAction, removeTagAction } from "../actions";

type Customer = { id: string; email: string; name: string | null; phone: string | null; tags: string[]; created_at: string };
type TimelapseRow = { id: string; slug: string; etsy_order_id: string; created_at: string };

export default async function CustomerDetailPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();

  const [{ data: customer }, { data: timelapses }, { data: allTags }] = await Promise.all([
    supabase.from("customers").select("id, email, name, phone, tags, created_at").eq("id", id).maybeSingle().returns<Customer | null>(),
    supabase.from("order_timelapses").select("id, slug, etsy_order_id, created_at").eq("customer_id", id).order("created_at", { ascending: false }).returns<TimelapseRow[]>(),
    supabase.from("customers").select("tags").returns<{ tags: string[] }[]>(),
  ]);

  if (!customer) notFound();

  const existingTags = [...new Set((allTags ?? []).flatMap((row) => row.tags))].filter((tag) => !customer.tags.includes(tag));

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{customer.name || customer.email}</h1>
        <p className="text-sm text-black/60">{customer.email}</p>
        {customer.phone && <p className="text-sm text-black/60">{customer.phone}</p>}
        <p className="text-sm text-black/40">Joined {new Date(customer.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>

      <section className="flex flex-col gap-3 border border-black/10 p-5">
        <h2 className="text-sm font-semibold">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {customer.tags.length === 0 && <p className="text-sm text-black/50">No tags yet.</p>}
          {customer.tags.map((tag) => (
            <form key={tag} action={removeTagAction} className="flex items-center gap-1 border border-black/15 py-1 pr-1 pl-2 text-xs">
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="tag" value={tag} />
              <span>{tag}</span>
              <button type="submit" aria-label={`Remove ${tag}`} className="px-1 text-black/40 hover:text-red-600">
                ×
              </button>
            </form>
          ))}
        </div>

        <form action={addTagAction} className="flex items-end gap-2">
          <input type="hidden" name="customerId" value={customer.id} />
          <label className="flex flex-col gap-1 text-sm">
            Add tag
            <input name="tag" list="existing-tags" placeholder="e.g. Website customer" className="border border-black/20 px-3 py-2" />
            <datalist id="existing-tags">
              {existingTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </label>
          <button type="submit" className="border border-black bg-black px-4 py-2 text-sm font-medium text-white">
            Add
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 border border-black/10 p-5">
        <h2 className="text-sm font-semibold">Timelapses</h2>
        {(timelapses?.length ?? 0) === 0 && <p className="text-sm text-black/50">None sent yet.</p>}
        {(timelapses?.length ?? 0) > 0 && (
          <ul className="flex flex-col gap-2 text-sm">
            {timelapses!.map((timelapse) => (
              <li key={timelapse.id} className="flex items-center justify-between border-b border-black/5 pb-2">
                <Link href={`/admin/timelapses/${timelapse.id}`} className="hover:underline">
                  Order #{timelapse.etsy_order_id} — /timelapse/{timelapse.slug}
                </Link>
                <span className="text-black/40">{new Date(timelapse.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
