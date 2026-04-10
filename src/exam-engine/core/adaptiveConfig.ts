/**
 * Centralized configuration for the adaptive scoring and question selection system.
 * All thresholds, weights, and toggles are defined here for easy tuning.
 */

import type { Difficulty, Domain } from "./types";

/* ── Difficulty Weights ───────────────────────────────────────────────────── */

/** Weight multiplier applied to each difficulty level when computing weighted scores. */
export const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
  1: 1.0,
  2: 1.0,
  3: 1.5,
  4: 2.0,
  5: 2.5,
};

/** Default difficulty assumed when a question has no difficulty value. */
export const DEFAULT_DIFFICULTY: Difficulty = 2;

/* ── Mastery Bands ────────────────────────────────────────────────────────── */

export type MasteryBand = "Strong" | "Proficient" | "Developing" | "Needs Focus";

export interface MasteryThreshold {
  band: MasteryBand;
  /** Minimum weighted percent (inclusive) to qualify for this band. */
  minPercent: number;
}

/** Ordered from highest to lowest — evaluation stops at the first match. */
export const MASTERY_THRESHOLDS: MasteryThreshold[] = [
  { band: "Strong", minPercent: 85 },
  { band: "Proficient", minPercent: 70 },
  { band: "Developing", minPercent: 55 },
  { band: "Needs Focus", minPercent: 0 },
];

export function getMasteryBand(weightedPercent: number): MasteryBand {
  for (const t of MASTERY_THRESHOLDS) {
    if (weightedPercent >= t.minPercent) return t.band;
  }
  return "Needs Focus";
}

/* ── Streak Thresholds (Difficulty Adjustment) ────────────────────────────── */

/** Number of consecutive correct answers before increasing target difficulty. */
export const STREAK_UP_THRESHOLD = 3;

/** Number of consecutive wrong answers before decreasing target difficulty. */
export const STREAK_DOWN_THRESHOLD = 2;

/** Minimum difficulty the adaptive engine will target. */
export const MIN_DIFFICULTY: Difficulty = 1;

/** Maximum difficulty the adaptive engine will target. */
export const MAX_DIFFICULTY: Difficulty = 5;

/* ── Adaptive Selection Weights ───────────────────────────────────────────── */

/** Weights used to blend the priority score for adaptive question selection. */
export const SELECTION_WEIGHTS = {
  /** How strongly weak-domain bias influences selection. */
  domainWeakness: 0.30,
  /** How strongly weak-topic bias influences selection. */
  topicWeakness: 0.25,
  /** How strongly difficulty-target match influences selection. */
  difficultyMatch: 0.25,
  /** How strongly question freshness (avoiding repeats) influences selection. */
  novelty: 0.20,
};

/** Maximum number of recently-seen question IDs to track for novelty scoring. */
export const RECENT_QUESTION_HISTORY = 50;

/* ── Domain Balance Guardrails ────────────────────────────────────────────── */

/**
 * Maximum fraction of consecutive questions that can come from a single domain
 * in adaptive practice mode. Prevents the engine from over-focusing.
 */
export const MAX_SAME_DOMAIN_STREAK = 4;

/**
 * Target domain distribution for practice mode.
 * The adaptive engine will nudge toward these ratios while still biasing weak areas.
 */
export const TARGET_DOMAIN_DISTRIBUTION: Record<Domain, number> = {
  people: 0.42,
  process: 0.50,
  business_environment: 0.08,
};

/* ── Simulation Mode ──────────────────────────────────────────────────────── */

/** Whether to apply mild difficulty balancing when assembling a simulation exam. */
export const SIMULATION_BALANCE_DIFFICULTY = true;

/**
 * In simulation mode, target this approximate difficulty distribution.
 * Values are fractions that should roughly sum to 1.
 */
export const SIMULATION_DIFFICULTY_MIX: Partial<Record<Difficulty, number>> = {
  1: 0.10,
  2: 0.25,
  3: 0.30,
  4: 0.25,
  5: 0.10,
};

/* ── Confidence-Based Scoring ─────────────────────────────────────────────── */

/** Master toggle for confidence-based scoring adjustments. */
export const CONFIDENCE_SCORING_ENABLED = false;

/** Penalty multiplier for high-confidence wrong answers (applied to weighted score). */
export const HIGH_CONFIDENCE_WRONG_PENALTY = 0.15;

/** Insight flag for low-confidence correct answers. No score effect, just analytics. */
export const LOW_CONFIDENCE_CORRECT_INSIGHT = true;

export type ConfidenceLevel = "low" | "medium" | "high";

/* ── Topic Analytics ──────────────────────────────────────────────────────── */

/** Number of top/bottom topics to surface in feedback. */
export const TOP_N_TOPICS = 3;

/** Minimum attempts on a topic before it's included in weakness/strength analysis. */
export const MIN_TOPIC_ATTEMPTS = 2;
