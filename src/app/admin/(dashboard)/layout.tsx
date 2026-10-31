import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { BrandMark } from "@/app/components/shop-nav";
import { logout } from "../actions";
import { AdminNav } from "./admin-nav";

// Always render per-request (auth check + live DB reads) — also avoids the
// build attempting to prerender this route when Supabase env vars aren't
// configured yet, since it never gets far enough to hit cookies()/skip static.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-white text-black">
      <aside className="flex w-56 flex-none flex-col justify-between border-r border-black/10 bg-black/[.02] px-4 py-5">
        <div className="flex flex-col gap-6">
          <span className="flex items-center gap-2 px-2 text-sm font-semibold">
            <BrandMark size={20} />
            3DCRAFTS admin
          </span>
          <AdminNav />
        </div>
        <div className="flex flex-col gap-2 border-t border-black/10 pt-4 text-xs text-black/60">
          <Link href="/admin/account" className="px-2 py-1 hover:text-black hover:underline">
            Account
          </Link>
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
