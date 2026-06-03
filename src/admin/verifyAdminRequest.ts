import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseFromToken } from "@/lib/supabase/server";

type AdminResult =
  | { ok: true; admin: ReturnType<typeof supabaseAdmin>; userId: string }
  | { ok: false; response: NextResponse };

export async function verifyAdminRequest(req: NextRequest): Promise<AdminResult> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userSb = supabaseFromToken(token);
  const { data: userData, error: userError } = await userSb.auth.getUser();

  if (userError || !userData.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }

  const admin = supabaseAdmin();
  const { data: roles, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin");

  if (roleError) {
    console.error("[admin] Role check failed:", roleError.message);
    return {
      ok: false,
      response: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }

  if (!roles?.length) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, admin, userId: userData.user.id };
}
