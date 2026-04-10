/**
 * Adaptive question selection engine for practice mode.
 *
 * Selects the next question based on:
 *  1. Domain weakness bias
 *  2. Topic weakness bias
 *  3. Target difficulty (from streak state)
 *  4. Question freshness (avoid repeats)
 *
 * Produces a deterministic, explainable priority score for each candidate.
 */

import type { Difficulty, Domain, Question } from "./types";
import {
  DEFAULT_DIFFICULTY,
  MAX_DIFFICULTY,
  MAX_SAME_DOMAIN_STREAK,
  MIN_DIFFICULTY,
  RECENT_QUESTION_HISTORY,
  SELECTION_WEIGHTS,
  STREAK_DOWN_THRESHOLD,
  STREAK_UP_THRESHOLD,
  TARGET_DOMAIN_DISTRIBUTION,
} from "./adaptiveConfig";
import { adaptiveDebug } from "./adaptiveDebug";

/* ── Session Streak State ─────────────────────────────────────────────────── */

export interface AdaptiveSessionState {
  consecutiveCorrect: number;
  consecutiveWrong: number;
  targetDifficulty: Difficulty;
  recentQuestionIds: string[];
  recentDomains: Domain[];
  /** Domain-level weakness scores (0 = strong, 1 = weak). Updated externally. */
  domainWeakness: Record<Domain, number>;
  /** Topic-level weakness map (tag → weakness). Updated externally. */
  topicWeakness: Map<string, number>;
}

export function createAdaptiveSessionState(): AdaptiveSessionState {
  return {
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    targetDifficulty: DEFAULT_DIFFICULTY,
    recentQuestionIds: [],
    recentDomains: [],
    domainWeakness: { people: 0.5, process: 0.5, business_environment: 0.5 },
    topicWeakness: new Map(),
  };
}

/* ── Streak Update ────────────────────────────────────────────────────────── */

export function updateStreakState(
  state: AdaptiveSessionState,
  questionId: string,
  questionDomain: Domain,
  isCorrect: boolean,
): AdaptiveSessionState {
  const next = { ...state };

  // Update streak counters
  if (isCorrect) {
    next.consecutiveCorrect = state.consecutiveCorrect + 1;
    next.consecutiveWrong = 0;
  } else {
    next.consecutiveWrong = state.consecutiveWrong + 1;
    next.consecutiveCorrect = 0;
  }

  // Adjust target difficulty based on streaks
  if (next.consecutiveCorrect >= STREAK_UP_THRESHOLD) {
    const newDiff = Math.min(MAX_DIFFICULTY, state.targetDifficulty + 1) as Difficulty;
    if (newDiff !== state.targetDifficulty) {
      adaptiveDebug.log("streak", `${STREAK_UP_THRESHOLD} correct in a row → difficulty ${state.targetDifficulty} → ${newDiff}`);
    }
    next.targetDifficulty = newDiff;
    next.consecutiveCorrect = 0; // Reset after adjustment
  } else if (next.consecutiveWrong >= STREAK_DOWN_THRESHOLD) {
    const newDiff = Math.max(MIN_DIFFICULTY, state.targetDifficulty - 1) as Difficulty;
    if (newDiff !== state.targetDifficulty) {
      adaptiveDebug.log("streak", `${STREAK_DOWN_THRESHOLD} wrong in a row → difficulty ${state.targetDifficulty} → ${newDiff}`);
    }
    next.targetDifficulty = newDiff;
    next.consecutiveWrong = 0; // Reset after adjustment
  }

  // Track recent questions
  next.recentQuestionIds = [...state.recentQuestionIds, questionId].slice(-RECENT_QUESTION_HISTORY);

  // Track recent domains
  next.recentDomains = [...state.recentDomains, questionDomain].slice(-MAX_SAME_DOMAIN_STREAK * 2);

  return next;
}

/* ── Question Selection ───────────────────────────────────────────────────── */

export interface ScoredCandidate {
  question: Question;
  priorityScore: number;
  breakdown: {
    domainNeed: number;
    topicNeed: number;
    difficultyFit: number;
    freshness: number;
  };
}

/**
 * Score and rank all candidate questions, returning them sorted by priority (highest first).
 */
export function scoreAndRankCandidates(
  candidates: Question[],
  state: AdaptiveSessionState,
): ScoredCandidate[] {
  if (!candidates.length) return [];

  const recentSet = new Set(state.recentQuestionIds);
  const w = SELECTION_WEIGHTS;

  // Count recent domain occurrences for balance guardrail
  const recentDomainCount: Record<string, number> = {};
  for (const d of state.recentDomains.slice(-MAX_SAME_DOMAIN_STREAK)) {
    recentDomainCount[d] = (recentDomainCount[d] ?? 0) + 1;
  }

  const scored = candidates.map((q) => {
    // 1. Domain weakness need (0–1)
    const domainNeed = state.domainWeakness[q.domain] ?? 0.5;

    // Domain balance guardrail: penalize if we've had too many from this domain recently
    const domainRecent = recentDomainCount[q.domain] ?? 0;
    const domainPenalty = domainRecent >= MAX_SAME_DOMAIN_STREAK ? 0.5 : 0;

    // 2. Topic weakness need (0–1): average weakness across question's tags
    const tags = q.tags ?? [];
    let topicNeed = 0.5; // default if no tags
    if (tags.length > 0) {
      const tagScores = tags.map((t) => state.topicWeakness.get(t) ?? 0.5);
      topicNeed = tagScores.reduce((a, b) => a + b, 0) / tagScores.length;
    }

    // 3. Difficulty fit (0–1): how close is this question's difficulty to target
    const diff: Difficulty = q.difficulty ?? DEFAULT_DIFFICULTY;
    const diffDelta = Math.abs(diff - state.targetDifficulty);
    const difficultyFit = Math.max(0, 1 - diffDelta * 0.3); // 0 delta = 1.0, 1 delta = 0.7, etc.

    // 4. Freshness (0–1): 1 if not recently seen, 0 if recently seen
    const freshness = recentSet.has(q.id) ? 0.1 : 1.0;

    const priorityScore =
      w.domainWeakness * (domainNeed - domainPenalty) +
      w.topicWeakness * topicNeed +
      w.difficultyMatch * difficultyFit +
      w.novelty * freshness;

    return {
      question: q,
      priorityScore,
      breakdown: { domainNeed, topicNeed, difficultyFit, freshness },
    };
  });

  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored;
}

/**
 * Select the next question for adaptive practice mode.
 * Returns the top-ranked question and the debug breakdown.
 */
export function selectNextAdaptiveQuestion(
  candidates: Question[],
  state: AdaptiveSessionState,
): ScoredCandidate | null {
  const ranked = scoreAndRankCandidates(candidates, state);
  if (!ranked.length) return null;

  const selected = ranked[0];

  adaptiveDebug.log("selection", [
    `Selected: ${selected.question.id}`,
    `Domain: ${selected.question.domain}`,
    `Difficulty: ${selected.question.difficulty ?? DEFAULT_DIFFICULTY}`,
    `Score: ${selected.priorityScore.toFixed(3)}`,
    `Breakdown: domain=${selected.breakdown.domainNeed.toFixed(2)} topic=${selected.breakdown.topicNeed.toFixed(2)} diff=${selected.breakdown.difficultyFit.toFixed(2)} fresh=${selected.breakdown.freshness.toFixed(2)}`,
    `Target difficulty: ${state.targetDifficulty}`,
    `Streak: ${state.consecutiveCorrect}✓ ${state.consecutiveWrong}✗`,
  ].join(" | "));

  return selected;
}

/**
 * Build a pool of candidate questions excluding already-used questions in the current attempt.
 */
export function buildAdaptiveCandidatePool(
  bank: Question[],
  usedQuestionIds: Set<string>,
): Question[] {
  return bank.filter((q) => !usedQuestionIds.has(q.id));
}
