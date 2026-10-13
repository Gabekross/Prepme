import { expect, it } from "vitest";
import { buildDetailedReport, filterReportRows, questionTopics } from "../detailedReport";
import { scoreAttempt } from "../scoring";
import type { Attempt, Question } from "../types";

const questions: Question[] = ["a", "b", "c"].map(id => ({
  id, domain: "people", type: "mcq_single", prompt: `Historical question ${id}`,
  tags: ["leadership"], payload: { choices: [{ id: "yes", text: "Yes" }, { id: "no", text: "No" }] }, answerKey: { correctChoiceId: "yes" },
}));
const state = {
  mode: "exam", questionOrder: ["b", "a", "c"],
  responsesByQuestionId: { a: { type: "mcq_single", choiceId: "yes" }, b: { type: "mcq_single", choiceId: "no" } },
  flagged: { c: true }, timeSpentMsByQuestionId: { a: 60000, b: 120000, c: 0, unrelated: 999999 },
} as unknown as Attempt;
const report = () => buildDetailedReport(scoreAttempt(state, questions), questions, state);

it("uses historical order, topics, and all assigned questions", () => {
  const r = report();
  expect(r.complete).toBe(true);
  expect(r.rows.map(row => row.id)).toEqual(["b", "a", "c"]);
  expect(r.summary).toMatchObject({ correct: 1, incorrect: 1, unanswered: 1, total: 3 });
  expect(r.topics.find(t => t.key === "people:leadership")).toMatchObject({ total: 3, correct: 1, missed: 2, unanswered: 1 });
});

it("does not dilute pacing with unvisited questions or unrelated timing", () => {
  expect(report().pacing).toEqual({ recordedCount: 2, totalTimeMs: 180000, averageMs: 90000, longestMs: 120000 });
  const noTime = buildDetailedReport(scoreAttempt(state, questions), questions, { ...state, timeSpentMsByQuestionId: {} });
  expect(noTime.pacing.averageMs).toBeNull();
});

it("filters all, unanswered, flagged, missed, topics, and search while preserving review indexes", () => {
  const rows = report().rows;
  expect(filterReportRows(rows, "all", "", "")).toHaveLength(3);
  expect(filterReportRows(rows, "unanswered", "", "")[0]).toMatchObject({ id: "c", index: 2 });
  expect(filterReportRows(rows, "flagged", "", "")).toHaveLength(1);
  expect(filterReportRows(rows, "missed", "", "people:leadership")).toHaveLength(2);
  expect(filterReportRows(rows, "all", "Q2", "")[0].id).toBe("a");
  expect(filterReportRows(rows, "all", "leadership", "missing")).toHaveLength(0);
});

it("retains an explicit unmapped-topic bucket and marks missing historical content", () => {
  expect(questionTopics({ ...questions[0], tags: [] })[0].key).toBe("people:other");
  expect(buildDetailedReport(scoreAttempt(state, questions), [], state).complete).toBe(false);
});

it("sorts topics by missed questions, not an unsupported readiness estimate", () => {
  const extra = { ...questions[0], id: "d", tags: ["unknown-tag"] } as Question;
  const qs = [...questions, extra];
  const attempt = { ...state, questionOrder: [...state.questionOrder, "d"] };
  const r = buildDetailedReport(scoreAttempt(attempt, qs), qs, attempt);
  expect(r.topics[0].key).toBe("people:leadership");
  expect(r.topics[0].missed).toBe(2);
});
