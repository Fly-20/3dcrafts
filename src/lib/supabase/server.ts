import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key. This bypasses Row
 * Level Security, so it must never be imported into client components — use
 * it only from route handlers/server code that need to read or write
 * pricing/order data directly.
 */
export function createServiceRoleClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
