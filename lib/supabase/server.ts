import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key.
 * Use this in API routes for operations that need to bypass RLS
 * (e.g. server-side scoring validation).
 *
 * IMPORTANT: Never expose this client to the browser.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Server-side Supabase client scoped to a specific user's JWT.
 * Use this in API routes for user-scoped operations with RLS.
 */
export function supabaseFromToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
