import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Client-side admin check (queries user_roles via browser Supabase client).
 * This is a convenience check for UI gating. It is NOT a security boundary —
 * server-side verification via /api/admin/verify is the authoritative check.
 */
export async function requireAdminClient() {
  const sb = supabaseBrowser();
  const { data } = await sb.auth.getUser();
  const user = data.user;

  if (!user) return { ok: false as const, reason: "not_signed_in" as const };

  const { data: roles, error } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (error) return { ok: false as const, reason: "role_check_failed" as const, error };

  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) return { ok: false as const, reason: "not_admin" as const };

  return { ok: true as const, userId: user.id };
}

/**
 * Server-verified admin check. Calls /api/admin/verify which validates the JWT
 * and checks the admin role using the service role key (bypasses RLS).
 *
 * SECURITY: This is the authoritative admin check. Use this instead of or in
 * addition to requireAdminClient() for any admin page that loads sensitive data.
 */
export async function requireAdminServer(): Promise<
  | { ok: true; userId: string }
  | { ok: false; reason: "not_signed_in" | "not_admin" | "verification_failed" }
> {
  const sb = supabaseBrowser();
  const { data: sessionData } = await sb.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    return { ok: false, reason: "not_signed_in" };
  }

  try {
    const res = await fetch("/api/admin/verify", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401) return { ok: false, reason: "not_signed_in" };
    if (res.status === 403) return { ok: false, reason: "not_admin" };
    if (!res.ok) return { ok: false, reason: "verification_failed" };

    const { data } = await sb.auth.getUser();
    return { ok: true, userId: data.user!.id };
  } catch {
    return { ok: false, reason: "verification_failed" };
  }
}
