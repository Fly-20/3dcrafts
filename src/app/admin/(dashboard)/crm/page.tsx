import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { formatPence } from "@/lib/money";
import { CHANNEL_LABELS, projectStatusLabel } from "@/lib/project-status";

type ProjectRow = {
  id: string;
  title: string;
  channel: string;
  status: string;
  updated_at: string;
  customers: { name: string | null; etsy_username: string | null; email: string | null } | null;
  quotes: { version: number; total_pence: number }[];
};

export default async function EnquiriesPage() {
  const supabase = await createServerAuthClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, channel, status, updated_at, customers(name, etsy_username, email), quotes(version, total_pence)")
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<ProjectRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Enquiries</h1>
        <Link href="/admin/crm/new" className="bg-black px-4 py-2 text-sm font-medium text-white">
          New quote
        </Link>
      </div>
      <p className="text-sm text-black/60">Paste a customer message into New quote to price it and draft a reply. Nothing is ever sent from here.</p>

      {error && (
        <p className="text-sm text-red-600">
          Couldn&apos;t load enquiries{error.code === "42P01" || /relation|schema cache/i.test(error.message) ? ": migration 0007 hasn't been applied yet." : `: ${error.message}`}
        </p>
      )}
      {!error && (projects?.length ?? 0) === 0 && <p className="text-sm text-black/60">No enquiries saved yet.</p>}

      {!error && (projects?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Job</th>
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="py-2 pr-4 font-medium">Channel</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Latest quote</th>
              <th className="py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {projects!.map((project) => {
              const latest = [...project.quotes].sort((a, b) => b.version - a.version)[0];
              const customer = project.customers;
              return (
                <tr key={project.id} className="border-b border-black/5">
                  <td className="py-3 pr-4 font-medium">
                    <Link href={`/admin/crm/${project.id}`} className="hover:underline">
                      {project.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-black/60">{customer?.name || customer?.etsy_username || customer?.email || "—"}</td>
                  <td className="py-3 pr-4 text-black/60">{CHANNEL_LABELS[project.channel] ?? project.channel}</td>
                  <td className="py-3 pr-4 text-black/60">{projectStatusLabel(project.status)}</td>
                  <td className="py-3 pr-4 text-black/60">{latest ? `${formatPence(latest.total_pence)} (v${latest.version})` : "—"}</td>
                  <td className="py-3 text-black/60">{new Date(project.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
