"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Attempt, AttemptResult, Question } from "@/src/exam-engine/core/types";
import { loadSubmittedAttemptQuestions } from "@/src/exam-engine/data/loadAttemptQuestions";
import { DetailedResultsReport } from "@/src/exam-engine/ui/DetailedResultsReport";

type AttemptRow = {
  id: string;
  bank_slug: string;
  mode: "practice" | "exam";
  set_id: string | null;
  result: AttemptResult | null;
  state: Attempt;
  submitted_at: string | null;
};

export default function ResultsClient({ attemptId }: { attemptId: string }) {
  const { user, loading: authLoading } = useAuth();
  const sb = useMemo(() => supabaseBrowser(), []);
  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setAttempt(null);
    setQuestions([]);
    setError("");
    if (!user) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data, error: fetchError } = await sb.from("attempts")
          .select("id,bank_slug,mode,set_id,result,state,submitted_at")
          .eq("id", attemptId).eq("user_id", user.id).single();
        if (fetchError || !data) throw new Error("This attempt was not found for your account.");
        const row = data as AttemptRow;
        if (!row.submitted_at && !row.state?.submittedAt && !row.result) {
          throw new Error("Submit this attempt before viewing its detailed report.");
        }
        if (!Array.isArray(row.state?.questionOrder)) throw new Error("This attempt's question order is unavailable.");
        if (cancelled) return;
        setAttempt(row);
        // The protected endpoint returns this owner's immutable question versions,
        // never today's mutable bank. No new permissions or RLS bypass is needed.
        const historical = await loadSubmittedAttemptQuestions(attemptId);
        if (!cancelled) setQuestions(historical);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load this report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [attemptId, authLoading, user?.id, sb, request]);

  if (authLoading || loading) return <p role="status">Loading your detailed report…</p>;
  if (!user) return <p>Sign in to the account that submitted this exam. <Link href="/login">Sign in</Link></p>;
  if (error) return <section role="alert"><h1>Report unavailable</h1><p>{error}</p><button onClick={() => setRequest(n => n + 1)}>Retry report</button> <Link href="/dashboard">Back to dashboard</Link></section>;
  if (!attempt) return <p>Attempt not found.</p>;
  if (!attempt.result || !Array.isArray(attempt.result.scoreResults) || !attempt.result.scoreResults.length) {
    return <section><h1>Detailed scoring unavailable</h1><p>This saved attempt has no scoring breakdown. Its available questions can still be reviewed.</p><Link href={`/dashboard/results/${attemptId}/review`}>Review questions and explanations</Link></section>;
  }
  const setLabel = (attempt.set_id ?? "Practice").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return <DetailedResultsReport attemptId={attemptId} bankSlug={attempt.bank_slug}
    setLabel={setLabel} mode={attempt.mode} submittedAt={attempt.submitted_at}
    result={attempt.result} state={attempt.state} questions={questions} />;
}
