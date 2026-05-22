import { NextRequest, NextResponse } from "next/server";
import { supabaseFromToken, supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/verify
 *
 * Server-side admin verification endpoint. Validates the caller's JWT
 * and checks for the "admin" role in user_roles using the service role key
 * (bypasses RLS to ensure the check can't be tampered with client-side).
 *
 * Returns { isAdmin: true } or a 401/403 error.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate the JWT and get the user
    const userSb = supabaseFromToken(token);
    const { data: userData, error: userError } = await userSb.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check admin role using the service role key (bypasses RLS)
    const admin = supabaseAdmin();
    const { data: roles, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin");

    if (roleError) {
      console.error("Admin role check failed:", roleError.message);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const isAdmin = (roles ?? []).length > 0;

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ isAdmin: true });
  } catch (err: any) {
    console.error("Admin verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
