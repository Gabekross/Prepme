import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseFromToken } from "@/lib/supabase/server";
import type { Attempt } from "@/src/exam-engine/core/types";
import { questionFromVersionRow } from "@/src/exam-engine/data/questionVersioning";

export const dynamic = "force-dynamic";

/**
 * Returns immutable question content for a submitted attempt owned by the
 * caller. Active attempts never receive answer keys through this endpoint.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userSb = supabaseFromToken(token);
  const { data: userData, error: userError } = await userSb.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: attemptRow, error: attemptError } = await admin
    .from("attempts")
    .select("bank_slug,status,submitted_at,result,state")
    .eq("id", params.attemptId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (attemptError || !attemptRow) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  const attempt = attemptRow.state as Attempt;
  // Older completed attempts can retain an in_progress status after a late
  // autosave. Any persisted completion marker seals the attempt for review.
  if (attemptRow.status !== "submitted" && !attemptRow.submitted_at && !attempt?.submittedAt && !attemptRow.result) {
    return NextResponse.json({ error: "Question review is available after submission" }, { status: 403 });
  }

  const { data: bankData } = await admin
    .from("question_banks")
    .select("id")
    .eq("slug", attemptRow.bank_slug)
    .single();
  if (!bankData) return NextResponse.json({ error: "Bank not found" }, { status: 404 });

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
  if (versionError) return NextResponse.json({ error: "Unable to load attempt content" }, { status: 500 });

  const snapshots = new Map(
    (versionRows ?? []).map((row: any) => [`${row.question_key}:${row.version}`, questionFromVersionRow(row)])
  );
  const missing = refs.filter((ref) => !snapshots.has(`${ref.id}:${ref.version ?? 1}`));
  if (missing.length) {
    return NextResponse.json({ error: "This attempt's historical question version is unavailable" }, { status: 409 });
  }

  return NextResponse.json({
    questions: refs.map((ref) => snapshots.get(`${ref.id}:${ref.version ?? 1}`)),
  });
}
