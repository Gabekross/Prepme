import type { Question } from "../core/types";

export type QuestionVersionRow = {
  bank_id: string;
  question_key: string;
  version: number;
  content: unknown;
};

/**
 * Convert the immutable JSON snapshot stored in question_versions to the
 * engine's Question shape. Snapshots are server-only and include answer keys.
 */
export function questionFromVersionRow(row: QuestionVersionRow): Question {
  const content = row.content as Record<string, unknown>;
  return {
    id: typeof content.id === "string" ? content.id : row.question_key,
    type: content.type as Question["type"],
    domain: content.domain as Question["domain"],
    prompt: String(content.prompt ?? ""),
    scenarioId: typeof content.scenarioId === "string" ? content.scenarioId : undefined,
    difficulty: (content.difficulty ?? undefined) as Question["difficulty"],
    tags: Array.isArray(content.tags) ? content.tags.filter((tag): tag is string => typeof tag === "string") : [],
    accessTier: (content.accessTier ?? "free") as "free" | "premium",
    setId: content.setId as Question["setId"],
    version: typeof content.version === "number" ? content.version : row.version,
    media: (content.media ?? undefined) as Question["media"],
    payload: content.payload,
    answerKey: content.answerKey,
    explanation: typeof content.explanation === "string" ? content.explanation : undefined,
  } as Question;
}
