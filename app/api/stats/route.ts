import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/stats
 *
 * Returns platform-wide stats (total submitted attempts, practice, exams).
 * Uses the service-role key so RLS is bypassed — counts ALL users' data.
 * No auth required (public landing page stat).
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const [totalRes, practiceRes, examRes] = await Promise.all([
      sb.from("attempts").select("*", { head: true, count: "exact" }).eq("status", "submitted"),
      sb.from("attempts").select("*", { head: true, count: "exact" }).eq("status", "submitted").eq("mode", "practice"),
      sb.from("attempts").select("*", { head: true, count: "exact" }).eq("status", "submitted").eq("mode", "exam"),
    ]);

    return NextResponse.json({
      totalAttempts: totalRes.count ?? 0,
      totalPractice: practiceRes.count ?? 0,
      totalExams: examRes.count ?? 0,
    });
  } catch {
    return NextResponse.json({ totalAttempts: 0, totalPractice: 0, totalExams: 0 });
  }
}
