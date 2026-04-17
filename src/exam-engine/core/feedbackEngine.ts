/**
 * Personalized feedback engine.
 * Generates human-readable feedback based on weighted scoring, domain mastery,
 * topic analysis, and difficulty performance.
 */

import type { Domain, Difficulty } from "./types";
import type { WeightedAttemptResult, DomainWeightedStats } from "./weightedScoring";
import type { TopicInsights, TopicStats } from "./topicAnalytics";
import { getMasteryBand, type MasteryBand } from "./adaptiveConfig";

/* ── Feedback Data Structure ──────────────────────────────────────────────── */

export interface DomainFeedback {
  domain: Domain;
  label: string;
  masteryBand: MasteryBand;
  rawPercent: number;
  weightedPercent: number;
  avgDifficulty: number;
  total: number;
  correct: number;
}

export interface FeedbackReport {
  overallRawAccuracy: number;
  overallWeightedScore: number;
  avgDifficulty: number;
  domains: DomainFeedback[];
  weakestTopics: TopicStats[];
  strongestTopics: TopicStats[];
  difficultyInsight: string;
  recommendedFocus: string[];
  summaryLines: string[];
}

/* ── Label Helpers ────────────────────────────────────────────────────────── */

const DOMAIN_LABELS: Record<Domain, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Environment",
};

function domainLabel(d: Domain): string {
  return DOMAIN_LABELS[d] ?? d;
}

function topicLabel(tag: string): string {
  return tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Feedback Builder ─────────────────────────────────────────────────────── */

export function buildFeedbackReport(
  result: WeightedAttemptResult,
  insights: TopicInsights,
): FeedbackReport {
  // Domain feedback
  const domainOrder: Domain[] = ["people", "process", "business_environment"];
  const domains: DomainFeedback[] = domainOrder
    .filter((d) => result.byDomain[d].total > 0)
    .map((d) => {
      const stats = result.byDomain[d];
      return {
        domain: d,
        label: domainLabel(d),
        masteryBand: getMasteryBand(stats.weightedPercent),
        rawPercent: stats.rawPercent,
        weightedPercent: stats.weightedPercent,
        avgDifficulty: stats.avgDifficulty,
        total: stats.total,
        correct: stats.correct,
      };
    });

  // Difficulty insight
  const diffInsight = buildDifficultyInsight(result);

  // Recommended focus areas
  const recommended = buildRecommendations(domains, insights);

  // Summary lines
  const summaryLines = buildSummaryLines(result, domains, insights);

  return {
    overallRawAccuracy: result.rawPercent,
    overallWeightedScore: result.weightedPercent,
    avgDifficulty: result.avgDifficulty,
    domains,
    weakestTopics: insights.weakest,
    strongestTopics: insights.strongest,
    difficultyInsight: diffInsight,
    recommendedFocus: recommended,
    summaryLines,
  };
}

function buildDifficultyInsight(result: WeightedAttemptResult): string {
  const perf = result.difficultyPerformance;

  // Find the difficulty level where performance drops
  const levels: Difficulty[] = [1, 2, 3, 4, 5];
  const attempted = levels.filter((d) => perf[d].total > 0);
  if (attempted.length === 0) return "No questions attempted yet.";

  const lowDiffPerf = levels.filter((d) => d <= 3 && perf[d].total > 0)
    .map((d) => perf[d].weightedPercent);
  const highDiffPerf = levels.filter((d) => d >= 4 && perf[d].total > 0)
    .map((d) => perf[d].weightedPercent);

  const lowAvg = lowDiffPerf.length > 0 ? lowDiffPerf.reduce((a, b) => a + b, 0) / lowDiffPerf.length : 0;
  const highAvg = highDiffPerf.length > 0 ? highDiffPerf.reduce((a, b) => a + b, 0) / highDiffPerf.length : 0;

  if (highDiffPerf.length === 0) {
    return "You've primarily attempted lower-difficulty questions. Try challenging yourself with harder scenarios.";
  }

  if (lowAvg - highAvg > 25) {
    return `You answer difficulty 1–3 consistently well (${Math.round(lowAvg)}%), but performance drops on difficulty 4–5 scenario questions (${Math.round(highAvg)}%).`;
  }

  if (highAvg >= 75) {
    return `Strong performance across all difficulty levels. You're handling challenging questions well (${Math.round(highAvg)}% on difficulty 4–5).`;
  }

  return `Your performance is fairly consistent across difficulty levels (avg ${result.weightedPercent}% weighted).`;
}

/** Minimum attempts per topic before we include it in recommendations.
 *  Below this, topic accuracy is noise (e.g. 0/1 or 1/2). */
const TOPIC_MIN_ATTEMPTS = 3;

function buildRecommendations(
  domains: DomainFeedback[],
  insights: TopicInsights,
): string[] {
  const recs: string[] = [];

  // Weak topics — only include topics with enough attempts to be meaningful.
  // Domain-level "Focus on X — currently at Needs Focus level" lines are
  // deliberately omitted: that info is already conveyed by the Mastery card
  // badges and color-coded bars right above, so repeating it adds noise.
  const meaningfulWeak = insights.weakest.filter((t) => t.attempted >= TOPIC_MIN_ATTEMPTS);
  for (const t of meaningfulWeak.slice(0, 3)) {
    recs.push(`Improve ${topicLabel(t.tag)} — ${t.weightedAccuracy}% accuracy across ${t.attempted} questions.`);
  }

  // Fallback: if there are no meaningful topic recs, offer one general hint
  // based on domain signal so the section isn't empty.
  if (recs.length === 0) {
    const weakDomains = domains.filter((d) => d.masteryBand === "Needs Focus" || d.masteryBand === "Developing");
    if (weakDomains.length > 0) {
      const names = weakDomains.slice(0, 2).map((d) => d.label).join(" and ");
      recs.push(`Practice more questions in the ${names} domain${weakDomains.length > 1 ? "s" : ""}.`);
    } else {
      recs.push("Maintain your strong performance across all areas. Consider attempting higher-difficulty questions.");
    }
  }

  return recs;
}

function buildSummaryLines(
  _result: WeightedAttemptResult,
  _domains: DomainFeedback[],
  insights: TopicInsights,
): string[] {
  const lines: string[] = [];

  // Domain-level summary lines ("You are strong in X", "underperforming in Y")
  // are omitted because the Mastery cards above already communicate that.
  // Only topic lines survive, and only when the topic has enough attempts
  // to be meaningful (same threshold as buildRecommendations).
  const meaningfulStrong = insights.strongest.filter((t) => t.attempted >= TOPIC_MIN_ATTEMPTS);
  if (meaningfulStrong.length > 0) {
    const topicNames = meaningfulStrong.slice(0, 2).map((t) => topicLabel(t.tag)).join(", ");
    lines.push(`Your strongest topics include ${topicNames}.`);
  }

  const meaningfulWeak = insights.weakest.filter((t) => t.attempted >= TOPIC_MIN_ATTEMPTS);
  if (meaningfulWeak.length > 0) {
    const topicNames = meaningfulWeak.slice(0, 2).map((t) => topicLabel(t.tag)).join(" and ");
    lines.push(`Your recent results suggest improving ${topicNames}.`);
  }

  return lines;
}
