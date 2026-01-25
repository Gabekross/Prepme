import { createClient } from "@supabase/supabase-js";

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  return createClient(url, anon);
}
