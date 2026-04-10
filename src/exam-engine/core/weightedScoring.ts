/**
 * Weighted scoring utilities.
 * Applies difficulty-based weights on top of raw question scores.
 */

import type { Attempt, AttemptResult, Difficulty, Domain, Question, QuestionType, ScoreResult } from "./types";
import { scoreQuestion } from "./scoring";
import { DIFFICULTY_WEIGHTS, DEFAULT_DIFFICULTY } from "./adaptiveConfig";

/* ── Per-question weighted result ─────────────────────────────────────────── */

export interface WeightedScoreResult extends ScoreResult {
  difficulty: Difficulty;
  difficultyWeight: number;
  /** Raw fractional correctness (0–1) before weighting. */
  rawFraction: number;
  /** Weighted score = rawFraction * difficultyWeight. */
  weightedScore: number;
  /** Maximum possible weighted score = 1 * difficultyWeight. */
  weightedMaxScore: number;
}

export function weightedScoreQuestion(q: Question, response: any): WeightedScoreResult {
  const raw = scoreQuestion(q, response);
  const diff: Difficulty = q.difficulty ?? DEFAULT_DIFFICULTY;
  const weight = DIFFICULTY_WEIGHTS[diff] ?? 1.0;
  const rawFraction = raw.maxScore > 0 ? raw.score / raw.maxScore : 0;

  return {
    ...raw,
    difficulty: diff,
    difficultyWeight: weight,
    rawFraction,
    weightedScore: rawFraction * weight,
    weightedMaxScore: weight,
  };
}

/* ── Aggregated weighted attempt result ───────────────────────────────────── */

export interface DomainWeightedStats {
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  weightedScore: number;
  weightedMaxScore: number;
  weightedPercent: number;
  rawPercent: number;
  avgDifficulty: number;
}

export interface WeightedAttemptResult {
  attemptId: string;
  /** Raw totals (unchanged from original scoring). */
  totalScore: number;
  maxScore: number;
  rawPercent: number;
  /** Weighted totals. */
  weightedTotalScore: number;
  weightedMaxScore: number;
  weightedPercent: number;
  /** Domain breakdown with weighted stats. */
  byDomain: Record<Domain, DomainWeightedStats>;
  /** Type breakdown with weighted stats. */
  byType: Record<QuestionType, DomainWeightedStats>;
  /** All individual score results. */
  scoreResults: WeightedScoreResult[];
  incorrectQuestionIds: string[];
  /** Average difficulty of all attempted questions. */
  avgDifficulty: number;
  /** Difficulty distribution: count per difficulty level. */
  difficultyDistribution: Record<Difficulty, number>;
  /** Difficulty performance: weighted percent per difficulty level. */
  difficultyPerformance: Record<Difficulty, { correct: number; total: number; weightedPercent: number }>;
}

function emptyDomainStats(): DomainWeightedStats {
  return {
    score: 0, maxScore: 0, correct: 0, total: 0,
    weightedScore: 0, weightedMaxScore: 0, weightedPercent: 0, rawPercent: 0, avgDifficulty: 0,
  };
}

export function weightedScoreAttempt(attempt: Attempt, questions: Question[]): WeightedAttemptResult {
  const byId = Object.fromEntries(questions.map((q) => [q.id, q])) as Record<string, Question>;

  const scoreResults: WeightedScoreResult[] = [];

  for (const qid of attempt.questionOrder) {
    const q = byId[qid];
    if (!q) continue;
    const r = attempt.responsesByQuestionId[qid];
    scoreResults.push(weightedScoreQuestion(q, r));
  }

  const totalScore = scoreResults.reduce((s, r) => s + r.score, 0);
  const maxScore = scoreResults.reduce((s, r) => s + r.maxScore, 0);
  const weightedTotalScore = scoreResults.reduce((s, r) => s + r.weightedScore, 0);
  const weightedMax = scoreResults.reduce((s, r) => s + r.weightedMaxScore, 0);

  const byDomain: Record<Domain, DomainWeightedStats> = {
    people: emptyDomainStats(),
    process: emptyDomainStats(),
    business_environment: emptyDomainStats(),
  };

  const byType: Record<QuestionType, DomainWeightedStats> = {
    mcq_single: emptyDomainStats(),
    mcq_multi: emptyDomainStats(),
    dnd_match: emptyDomainStats(),
    dnd_order: emptyDomainStats(),
    hotspot: emptyDomainStats(),
    fill_blank: emptyDomainStats(),
  };

  const incorrectQuestionIds: string[] = [];
  const diffDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const diffPerf: Record<number, { correct: number; total: number; wScore: number; wMax: number }> = {
    1: { correct: 0, total: 0, wScore: 0, wMax: 0 },
    2: { correct: 0, total: 0, wScore: 0, wMax: 0 },
    3: { correct: 0, total: 0, wScore: 0, wMax: 0 },
    4: { correct: 0, total: 0, wScore: 0, wMax: 0 },
    5: { correct: 0, total: 0, wScore: 0, wMax: 0 },
  };

  let totalDiff = 0;

  for (const sr of scoreResults) {
    const q = byId[sr.questionId];
    if (!q) continue;

    const d = byDomain[q.domain];
    d.score += sr.score;
    d.maxScore += sr.maxScore;
    d.total += 1;
    d.correct += sr.isCorrect ? 1 : 0;
    d.weightedScore += sr.weightedScore;
    d.weightedMaxScore += sr.weightedMaxScore;

    const t = byType[q.type];
    t.score += sr.score;
    t.maxScore += sr.maxScore;
    t.total += 1;
    t.correct += sr.isCorrect ? 1 : 0;
    t.weightedScore += sr.weightedScore;
    t.weightedMaxScore += sr.weightedMaxScore;

    if (!sr.isCorrect) incorrectQuestionIds.push(q.id);

    const diff = sr.difficulty;
    diffDist[diff] = (diffDist[diff] ?? 0) + 1;
    diffPerf[diff].correct += sr.isCorrect ? 1 : 0;
    diffPerf[diff].total += 1;
    diffPerf[diff].wScore += sr.weightedScore;
    diffPerf[diff].wMax += sr.weightedMaxScore;
    totalDiff += diff;
  }

  // Finalize domain/type percentages
  for (const stats of [...Object.values(byDomain), ...Object.values(byType)]) {
    stats.rawPercent = stats.maxScore > 0 ? Math.round((stats.score / stats.maxScore) * 100) : 0;
    stats.weightedPercent = stats.weightedMaxScore > 0
      ? Math.round((stats.weightedScore / stats.weightedMaxScore) * 100)
      : 0;
    stats.avgDifficulty = 0; // computed below per-domain
  }

  // Compute per-domain average difficulty
  for (const sr of scoreResults) {
    const q = byId[sr.questionId];
    if (!q) continue;
    byDomain[q.domain].avgDifficulty += sr.difficulty;
  }
  for (const d of Object.values(byDomain)) {
    d.avgDifficulty = d.total > 0 ? +(d.avgDifficulty / d.total).toFixed(1) : 0;
  }

  const difficultyPerformance = {} as Record<Difficulty, { correct: number; total: number; weightedPercent: number }>;
  for (const k of [1, 2, 3, 4, 5] as Difficulty[]) {
    const p = diffPerf[k];
    difficultyPerformance[k] = {
      correct: p.correct,
      total: p.total,
      weightedPercent: p.wMax > 0 ? Math.round((p.wScore / p.wMax) * 100) : 0,
    };
  }

  return {
    attemptId: attempt.id,
    totalScore,
    maxScore,
    rawPercent: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    weightedTotalScore,
    weightedMaxScore: weightedMax,
    weightedPercent: weightedMax > 0 ? Math.round((weightedTotalScore / weightedMax) * 100) : 0,
    byDomain,
    byType,
    scoreResults,
    incorrectQuestionIds,
    avgDifficulty: scoreResults.length > 0 ? +(totalDiff / scoreResults.length).toFixed(1) : 0,
    difficultyDistribution: diffDist as Record<Difficulty, number>,
    difficultyPerformance,
  };
}
