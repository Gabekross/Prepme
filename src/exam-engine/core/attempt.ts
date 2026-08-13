import type { Attempt, Blueprint, Mode, Question, Response } from "./types";
import { seededRng } from "./rng";
import { shuffleArray } from "./shuffle";
import { filterBank, selectByBlueprint } from "./blueprint";

function isoNow() {
  return new Date().toISOString();
}

function uid() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `att_${hex}_${Date.now()}`;
}

function payloadArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function defaultResponseFor(q: Question): Response {
  switch (q.type) {
    case "mcq_single":
      return { type: "mcq_single", choiceId: null };
    case "mcq_multi":
      return { type: "mcq_multi", choiceIds: [] };
    case "dnd_match":
      return {
        type: "dnd_match",
        mapping: Object.fromEntries(
          payloadArray<{ id: string }>((q as any).payload?.prompts).map((p) => [p.id, null])
        ),
      };
    case "dnd_order":
      return {
        type: "dnd_order",
        orderedIds: payloadArray<{ id: string }>((q as any).payload?.items).map((i) => i.id),
      };
    case "hotspot":
      return { type: "hotspot", selectedRegionId: null };
  }
}

export function createAttempt(args: {
  bank: Question[];
  blueprint: Blueprint;
  mode: Mode;
  seed?: string;
}): { attempt: Attempt; questions: Question[] } {
  const id = uid();
  const seed = args.seed ?? id;
  const rand = seededRng(seed);

  const filtered = filterBank(args.bank, args.blueprint);
  const shuffledPool = shuffleArray(filtered, rand);
  const selected = selectByBlueprint(shuffledPool, args.blueprint);

  const questionOrder = shuffleArray(selected.map((q) => q.id), rand);

  const optionOrderByQuestionId: Record<string, string[]> = {};
  selected.forEach((q) => {
    if (q.type === "mcq_single" || q.type === "mcq_multi") {
      optionOrderByQuestionId[q.id] = shuffleArray(
        payloadArray<{ id: string }>((q as any).payload?.choices).map((c) => c.id),
        rand
      );
    } else if (q.type === "dnd_match") {
      optionOrderByQuestionId[q.id] = shuffleArray(
        payloadArray<{ id: string }>((q as any).payload?.answers).map((a) => a.id),
        rand
      );
    } else {
      optionOrderByQuestionId[q.id] = [];
    }
  });

  const now = isoNow();
  const attempt: Attempt = {
    id,
    mode: args.mode,
    seed,
    createdAt: now,
    lastSavedAt: now,
    blueprint: args.blueprint,
    questionRefs: selected.map((q) => ({ id: q.id, version: q.version })),
    questionOrder,
    optionOrderByQuestionId,
    currentIndex: 0,
    responsesByQuestionId: Object.fromEntries(selected.map((q) => [q.id, defaultResponseFor(q)])),
    flagged: {},
    timeSpentMsByQuestionId: {},
    submittedAt: null
  };

  return { attempt, questions: selected };
}
