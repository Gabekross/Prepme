import type { Attempt, AttemptResult, Domain, Question, QuestionType, ScoreResult } from "./types";

function norm(s: string) {
  return s.trim();
}

function eqText(a: string, b: string, caseInsensitive?: boolean) {
  const aa = norm(a);
  const bb = norm(b);
  return caseInsensitive ? aa.toLowerCase() === bb.toLowerCase() : aa === bb;
}

function emptyResult(questionId: string, maxScore = 1): ScoreResult {
  return { questionId, isCorrect: false, score: 0, maxScore };
}

/**
 * Production-safe: never throws on missing/undefined response.
 */
export function scoreQuestion(q: Question, response: any): ScoreResult {
  // No response = incorrect/zero (but keep maxScore per type)
  if (!response || typeof response !== "object") {
    switch (q.type) {
      case "dnd_match":
        return emptyResult(q.id, Object.keys(q.answerKey.mapping).length);
      case "dnd_order":
        return emptyResult(q.id, q.answerKey.orderedIds.length);
      case "fill_blank":
        return emptyResult(q.id, Object.keys(q.answerKey.values).length);
      default:
        return emptyResult(q.id, 1);
    }
  }

  switch (q.type) {
    case "mcq_single": {
      const ok = response.choiceId === q.answerKey.correctChoiceId;
      return { questionId: q.id, isCorrect: ok, score: ok ? 1 : 0, maxScore: 1 };
    }

    case "mcq_multi": {
      const correct = new Set(q.answerKey.correctChoiceIds);
      const chosen = new Set((response.choiceIds ?? []) as string[]);
      const scoring = q.answerKey.scoring ?? "strict";

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
      const key = q.answerKey.mapping;
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
      const key = q.answerKey.orderedIds;

      let correctPos = 0;
      for (let i = 0; i < Math.min(orderedIds.length, key.length); i++) {
        if (orderedIds[i] === key[i]) correctPos++;
      }

      return { questionId: q.id, isCorrect: correctPos === key.length, score: correctPos, maxScore: key.length };
    }

    case "hotspot": {
      const ok = response.selectedRegionId === q.answerKey.correctRegionId;
      return { questionId: q.id, isCorrect: ok, score: ok ? 1 : 0, maxScore: 1 };
    }

    case "fill_blank": {
      const vals: Record<string, string> = response.values ?? {};
      const key = q.answerKey.values;
      const tol = q.answerKey.numericTolerance ?? 0;
      const ci = q.answerKey.caseInsensitive;

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

/**
 * Production-safe: skips missing questions in byId mapping (prevents q.type crash).
 */
export function scoreAttempt(attempt: Attempt, questions: Question[]): AttemptResult {
  const byId = Object.fromEntries(questions.map((q) => [q.id, q])) as Record<string, Question>;

  const scoreResults: ScoreResult[] = [];

  for (const qid of attempt.questionOrder) {
    const q = byId[qid];

    // If the attempt references a question that isn't loaded, skip it safely
    if (!q) continue;

    const r = attempt.responsesByQuestionId[qid];
    scoreResults.push(scoreQuestion(q, r));
  }

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

  return { attemptId: attempt.id, totalScore, maxScore, byDomain, byType, incorrectQuestionIds, scoreResults };
}
