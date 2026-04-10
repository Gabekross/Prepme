import type { Attempt, AttemptResult, Domain, Question, QuestionType } from "./types";
import { weightedScoreAttempt, type WeightedAttemptResult } from "./weightedScoring";
import { computeTopicStats, getTopicInsights, type TopicInsights, type TopicStats } from "./topicAnalytics";
import { buildFeedbackReport, type FeedbackReport } from "./feedbackEngine";
import { getMasteryBand, type MasteryBand } from "./adaptiveConfig";

/* ── Legacy summarize (unchanged API for backward compatibility) ──────────── */

export function summarize(result: AttemptResult) {
  const domainOrder: Domain[] = ["people", "process", "business_environment"];
  const typeOrder: QuestionType[] = ["mcq_single","mcq_multi","dnd_match","dnd_order","hotspot","fill_blank"];
  return {
    total: { score: result.totalScore, max: result.maxScore },
    domains: domainOrder.map((d) => ({ domain: d, ...result.byDomain[d] })),
    types: typeOrder.map((t) => ({ type: t, ...result.byType[t] })),
  };
}

/* ── Enhanced adaptive summary ────────────────────────────────────────────── */

export interface AdaptiveSummary {
  /** Weighted attempt result with full breakdown. */
  weighted: WeightedAttemptResult;
  /** Per-topic statistics. */
  topicStats: TopicStats[];
  /** Top strengths and weaknesses by topic. */
  topicInsights: TopicInsights;
  /** Domain mastery bands. */
  domainMastery: Record<Domain, MasteryBand>;
  /** Personalized feedback report. */
  feedback: FeedbackReport;
}

/**
 * Compute a full adaptive analytics summary for a completed attempt.
 * This is the primary analytics entry point for the upgraded results UI.
 */
export function computeAdaptiveSummary(
  attempt: Attempt,
  questions: Question[],
): AdaptiveSummary {
  const weighted = weightedScoreAttempt(attempt, questions);

  const topicStats = computeTopicStats(weighted.scoreResults, questions);
  const topicInsights = getTopicInsights(topicStats);

  const domainMastery: Record<Domain, MasteryBand> = {
    people: getMasteryBand(weighted.byDomain.people.weightedPercent),
    process: getMasteryBand(weighted.byDomain.process.weightedPercent),
    business_environment: getMasteryBand(weighted.byDomain.business_environment.weightedPercent),
  };

  const feedback = buildFeedbackReport(weighted, topicInsights);

  return { weighted, topicStats, topicInsights, domainMastery, feedback };
}
