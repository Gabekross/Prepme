import type { AttemptResult, Domain, QuestionType } from "./types";

export function summarize(result: AttemptResult) {
  const domainOrder: Domain[] = ["people", "process", "business_environment"];
  const typeOrder: QuestionType[] = ["mcq_single","mcq_multi","dnd_match","dnd_order","hotspot","fill_blank"];
  return {
    total: { score: result.totalScore, max: result.maxScore },
    domains: domainOrder.map((d) => ({ domain: d, ...result.byDomain[d] })),
    types: typeOrder.map((t) => ({ type: t, ...result.byType[t] })),
  };
}
