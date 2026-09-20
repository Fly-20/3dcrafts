import { createClient } from "@supabase/supabase-js";

/**
 * Anon-key Supabase client for public Server Components (shop listing/detail
 * pages). No cookie/session handling needed — these reads are unauthenticated
 * and scoped by the public RLS policies in `0001_phase1_schema.sql`.
 */
export function createPublicServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
