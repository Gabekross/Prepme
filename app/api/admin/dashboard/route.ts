import { NextRequest, NextResponse } from "next/server";
import { supabaseFromToken, supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dashboard
 *
 * Returns comprehensive business metrics for the admin dashboard.
 * Requires Bearer token auth + admin role verification.
 *
 * Metrics returned:
 *   Users & Growth    — total, new (7d/30d), active (7d), pro count, conversion rate
 *   Engagement        — sessions by mode, avg score, pass rate, completion rate,
 *                       per-set breakdowns, daily activity (last 30d)
 *   Revenue Signals   — pro subscribers, conversion %, inactive pro users (churn risk)
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth gate ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userSb = supabaseFromToken(token);
    const { data: userData, error: userError } = await userSb.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify admin role
    const admin = supabaseAdmin();
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin");

    if (!roles?.length) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Compute date boundaries ────────────────────────────────────────
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

    // ── Users & Growth ─────────────────────────────────────────────────
    // Fetch users page-by-page (Supabase caps at 1000 per page)
    let allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: batch, error: listErr } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listErr || !batch?.users?.length) break;
      allUsers = allUsers.concat(batch.users);
      if (batch.users.length < perPage) break;
      page++;
    }

    const totalUsers = allUsers.length;
    const newUsers7d = allUsers.filter(
      (u) => u.created_at && u.created_at >= d7
    ).length;
    const newUsers30d = allUsers.filter(
      (u) => u.created_at && u.created_at >= d30
    ).length;

    // ── Pro subscribers ────────────────────────────────────────────────
    const { data: proRoles } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "pro");

    const proUserIds = new Set((proRoles ?? []).map((r: any) => r.user_id));
    const totalPro = proUserIds.size;
    const conversionRate =
      totalUsers > 0 ? Math.round((totalPro / totalUsers) * 10000) / 100 : 0;

    // ── Attempts data (all submitted) ──────────────────────────────────
    const { data: attempts } = await admin
      .from("attempts")
      .select(
        "id, user_id, mode, set_id, status, score_percent, passed, created_at, submitted_at"
      )
      .order("created_at", { ascending: false })
      .limit(10000);

    const allAttempts = attempts ?? [];
    const submitted = allAttempts.filter((a: any) => a.status === "submitted");
    const abandoned = allAttempts.filter((a: any) => a.status === "abandoned");
    const inProgress = allAttempts.filter(
      (a: any) => a.status === "in_progress"
    );

    const totalSubmitted = submitted.length;
    const totalAbandoned = abandoned.length;
    const totalInProgress = inProgress.length;

    // Sessions by mode
    const practiceSubmitted = submitted.filter(
      (a: any) => a.mode === "practice"
    ).length;
    const examSubmitted = submitted.filter(
      (a: any) => a.mode === "exam"
    ).length;

    // Completion rate (submitted / (submitted + abandoned))
    const startedTotal = totalSubmitted + totalAbandoned;
    const completionRate =
      startedTotal > 0
        ? Math.round((totalSubmitted / startedTotal) * 10000) / 100
        : 0;

    // Average score & pass rate
    const scores = submitted
      .map((a: any) => a.score_percent)
      .filter((s: any) => s != null) as number[];
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0;

    const passCount = submitted.filter((a: any) => a.passed === true).length;
    const passRate =
      totalSubmitted > 0
        ? Math.round((passCount / totalSubmitted) * 10000) / 100
        : 0;

    // Active users (distinct users with attempts in last 7 days)
    const recent7d = allAttempts.filter((a: any) => a.created_at >= d7);
    const activeUsers7d = new Set(recent7d.map((a: any) => a.user_id)).size;

    const recent30d = allAttempts.filter((a: any) => a.created_at >= d30);
    const activeUsers30d = new Set(recent30d.map((a: any) => a.user_id)).size;

    // ── Per-set breakdown ──────────────────────────────────────────────
    const setMap: Record<
      string,
      { total: number; passed: number; scores: number[] }
    > = {};
    for (const a of submitted) {
      const key = (a as any).set_id ?? "free";
      if (!setMap[key]) setMap[key] = { total: 0, passed: 0, scores: [] };
      setMap[key].total++;
      if ((a as any).passed) setMap[key].passed++;
      if ((a as any).score_percent != null)
        setMap[key].scores.push((a as any).score_percent);
    }

    const setBreakdown = Object.entries(setMap).map(([setId, data]) => ({
      setId,
      totalSessions: data.total,
      passRate:
        data.total > 0
          ? Math.round((data.passed / data.total) * 10000) / 100
          : 0,
      avgScore:
        data.scores.length > 0
          ? Math.round(
              (data.scores.reduce((a, b) => a + b, 0) / data.scores.length) *
                100
            ) / 100
          : 0,
    }));

    // ── Daily activity (last 30 days) ──────────────────────────────────
    const dailyMap: Record<string, { sessions: number; users: Set<string> }> =
      {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { sessions: 0, users: new Set() };
    }

    for (const a of recent30d) {
      const day = ((a as any).created_at as string).slice(0, 10);
      if (dailyMap[day]) {
        dailyMap[day].sessions++;
        dailyMap[day].users.add((a as any).user_id);
      }
    }

    const dailyActivity = Object.entries(dailyMap)
      .map(([date, data]) => ({
        date,
        sessions: data.sessions,
        uniqueUsers: data.users.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Churn risk: pro users with no activity in 30d ──────────────────
    const activeUserIds30d = new Set(recent30d.map((a: any) => a.user_id));
    const inactiveProUsers = [...proUserIds].filter(
      (uid) => !activeUserIds30d.has(uid)
    ).length;

    // ── Avg sessions per active user ───────────────────────────────────
    const avgSessionsPerUser =
      activeUsers30d > 0
        ? Math.round((recent30d.length / activeUsers30d) * 100) / 100
        : 0;

    // ── Mode split for recent 30d ──────────────────────────────────────
    const recentPractice30d = recent30d.filter(
      (a: any) => a.mode === "practice"
    ).length;
    const recentExam30d = recent30d.filter(
      (a: any) => a.mode === "exam"
    ).length;

    return NextResponse.json({
      // Users & Growth
      users: {
        total: totalUsers,
        new7d: newUsers7d,
        new30d: newUsers30d,
        active7d: activeUsers7d,
        active30d: activeUsers30d,
      },

      // Revenue & Subscriptions
      revenue: {
        totalPro,
        conversionRate,
        inactiveProUsers,
        churnRiskPct:
          totalPro > 0
            ? Math.round((inactiveProUsers / totalPro) * 10000) / 100
            : 0,
      },

      // Engagement
      engagement: {
        totalSubmitted,
        totalAbandoned,
        totalInProgress,
        practiceSubmitted,
        examSubmitted,
        completionRate,
        avgScore,
        passRate,
        avgSessionsPerUser,
      },

      // Trends
      trends: {
        dailyActivity,
        recentPractice30d,
        recentExam30d,
      },

      // Per-set breakdown
      setBreakdown,
    });
  } catch (err: any) {
    console.error("Admin dashboard error:", err?.message ?? "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
