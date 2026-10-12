import type { AttemptResult, Domain, Question } from "./types";
import { examPercentage } from "./examPercentage";

export function resultsSummary(result: AttemptResult, questions: Question[]) {
  const byId = new Map(questions.map(q => [q.id, q]));
  const domains: Record<Domain, { correct: number; total: number; answered: number }> = {
    people: { correct: 0, total: 0, answered: 0 },
    process: { correct: 0, total: 0, answered: 0 },
    business_environment: { correct: 0, total: 0, answered: 0 },
  };
  for (const score of result.scoreResults) {
    const question = byId.get(score.questionId);
    if (!question) continue;
    const domain = domains[question.domain];
    domain.total++;
    if (score.maxScore > 0) domain.answered++;
    if (score.isCorrect) domain.correct++;
  }
  const total = result.scoreResults.length;
  const correct = result.scoreResults.filter(s => s.isCorrect).length;
  const unanswered = result.scoreResults.filter(s => s.maxScore === 0).length;
  const limited = total === 0 || (total - unanswered) / total < 0.8;
  const weakest = limited ? null : (Object.entries(domains) as [Domain, typeof domains.people][])
    .filter(([, d]) => d.total > 0)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0]?.[0] ?? null;
  return { total, correct, unanswered, incorrect: total - correct - unanswered,
    missed: total - correct, percent: examPercentage(result), domains, limited, weakest };
}
