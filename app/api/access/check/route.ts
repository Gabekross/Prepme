import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseFromToken } from "@/lib/supabase/server";
import {
  FREE_EXAM_SET_ID,
  EXAM_EXPIRY_GRACE_MINUTES,
  FREE_PRACTICE_LIFETIME_LIMIT,
  FREE_PRACTICE_SESSION_LIMIT,
  PRACTICE_ABANDON_AFTER_DAYS,
  buildAccessMessage,
  freePracticeRemaining,
  isFreeExamSet,
  normalizeSetId,
  type AccessReason,
} from "@/src/access/freeLimits";

export const dynamic = "force-dynamic";

type AccessResponse = {
  allowed: boolean;
  reason: AccessReason;
  message: string;
  isPro: boolean;
  remainingPracticeQuestions: number;
  freePracticeQuestionsUsed: number;
  freeSetAStartedAt: string | null;
};

function jsonResponse(data: AccessResponse, status = 200) {
  return NextResponse.json(data, { status });
}

async function getUsage(admin: ReturnType<typeof supabaseAdmin>, userId: string) {
  const { data, error } = await admin
    .from("user_usage")
    .select("free_practice_questions_used, free_set_a_started_at, free_set_a_attempt_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return {
    freePracticeQuestionsUsed: Number(data?.free_practice_questions_used ?? 0),
    freeSetAStartedAt: (data?.free_set_a_started_at as string | null) ?? null,
    freeSetAAttemptId: (data?.free_set_a_attempt_id as string | null) ?? null,
  };
}

async function userIsPro(admin: ReturnType<typeof supabaseAdmin>, userId: string) {
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["pro", "admin"]);

  if (error) throw error;
  return (data ?? []).length > 0;
}

async function hasAnySetAAttempt(admin: ReturnType<typeof supabaseAdmin>, userId: string) {
  const { data, error } = await admin
    .from("attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("mode", "exam")
    .eq("set_id", FREE_EXAM_SET_ID)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

async function ensureUsageRow(admin: ReturnType<typeof supabaseAdmin>, userId: string) {
  const { error } = await admin
    .from("user_usage")
    .upsert({ user_id: userId }, { onConflict: "user_id" });

  if (error) throw error;
}

async function abandonStaleAttempts(admin: ReturnType<typeof supabaseAdmin>, userId: string) {
  const now = Date.now();
  const examCutoff = new Date(now - (230 + EXAM_EXPIRY_GRACE_MINUTES) * 60 * 1000).toISOString();
  const practiceCutoff = new Date(now - PRACTICE_ABANDON_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await admin
    .from("attempts")
    .update({ status: "abandoned" })
    .eq("user_id", userId)
    .eq("mode", "exam")
    .eq("status", "in_progress")
    .lt("updated_at", examCutoff);

  await admin
    .from("attempts")
    .update({ status: "abandoned" })
    .eq("user_id", userId)
    .eq("mode", "practice")
    .eq("status", "in_progress")
    .lt("updated_at", practiceCutoff);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const mode = body?.mode as "practice" | "exam" | undefined;
    const requestedQuestionCount = Number(body?.requestedQuestionCount ?? 0);
    const setId = normalizeSetId(body?.setId);
    const consume = body?.consume === true;
    const attemptId = typeof body?.attemptId === "string" ? body.attemptId : null;

    const userSb = supabaseFromToken(token);
    const { data: userData, error: userError } = await userSb.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (mode !== "practice" && mode !== "exam") {
      const reason: AccessReason = "INVALID_REQUEST";
      return jsonResponse({
        allowed: false,
        reason,
        message: buildAccessMessage(reason),
        isPro: false,
        remainingPracticeQuestions: 0,
        freePracticeQuestionsUsed: 0,
        freeSetAStartedAt: null,
      }, 400);
    }

    const userId = userData.user.id;
    const admin = supabaseAdmin();
    await abandonStaleAttempts(admin, userId);
    const isPro = await userIsPro(admin, userId);

    if (isPro) {
      const usage = await getUsage(admin, userId).catch(() => ({
        freePracticeQuestionsUsed: 0,
        freeSetAStartedAt: null,
        freeSetAAttemptId: null,
      }));
      return jsonResponse({
        allowed: true,
        reason: "ALLOWED",
        message: "",
        isPro,
        remainingPracticeQuestions: FREE_PRACTICE_LIFETIME_LIMIT,
        freePracticeQuestionsUsed: usage.freePracticeQuestionsUsed,
        freeSetAStartedAt: usage.freeSetAStartedAt,
      });
    }

    await ensureUsageRow(admin, userId);
    const usage = await getUsage(admin, userId);
    let reason: AccessReason = "ALLOWED";
    let allowed = true;
    let remainingPracticeQuestions = freePracticeRemaining(usage.freePracticeQuestionsUsed);

    if (mode === "practice") {
      if (!Number.isFinite(requestedQuestionCount) || requestedQuestionCount < 1) {
        reason = "INVALID_REQUEST";
        allowed = false;
      } else if (requestedQuestionCount > FREE_PRACTICE_SESSION_LIMIT) {
        reason = "FREE_PRACTICE_SESSION_LIMIT";
        allowed = false;
      } else if (requestedQuestionCount > remainingPracticeQuestions) {
        reason = "FREE_PRACTICE_LIMIT_REACHED";
        allowed = false;
      }
    }

    if (mode === "exam") {
      const alreadyUsedSetA =
        !!usage.freeSetAStartedAt || (setId === FREE_EXAM_SET_ID && await hasAnySetAAttempt(admin, userId));

      if (!setId) {
        reason = "INVALID_REQUEST";
        allowed = false;
      } else if (!isFreeExamSet(setId)) {
        reason = "PRO_REQUIRED";
        allowed = false;
      } else if (alreadyUsedSetA) {
        reason = "FREE_SET_A_USED";
        allowed = false;
      }
    }

    if (allowed && consume) {
      if (mode === "exam" && setId === FREE_EXAM_SET_ID) {
        const { data, error } = await admin
          .from("user_usage")
          .update({
            free_set_a_started_at: new Date().toISOString(),
            free_set_a_attempt_id: attemptId,
          })
          .eq("user_id", userId)
          .is("free_set_a_started_at", null)
          .select("free_set_a_started_at")
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          reason = "FREE_SET_A_USED";
          allowed = false;
        }
      }
    }

    const refreshed = await getUsage(admin, userId);
    remainingPracticeQuestions = freePracticeRemaining(refreshed.freePracticeQuestionsUsed);

    return jsonResponse({
      allowed,
      reason,
      message: buildAccessMessage(reason, remainingPracticeQuestions),
      isPro,
      remainingPracticeQuestions,
      freePracticeQuestionsUsed: refreshed.freePracticeQuestionsUsed,
      freeSetAStartedAt: refreshed.freeSetAStartedAt,
    }, allowed ? 200 : 403);
  } catch (e: any) {
    console.error("[access/check] Unexpected error:", e?.message ?? "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
