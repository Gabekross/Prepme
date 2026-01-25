import { supabaseBrowser } from "@/lib/supabase/browser";

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
