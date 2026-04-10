import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseFromToken } from "@/lib/supabase/server";
import { scoreAttempt } from "@/src/exam-engine/core/scoring";
import type { Attempt, Question } from "@/src/exam-engine/core/types";

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
    const { attempt, bankSlug } = body as {
      attempt: Attempt;
      bankSlug: string;
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

    const { data: questions } = await admin
      .from("questions")
      .select("*")
      .eq("bank_id", bankData.id);

    if (!questions?.length) {
      return NextResponse.json(
        { error: "No questions found for bank" },
        { status: 404 }
      );
    }

    // Map Supabase rows to Question type
    const mappedQuestions: Question[] = questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      domain: q.domain,
      prompt: q.prompt,
      scenarioId: q.scenario_id ?? undefined,
      tags: q.tags ?? [],
      difficulty: q.difficulty,
      accessTier: q.access_tier ?? "free",
      setId: q.set_id ?? undefined,
      version: q.version ?? 1,
      media: q.media ?? undefined,
      explanation: q.explanation ?? undefined,
      payload: q.payload,
      answerKey: q.answer_key,
    }));

    // Filter to only questions in the attempt
    const attemptQuestions = mappedQuestions.filter((q) =>
      attempt.questionOrder.includes(q.id)
    );

    if (attemptQuestions.length === 0) {
      // Fallback: the attempt might use seed data not in Supabase
      // In this case, return an error and let the client handle scoring
      return NextResponse.json(
        { error: "Questions not found in server bank — use client scoring" },
        { status: 422 }
      );
    }

    // Score the attempt server-side
    const result = scoreAttempt(attempt, attemptQuestions);
    const passThreshold = attempt.blueprint.passThreshold ?? 70;
    // Use question-level counts for pass/fail (not raw points)
    const questionsCorrect = result.scoreResults.filter((sr) => sr.isCorrect).length;
    const questionsTotal = result.scoreResults.length;
    const scorePercent =
      questionsTotal > 0
        ? Math.round((questionsCorrect / questionsTotal) * 10000) / 100
        : 0;
    const passed = scorePercent >= passThreshold;

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
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("[submit] Failed to persist result:", upsertError.message);
      // Still return the result even if persistence fails
    }

    return NextResponse.json({
      result,
      passed,
      scorePercent,
    });
  } catch (e: any) {
    console.error("[submit] Unexpected error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
