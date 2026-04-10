import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _instance: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase browser client.
 *
 * Using a singleton ensures:
 * 1. The auth session (stored in localStorage) is loaded once and shared
 * 2. No "multiple GoTrueClient instances" warnings
 * 3. All code (AuthProvider, storage, components) shares the same auth state
 */
export function supabaseBrowser(): SupabaseClient {
  if (_instance) return _instance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  _instance = createClient(url, anon);
  return _instance;
}
