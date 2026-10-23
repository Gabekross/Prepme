import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseFromToken } from "@/lib/supabase/server";

const kinds = new Set(["general", "technical", "complaint", "accessibility", "suggestion", "post_exam"]);
const rating = (value: unknown) => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Please sign in to send feedback." }, { status: 401 });
  const userClient = supabaseFromToken(token);
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Your session has expired." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const kind = text(body?.kind, 30);
  const message = text(body?.message, 4000);
  const pagePath = text(body?.pagePath, 500);
  if (!kinds.has(kind) || !pagePath.startsWith("/")) return NextResponse.json({ error: "Invalid feedback details." }, { status: 400 });
  if (kind === "post_exam") {
    if (!rating(body.overallRating) || !rating(body.questionQualityRating) || !rating(body.explanationHelpfulnessRating)) {
      return NextResponse.json({ error: "Please rate all three areas." }, { status: 400 });
    }
  } else if (message.length < 5) {
    return NextResponse.json({ error: "Please add a little more detail." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("user_feedback").select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id).gte("created_at", oneHourAgo);
  if ((count ?? 0) >= 20) return NextResponse.json({ error: "Feedback limit reached. Please try again later." }, { status: 429 });

  const width = Number(req.headers.get("x-viewport-width"));
  const deviceType = Number.isFinite(width) ? (width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop") : "unknown";
  const row = {
    user_id: auth.user.id, kind, message: message || null,
    overall_rating: kind === "post_exam" ? body.overallRating : null,
    question_quality_rating: kind === "post_exam" ? body.questionQualityRating : null,
    explanation_helpfulness_rating: kind === "post_exam" ? body.explanationHelpfulnessRating : null,
    page_path: pagePath, attempt_id: text(body.attemptId, 120) || null,
    bank_slug: text(body.bankSlug, 80) || null, set_id: text(body.setId, 80) || null,
    device_type: deviceType, allow_contact: body.allowContact === true,
  };
  const { error } = await userClient.from("user_feedback").insert(row);
  if (error?.code === "23505") return NextResponse.json({ ok: true, alreadySubmitted: true });
  if (error) {
    console.error("[feedback] insert failed", error.message);
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
