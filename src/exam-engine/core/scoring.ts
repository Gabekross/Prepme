import type { Attempt, AttemptResult, Domain, Question, QuestionType, ScoreResult } from "./types";

function norm(s: string) {
  return s.trim();
}

function eqText(a: string, b: string, caseInsensitive?: boolean) {
  const aa = norm(a);
  const bb = norm(b);
  return caseInsensitive ? aa.toLowerCase() === bb.toLowerCase() : aa === bb;
}

/* ── Centralized "was this question actually attempted?" check ───────────── */

/**
 * Returns true only if the user intentionally provided a meaningful response.
 * Used by scoring, analytics, and results to separate "attempted but wrong"
 * from "never touched."
 */
export function isQuestionAttempted(q: Question, response: any): boolean {
  if (!response || typeof response !== "object") return false;

  switch (q.type) {
    case "mcq_single":
      return "choiceId" in response && !!response.choiceId;

    case "mcq_multi":
      return (
        "choiceIds" in response &&
        Array.isArray(response.choiceIds) &&
        response.choiceIds.length > 0
      );

    case "dnd_match":
      // At least one prompt must be mapped to a target
      return (
        "mapping" in response &&
        Object.values(response.mapping ?? {}).some((v: any) => v != null && v !== "")
      );

    case "dnd_order":
      // Only counts as attempted if the user explicitly interacted.
      // The UI initializes DnD-order with the default item order, so we
      // check for the `userInteracted` flag the component sets on drag.
      // If the flag is missing (legacy data), fall back to checking
      // whether the response has orderedIds AND differs from the
      // question's default item order (payload.items).
      if ("userInteracted" in response) return !!response.userInteracted;
      if (!("orderedIds" in response) || !Array.isArray(response.orderedIds) || response.orderedIds.length === 0) {
        return false;
      }
      // Legacy fallback: compare against default payload order
      const defaultOrder = q.payload.items.map((i: any) => i.id);
      return JSON.stringify(response.orderedIds) !== JSON.stringify(defaultOrder);

    case "hotspot":
      return "selectedRegionId" in response && !!response.selectedRegionId;

    case "fill_blank": {
      const vals = response.values ?? {};
      return Object.values(vals).some((v: any) => `${v ?? ""}`.trim() !== "");
    }

    default:
      return false;
  }
}

/* ── Per-question scoring ────────────────────────────────────────────────── */

/**
 * Score a single question.
 * If the question was not attempted, returns score=0, maxScore=0.
 * Production-safe: never throws on missing/undefined response.
 */
export function scoreQuestion(q: Question, response: any): ScoreResult {
  // Unanswered → zero score AND zero maxScore (excluded from totals)
  if (!isQuestionAttempted(q, response)) {
    return { questionId: q.id, isCorrect: false, score: 0, maxScore: 0 };
  }

  switch (q.type) {
    case "mcq_single": {
      const ok = response.choiceId === q.answerKey?.correctChoiceId;
      return { questionId: q.id, isCorrect: ok, score: ok ? 1 : 0, maxScore: 1 };
    }

    case "mcq_multi": {
      const correct = new Set(q.answerKey?.correctChoiceIds ?? []);
      const chosen = new Set((response.choiceIds ?? []) as string[]);
      const scoring = q.answerKey?.scoring ?? "strict";

      if (scoring === "strict") {
        const ok = chosen.size === correct.size && [...chosen].every((x) => correct.has(x));
        return { questionId: q.id, isCorrect: ok, score: ok ? 1 : 0, maxScore: 1 };
      }

      let raw = 0;
      for (const id of chosen) raw += correct.has(id) ? 1 : -1;
      const maxScore = correct.size;
      const score = Math.max(0, Math.min(maxScore, raw));
      return { questionId: q.id, isCorrect: score === maxScore, score, maxScore, details: { scoring: "partial" } };
    }

    case "dnd_match": {
      const mapping: Record<string, string | null | undefined> = response.mapping ?? {};
      const key = q.answerKey?.mapping ?? {};
      const prompts = Object.keys(key);

      let correctCount = 0;
      for (const p of prompts) {
        const chosen = mapping[p];
        if (chosen && chosen === key[p]) correctCount++;
      }

      return {
        questionId: q.id,
        isCorrect: correctCount === prompts.length,
        score: correctCount,
        maxScore: prompts.length,
      };
    }

    case "dnd_order": {
      const orderedIds: string[] = Array.isArray(response.orderedIds) ? response.orderedIds : [];
      const key = q.answerKey?.orderedIds ?? [];

      let correctPos = 0;
      for (let i = 0; i < Math.min(orderedIds.length, key.length); i++) {
        if (orderedIds[i] === key[i]) correctPos++;
      }

      return { questionId: q.id, isCorrect: correctPos === key.length, score: correctPos, maxScore: key.length };
    }

    case "hotspot": {
      const ok = response.selectedRegionId === q.answerKey?.correctRegionId;
      return { questionId: q.id, isCorrect: ok, score: ok ? 1 : 0, maxScore: 1 };
    }

    case "fill_blank": {
      const vals: Record<string, string> = response.values ?? {};
      const key = q.answerKey?.values ?? {};
      const tol = q.answerKey?.numericTolerance ?? 0;
      const ci = q.answerKey?.caseInsensitive;

      let correct = 0;
      let total = 0;

      for (const blankId of Object.keys(key)) {
        total++;
        const given = `${vals[blankId] ?? ""}`.trim();
        const accepted = key[blankId];

        if (q.payload.inputMode === "numeric") {
          const g = Number(given);
          const ok = accepted.some((v) => {
            const t = Number(v);
            if (Number.isNaN(g) || Number.isNaN(t)) return false;
            return Math.abs(g - t) <= tol;
          });
          if (ok) correct++;
        } else {
          const ok = accepted.some((a) => eqText(given, a, ci));
          if (ok) correct++;
        }
      }

      return { questionId: q.id, isCorrect: correct === total, score: correct, maxScore: total };
    }
  }
}

/* ── Full-attempt scoring ────────────────────────────────────────────────── */

/**
 * Score an entire attempt. Only attempted questions contribute to totals.
 * Unanswered questions get scoreResult {score:0, maxScore:0} and are
 * excluded from byDomain/byType/incorrectQuestionIds.
 *
 * Production-safe: skips missing questions in byId mapping.
 */
export function scoreAttempt(attempt: Attempt, questions: Question[]): AttemptResult {
  const byId = Object.fromEntries(questions.map((q) => [q.id, q])) as Record<string, Question>;

  const scoreResults: ScoreResult[] = [];
  let answeredCount = 0;

  for (const qid of attempt.questionOrder) {
    const q = byId[qid];
    if (!q) continue;

    const r = attempt.responsesByQuestionId[qid];
    const attempted = isQuestionAttempted(q, r);
    if (attempted) answeredCount++;

    scoreResults.push(scoreQuestion(q, r));
  }

  const totalQuestions = scoreResults.length;
  const unansweredCount = totalQuestions - answeredCount;

  // Only answered questions contribute to score totals
  const totalScore = scoreResults.reduce((s, r) => s + r.score, 0);
  const maxScore = scoreResults.reduce((s, r) => s + r.maxScore, 0);

  const byDomain = {
    people: { score: 0, maxScore: 0, correct: 0, total: 0 },
    process: { score: 0, maxScore: 0, correct: 0, total: 0 },
    business_environment: { score: 0, maxScore: 0, correct: 0, total: 0 },
  } satisfies Record<Domain, any>;

  const byType: Record<QuestionType, any> = {
    mcq_single: { score: 0, maxScore: 0, correct: 0, total: 0 },
    mcq_multi: { score: 0, maxScore: 0, correct: 0, total: 0 },
    dnd_match: { score: 0, maxScore: 0, correct: 0, total: 0 },
    dnd_order: { score: 0, maxScore: 0, correct: 0, total: 0 },
    hotspot: { score: 0, maxScore: 0, correct: 0, total: 0 },
    fill_blank: { score: 0, maxScore: 0, correct: 0, total: 0 },
  };

  const incorrectQuestionIds: string[] = [];

  for (const sr of scoreResults) {
    // Skip unanswered questions (maxScore === 0) from analytics
    if (sr.maxScore === 0) continue;

    const q = byId[sr.questionId];
    if (!q) continue;

    byDomain[q.domain].score += sr.score;
    byDomain[q.domain].maxScore += sr.maxScore;
    byDomain[q.domain].total += 1;
    byDomain[q.domain].correct += sr.isCorrect ? 1 : 0;

    byType[q.type].score += sr.score;
    byType[q.type].maxScore += sr.maxScore;
    byType[q.type].total += 1;
    byType[q.type].correct += sr.isCorrect ? 1 : 0;

    if (!sr.isCorrect) incorrectQuestionIds.push(q.id);
  }

  return {
    attemptId: attempt.id,
    totalScore,
    maxScore,
    answeredCount,
    unansweredCount,
    byDomain,
    byType,
    incorrectQuestionIds,
    scoreResults,
  };
}
