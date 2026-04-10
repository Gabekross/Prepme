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

function buildRecommendations(
  domains: DomainFeedback[],
  insights: TopicInsights,
): string[] {
  const recs: string[] = [];

  // Weak domains
  const weakDomains = domains.filter((d) => d.masteryBand === "Needs Focus" || d.masteryBand === "Developing");
  for (const d of weakDomains.slice(0, 2)) {
    recs.push(`Focus on ${d.label} domain — currently at ${d.masteryBand} level (${d.weightedPercent}% weighted).`);
  }

  // Weak topics
  for (const t of insights.weakest.slice(0, 3)) {
    recs.push(`Improve ${topicLabel(t.tag)} — ${t.weightedAccuracy}% accuracy across ${t.attempted} questions.`);
  }

  if (recs.length === 0) {
    recs.push("Maintain your strong performance across all areas. Consider attempting higher-difficulty questions.");
  }

  return recs;
}

function buildSummaryLines(
  result: WeightedAttemptResult,
  domains: DomainFeedback[],
  insights: TopicInsights,
): string[] {
  const lines: string[] = [];

  // Strong domains
  const strong = domains.filter((d) => d.masteryBand === "Strong");
  if (strong.length > 0) {
    const names = strong.map((d) => d.label).join(" and ");
    lines.push(`You are strong in ${names} domain${strong.length > 1 ? "s" : ""}.`);
  }

  // Weak domains
  const weak = domains.filter((d) => d.masteryBand === "Needs Focus" || d.masteryBand === "Developing");
  if (weak.length > 0) {
    const names = weak.map((d) => d.label).join(" and ");
    lines.push(`You are underperforming in ${names} domain${weak.length > 1 ? "s" : ""}.`);
  }

  // Strong topics
  if (insights.strongest.length > 0) {
    const topicNames = insights.strongest.slice(0, 2).map((t) => topicLabel(t.tag)).join(", ");
    lines.push(`Your strongest topics include ${topicNames}.`);
  }

  // Weak topics
  if (insights.weakest.length > 0) {
    const topicNames = insights.weakest.slice(0, 2).map((t) => topicLabel(t.tag)).join(" and ");
    lines.push(`Your recent results suggest improving ${topicNames}.`);
  }

  return lines;
}
