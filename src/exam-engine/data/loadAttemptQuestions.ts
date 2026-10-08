import type { Question } from "../core/types";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** Load answer-bearing question snapshots only after the owner has submitted. */
export async function loadSubmittedAttemptQuestions(attemptId: string): Promise<Question[]> {
  const { data } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in is required to review an attempt.");

  const response = await fetch(`/api/attempts/${encodeURIComponent(attemptId)}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Unable to load historical question content.");
  }
  const body = await response.json();
  return body.questions as Question[];
}
