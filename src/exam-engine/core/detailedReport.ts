import type { Attempt, AttemptResult, Domain, Question } from "./types";
import { TOPICS_BY_DOMAIN, buildTopicIndex } from "./topicLabels";
import { resultsSummary } from "./resultsSummary";

export const REPORT_DOMAINS: Record<Domain, string> = {
  people: "People", process: "Process", business_environment: "Business Environment",
};
const topicIndex = buildTopicIndex();

export function questionTopics(question: Question) {
  const ids = new Set<string>();
  for (const tag of question.tags ?? []) {
    for (const id of topicIndex[question.domain]?.get(tag.toLowerCase()) ?? []) ids.add(id);
  }
  if (!ids.size) ids.add("other");
  return [...ids].map(id => ({
    key: `${question.domain}:${id}`,
    label: TOPICS_BY_DOMAIN[question.domain].find(topic => topic.id === id)?.label ?? `Other — ${REPORT_DOMAINS[question.domain]}`,
  }));
}

export type ReportFilter = "all" | "incorrect" | "unanswered" | "flagged" | "missed";
export function buildDetailedReport(result: AttemptResult, questions: Question[], state: Pick<Attempt, "questionOrder" | "flagged" | "timeSpentMsByQuestionId">) {
  const scores = new Map(result.scoreResults.map(score => [score.questionId, score]));
  const byId = new Map(questions.map(question => [question.id, question]));
  const rows = state.questionOrder.map((id, index) => {
    const question = byId.get(id);
    const score = scores.get(id);
    const rawTime = state.timeSpentMsByQuestionId?.[id];
    const timeMs = typeof rawTime === "number" && Number.isFinite(rawTime) && rawTime > 0 ? rawTime : null;
    return { id, index, question, score, topics: question ? questionTopics(question) : [],
      flagged: !!state.flagged?.[id], timeMs,
      status: !score ? "Unavailable" : score.maxScore === 0 ? "Unanswered" : score.isCorrect ? "Correct" : "Incorrect" };
  });
  const topics = new Map<string, { key: string; label: string; correct: number; total: number; unanswered: number; missed: number; domain: Domain }>();
  for (const row of rows) {
    if (!row.question || !row.score) continue;
    for (const topic of row.topics) {
      const bucket = topics.get(topic.key) ?? { ...topic, correct: 0, total: 0, unanswered: 0, missed: 0, domain: row.question.domain };
      bucket.total++;
      if (row.status === "Correct") bucket.correct++;
      else bucket.missed++;
      if (row.status === "Unanswered") bucket.unanswered++;
      topics.set(topic.key, bucket);
    }
  }
  const recorded = rows.filter(row => row.timeMs !== null);
  const totalTimeMs = recorded.reduce((sum, row) => sum + row.timeMs!, 0);
  return {
    summary: resultsSummary(result, questions), rows,
    topics: [...topics.values()].sort((a, b) => b.missed - a.missed || b.total - a.total || a.label.localeCompare(b.label)),
    pacing: { recordedCount: recorded.length, totalTimeMs, averageMs: recorded.length ? totalTimeMs / recorded.length : null,
      longestMs: recorded.length ? Math.max(...recorded.map(row => row.timeMs!)) : null },
    complete: rows.every(row => row.question && row.score),
  };
}

export function filterReportRows(rows: ReturnType<typeof buildDetailedReport>["rows"], filter: ReportFilter, search: string, topic: string) {
  const needle = search.trim().toLowerCase();
  return rows.filter(row => {
    if (filter === "incorrect" && row.status !== "Incorrect") return false;
    if (filter === "unanswered" && row.status !== "Unanswered") return false;
    if (filter === "missed" && row.status !== "Incorrect" && row.status !== "Unanswered") return false;
    if (filter === "flagged" && !row.flagged) return false;
    if (topic && !row.topics.some(item => item.key === topic)) return false;
    return !needle || [`Q${row.index + 1}`, row.question?.prompt ?? "", row.question ? REPORT_DOMAINS[row.question.domain] : "", ...row.topics.map(item => item.label)]
      .join(" ").toLowerCase().includes(needle);
  });
}
