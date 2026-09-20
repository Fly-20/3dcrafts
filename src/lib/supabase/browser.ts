import { createBrowserClient } from "@supabase/ssr";

/**
 * Anon-key Supabase client for use in client components. Only ever reads
 * data exposed by RLS policies (published catalogue) — pricing/checkout
 * logic must go through server route handlers, not this client.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createBrowserClient(url, anonKey);
}
