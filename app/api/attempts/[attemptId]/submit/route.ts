import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseFromToken } from "@/lib/supabase/server";
import { scoreAttempt } from "@/src/exam-engine/core/scoring";
import type { Attempt, Question } from "@/src/exam-engine/core/types";
import { questionFromVersionRow } from "@/src/exam-engine/data/questionVersioning";

/**
 * POST /api/attempts/[attemptId]/submit
 *
 * Server-side scoring endpoint. Receives the attempt state, loads the
 * question bank server-side, scores the attempt, and persists the result.
 *
 * This prevents client-side score manipulation.
 *
 * Body: { attempt: Attempt, bankSlug: string }
 * Returns: { result: AttemptResult, passed: boolean, scorePercent: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    // Extract auth token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { attempt, bankSlug, passThreshold: requestedPassThreshold } = body as {
      attempt: Attempt;
      bankSlug: string;
      passThreshold?: number;
    };

    if (!attempt || !bankSlug) {
      return NextResponse.json(
        { error: "Missing attempt or bankSlug" },
        { status: 400 }
      );
    }

    if (params.attemptId !== attempt.id) {
      return NextResponse.json(
        { error: "Attempt ID mismatch" },
        { status: 400 }
      );
    }

    // Verify the user
    const userSb = supabaseFromToken(token);
    const { data: userData, error: userError } = await userSb.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;

    // Load questions server-side using admin client (bypasses RLS)
    const admin = supabaseAdmin();
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["pro", "admin"]);
    const isPro = (roleRows ?? []).length > 0;

    const { data: existingAttempt } = await admin
      .from("attempts")
      .select("free_practice_counted_at")
      .eq("id", attempt.id)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: bankData } = await admin
      .from("question_banks")
      .select("id")
      .eq("slug", bankSlug)
      .single();

    if (!bankData) {
      return NextResponse.json(
        { error: "Bank not found" },
        { status: 404 }
      );
    }

    const refs = (attempt.questionRefs?.length
      ? attempt.questionRefs
      : attempt.questionOrder.map((id) => ({ id, version: 1 })))
      .filter((ref) => attempt.questionOrder.includes(ref.id));

    const questionKeys = [...new Set(refs.map((ref) => ref.id))];
    const { data: versionRows, error: versionError } = await admin
      .from("question_versions")
      .select("bank_id,question_key,version,content")
      .eq("bank_id", bankData.id)
      .in("question_key", questionKeys);

    if (versionError) {
      console.error("[submit] Failed to load immutable question versions:", versionError.message);
      return NextResponse.json({ error: "Unable to load attempt content" }, { status: 500 });
    }

    const snapshots = new Map(
      (versionRows ?? []).map((row: any) => [`${row.question_key}:${row.version}`, questionFromVersionRow(row)])
    );
    const missing = refs.filter((ref) => !snapshots.has(`${ref.id}:${ref.version ?? 1}`));
    if (missing.length) {
      return NextResponse.json(
        { error: "This attempt's historical question version is unavailable" },
        { status: 409 }
      );
    }

    const attemptQuestions: Question[] = refs.map(
      (ref) => snapshots.get(`${ref.id}:${ref.version ?? 1}`)!
    );

    // Score the attempt server-side
    const result = scoreAttempt(attempt, attemptQuestions);
    const passThreshold =
      typeof requestedPassThreshold === "number"
        ? requestedPassThreshold
        : ((attempt.blueprint as any).passThreshold ?? 70);
    // Use question-level counts for pass/fail (not raw points)
    const questionsCorrect = result.scoreResults.filter((sr) => sr.isCorrect).length;
    const questionsTotal = result.scoreResults.length;
    const scorePercent =
      questionsTotal > 0
        ? Math.round((questionsCorrect / questionsTotal) * 10000) / 100
        : 0;
    const passed = scorePercent >= passThreshold;
    const shouldCountFreePractice =
      !isPro &&
      attempt.mode === "practice" &&
      !existingAttempt?.free_practice_counted_at &&
      result.answeredCount > 0;

    // Persist to attempts table
    const now = new Date().toISOString();
    const { error: upsertError } = await admin
      .from("attempts")
      .upsert(
        {
          id: attempt.id,
          user_id: userId,
          bank_slug: bankSlug,
          mode: attempt.mode,
          set_id: attempt.blueprint.setId ?? null,
          status: "submitted",
          state: { ...attempt, submittedAt: now },
          result,
          total_score: questionsCorrect,
          max_score: questionsTotal,
          score_percent: scorePercent,
          passed,
          submitted_at: now,
          ...(shouldCountFreePractice ? { free_practice_counted_at: now } : {}),
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("[submit] Failed to persist result:", upsertError.message);
      // Still return the result even if persistence fails
    }

    if (shouldCountFreePractice && !upsertError) {
      const { error: usageError } = await admin.rpc("increment_free_practice_usage", {
        p_user_id: userId,
        p_count: result.answeredCount,
      });

      if (usageError) {
        console.error("[submit] Failed to update free practice usage:", usageError.message);
      }
    }

    return NextResponse.json({
      result,
      passed,
      scorePercent,
    });
  } catch (e: any) {
    console.error("[submit] Unexpected error:", e?.message ?? "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
