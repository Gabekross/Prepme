/**
 * Topic-level (tag-based) performance analytics.
 * Tracks per-topic accuracy, weighted performance, and identifies strengths/weaknesses.
 */

import type { Question, Difficulty } from "./types";
import type { WeightedScoreResult } from "./weightedScoring";
import { DEFAULT_DIFFICULTY, MIN_TOPIC_ATTEMPTS, TOP_N_TOPICS } from "./adaptiveConfig";

/* ── Topic Stats ──────────────────────────────────────────────────────────── */

export interface TopicStats {
  tag: string;
  attempted: number;
  correct: number;
  rawPercent: number;
  weightedAccuracy: number;
  avgDifficulty: number;
}

/**
 * Compute per-topic stats from a set of scored results and their questions.
 * Each question can have multiple tags; its result counts toward all of them.
 */
export function computeTopicStats(
  scoreResults: WeightedScoreResult[],
  questions: Question[],
): TopicStats[] {
  const byId = new Map(questions.map((q) => [q.id, q]));

  const acc: Record<string, {
    attempted: number;
    correct: number;
    wScore: number;
    wMax: number;
    diffSum: number;
  }> = {};

  for (const sr of scoreResults) {
    const q = byId.get(sr.questionId);
    if (!q) continue;
    const tags = q.tags ?? [];
    if (!tags.length) continue;

    const diff: Difficulty = q.difficulty ?? DEFAULT_DIFFICULTY;

    for (const tag of tags) {
      if (!acc[tag]) acc[tag] = { attempted: 0, correct: 0, wScore: 0, wMax: 0, diffSum: 0 };
      const t = acc[tag];
      t.attempted++;
      t.correct += sr.isCorrect ? 1 : 0;
      t.wScore += sr.weightedScore;
      t.wMax += sr.weightedMaxScore;
      t.diffSum += diff;
    }
  }

  return Object.entries(acc).map(([tag, t]) => ({
    tag,
    attempted: t.attempted,
    correct: t.correct,
    rawPercent: t.attempted > 0 ? Math.round((t.correct / t.attempted) * 100) : 0,
    weightedAccuracy: t.wMax > 0 ? Math.round((t.wScore / t.wMax) * 100) : 0,
    avgDifficulty: t.attempted > 0 ? +(t.diffSum / t.attempted).toFixed(1) : 0,
  }));
}

/* ── Strengths & Weaknesses ───────────────────────────────────────────────── */

export interface TopicInsights {
  weakest: TopicStats[];
  strongest: TopicStats[];
}

export function getTopicInsights(
  stats: TopicStats[],
  topN: number = TOP_N_TOPICS,
  minAttempts: number = MIN_TOPIC_ATTEMPTS,
): TopicInsights {
  const eligible = stats.filter((t) => t.attempted >= minAttempts);
  const sorted = [...eligible].sort((a, b) => a.weightedAccuracy - b.weightedAccuracy);

  return {
    weakest: sorted.slice(0, topN),
    strongest: sorted.slice(-topN).reverse(),
  };
}

/**
 * Returns a map of tag → weakness score (0 = strong, 1 = very weak).
 * Used by the adaptive selection engine.
 */
export function getTopicWeaknessMap(stats: TopicStats[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of stats) {
    // Invert accuracy: 100% accurate = 0 weakness, 0% accurate = 1.0 weakness
    const weakness = 1 - (t.weightedAccuracy / 100);
    map.set(t.tag, weakness);
  }
  return map;
}
