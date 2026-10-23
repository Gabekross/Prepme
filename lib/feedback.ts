import { supabaseBrowser } from "@/lib/supabase/browser";

export type FeedbackKind = "general" | "technical" | "complaint" | "accessibility" | "suggestion" | "post_exam";

export type FeedbackPayload = {
  kind: FeedbackKind;
  message?: string;
  overallRating?: number;
  questionQualityRating?: number;
  explanationHelpfulnessRating?: number;
  pagePath: string;
  attemptId?: string;
  bankSlug?: string;
  setId?: string;
  allowContact?: boolean;
};

export async function submitFeedback(payload: FeedbackPayload) {
  const { data } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in to send feedback.");
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Viewport-Width": String(window.innerWidth) },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not send feedback.");
  return result as { ok: true; alreadySubmitted?: boolean };
}
