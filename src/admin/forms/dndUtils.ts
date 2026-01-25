import { pretty, safeParse } from "./utils";

export type Prompt = { id: string; text: string };
export type Answer = { id: string; text: string };

export function nextId(prefix: string, existing: string[]) {
  const used = new Set(existing);
  for (let i = 1; i <= 999; i++) {
    const id = `${prefix}${i}`;
    if (!used.has(id)) return id;
  }
  return `${prefix}${existing.length + 1}`;
}

export function parseMatchPayload(payloadJson: string) {
  return safeParse<{ prompts: Prompt[]; answers: Answer[] }>(payloadJson, { prompts: [], answers: [] });
}

export function parseMatchAnswerKey(answerKeyJson: string) {
  return safeParse<{ mapping: Record<string, string> }>(answerKeyJson, { mapping: {} });
}

export function writeMatch(
  prompts: Prompt[],
  answers: Answer[],
  mapping: Record<string, string>
) {
  // Remove mapping entries for removed prompts/answers
  const promptIds = new Set(prompts.map((p) => p.id));
  const answerIds = new Set(answers.map((a) => a.id));
  const clean: Record<string, string> = {};

  for (const [pid, aid] of Object.entries(mapping)) {
    if (promptIds.has(pid) && answerIds.has(aid)) clean[pid] = aid;
  }

  return {
    payloadJson: pretty({ prompts, answers }),
    answerKeyJson: pretty({ mapping: clean }),
  };
}

export function parseOrderPayload(payloadJson: string) {
  return safeParse<{ items: { id: string; text: string }[] }>(payloadJson, { items: [] });
}

export function parseOrderAnswerKey(answerKeyJson: string) {
  return safeParse<{ orderedIds: string[] }>(answerKeyJson, { orderedIds: [] });
}

export function writeOrder(items: { id: string; text: string }[], orderedIds: string[]) {
  const ids = items.map((i) => i.id);
  const clean = orderedIds.filter((id) => ids.includes(id));

  // if empty or mismatched, default to current items order
  const finalOrder = clean.length === ids.length ? clean : ids;

  return {
    payloadJson: pretty({ items }),
    answerKeyJson: pretty({ orderedIds: finalOrder }),
  };
}
