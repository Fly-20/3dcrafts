import { requireAdmin } from "@/lib/admin-auth";
import { logout } from "../actions";
import { AdminNav } from "./admin-nav";

// Always render per-request (auth check + live DB reads) — also avoids the
// build attempting to prerender this route when Supabase env vars aren't
// configured yet, since it never gets far enough to hit cookies()/skip static.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-white text-black">
      <aside className="flex w-56 flex-none flex-col justify-between border-r border-black/10 bg-black/[.02] px-4 py-5">
        <div className="flex flex-col gap-6">
          <span className="px-2 text-sm font-semibold">3DCRAFTS admin</span>
          <AdminNav />
        </div>
        <div className="flex flex-col gap-2 border-t border-black/10 pt-4 text-xs text-black/60">
          <span className="px-2">
            {session.name || session.email} · {session.role}
          </span>
          <form action={logout}>
            <button type="submit" className="w-full border border-black/20 px-3 py-1.5 text-left hover:border-black">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto px-8 py-8">{children}</main>
    </div>
  );
}
