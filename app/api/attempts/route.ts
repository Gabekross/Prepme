import { NextRequest, NextResponse } from "next/server";
import { supabaseFromToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/attempts?bankSlug=pmp&mode=exam&status=submitted
 *
 * Returns the authenticated user's attempts, optionally filtered.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = supabaseFromToken(token);
    const { data: userData, error: userError } = await sb.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Build query from search params
    const { searchParams } = req.nextUrl;
    const bankSlug = searchParams.get("bankSlug");
    const mode = searchParams.get("mode");
    const status = searchParams.get("status");

    let query = sb
      .from("attempts")
      .select(
        "id, bank_slug, mode, set_id, status, total_score, max_score, score_percent, passed, created_at, updated_at, submitted_at"
      )
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (bankSlug) query = query.eq("bank_slug", bankSlug);
    if (mode) query = query.eq("mode", mode);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ attempts: data });
  } catch (e: any) {
    console.error("[attempts] Unexpected error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
