import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Per-request Supabase client bound to the signed-in admin's session cookies
 * (via the anon key + RLS), for use in Server Components/Actions under
 * `src/app/admin`. Unlike `createServiceRoleClient`, this respects the admin
 * RLS policies in `0002_admin_rls_and_storage.sql` — reads/writes only
 * succeed if the signed-in user is in `admin_users`.
 */
export async function createServerAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render (cookies are read-only there) —
          // proxy.ts refreshes the session on the way in instead.
        }
      },
    },
  });
}
