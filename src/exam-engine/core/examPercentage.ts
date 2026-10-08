import type { AttemptResult } from "./types";

/** Exam percentages count every question, including unanswered questions. */
export function examPercentage(result: AttemptResult | null): number {
  const scores = result?.scoreResults ?? [];
  return scores.length
    ? Math.round(scores.filter((score) => score.isCorrect).length / scores.length * 10000) / 100
    : 0;
}
