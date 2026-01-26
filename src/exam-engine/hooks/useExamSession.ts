"use client";

import { create } from "zustand";
import type { Attempt, Blueprint, Mode, Question, Response, Domain } from "../core/types";
import { createAttempt } from "../core/attempt";
import { scoreAttempt } from "../core/scoring";
import { LocalAttemptStorage } from "../core/storage";

type DomainFilter = Domain | "all";

type InitArgs = {
  bank: Question[];
  defaultBlueprint: Blueprint;
  mode: Mode;
  storageNamespace?: string; // ✅ NEW
};

type StartArgs = { reshuffleQuestions: boolean };

type State = {
  bank: Question[] | null;

  /** Unfiltered questions included in the current attempt (based on attempt.questionOrder) */
  picked: Question[] | null;

  /** Visible questions after filters (domain drill UI) */
  questions: Question[] | null;

  attempt: Attempt | null;

  filters: { domain: DomainFilter };

  // ✅ NEW: attempt storage namespace (bank+mode)
  storageNamespace: string;

  
  

  initIfNeeded: (args: InitArgs) => Promise<void>;
  setDomainFilter: (d: DomainFilter) => void;

  startNewAttempt: (args: StartArgs) => Promise<void>;
  hardRestart: (args: {
  bank: Question[];
  blueprint: Blueprint;
  mode: Mode;
  reshuffleQuestions: boolean;
  storageNamespace?: string;
  }) => Promise<void>;

  retryIncorrectOnly: () => Promise<void>;

  currentQuestion: Question | null;
  canPrev: boolean;
  canNext: boolean;

  prev: () => void;
  next: () => void;

  getResponse: (qid: string) => Response;
  setResponse: (qid: string, r: Response) => void;
  getOptionOrder: (qid: string) => string[];

  toggleFlagCurrent: () => void;
  isCurrentFlagged: boolean;

  submitAttempt: () => void;
  goToIndex: (index: number) => void;

};

function makeStorage(namespace: string) {
  return typeof window !== "undefined" ? new LocalAttemptStorage(namespace) : null;
}

function applyDomainFilter(questions: Question[], domain: DomainFilter) {
  if (domain === "all") return questions;
  return questions.filter((q) => q.domain === domain);
}

/** Visible question ids under the current filter */
function buildVisibleSet(visible: Question[] | null) {
  return new Set((visible ?? []).map((q) => q.id));
}

/** Find the next index in attempt.questionOrder that exists in visibleSet */
function findNextVisibleIndex(att: Attempt, visibleSet: Set<string>, dir: -1 | 1) {
  const order = att.questionOrder;
  let i = att.currentIndex + dir;

  while (i >= 0 && i < order.length) {
    const qid = order[i];
    if (visibleSet.has(qid)) return i;
    i += dir;
  }
  return null;
}

/** Ensure currentIndex points at a visible question (or nearest visible). */
function clampToNearestVisible(att: Attempt, visibleSet: Set<string>) {
  const order = att.questionOrder;
  const curId = order[att.currentIndex];
  if (visibleSet.has(curId)) return att.currentIndex;

  for (let i = att.currentIndex; i < order.length; i++) if (visibleSet.has(order[i])) return i;
  for (let i = att.currentIndex; i >= 0; i--) if (visibleSet.has(order[i])) return i;

  return 0;
}

/**
 * Detect if a stored attempt is "stale" vs the current bank.
 * Example: you added new Supabase questions, but the old attempt references only old IDs.
 */
function isStaleAttempt(existing: Attempt, bank: Question[]) {
  const bankIds = new Set(bank.map((q) => q.id));
  const overlap = existing.questionOrder.filter((id) => bankIds.has(id)).length;

  // If the attempt references almost nothing in the current bank, it's stale.
  // Threshold: must overlap at least 5 questions OR at least 50% of its order, whichever is smaller.
  const minRequired = Math.min(5, Math.ceil(existing.questionOrder.length * 0.5));
  return overlap < minRequired;
}

export const useExamSession = create<State>((set, get) => ({
  bank: null,
  picked: null,
  questions: null,
  attempt: null,

  filters: { domain: "all" },

  storageNamespace: "default",

  initIfNeeded: async ({ bank, defaultBlueprint, mode, storageNamespace }) => {
    const ns = storageNamespace ?? "default";
    set({ storageNamespace: ns });

    const storage = makeStorage(ns);
    const existing = storage ? await storage.loadLatestAttempt() : null;

    // stale-attempt guard
    if (existing && isStaleAttempt(existing, bank)) {
      const created = createAttempt({ bank, blueprint: defaultBlueprint, mode });
      const filtered = applyDomainFilter(created.questions, get().filters.domain);

      const visibleSet = buildVisibleSet(filtered);
      const nextIndex = clampToNearestVisible(created.attempt, visibleSet);
      const nextAttempt = { ...created.attempt, currentIndex: nextIndex };

      set({
        bank,
        attempt: nextAttempt,
        picked: created.questions,
        questions: filtered,
      });

      if (storage) await storage.saveAttempt(nextAttempt);
      return;
    }

    if (existing) {
      const pickedRaw = bank.filter((q) => existing.questionOrder.includes(q.id));
      const picked = pickedRaw.length ? pickedRaw : bank; // ✅ fallback
      const filtered = applyDomainFilter(picked, get().filters.domain);

      const visibleSet = buildVisibleSet(filtered);
      const nextIndex = clampToNearestVisible(existing, visibleSet);
      const nextAttempt = { ...existing, currentIndex: nextIndex };

      set({
        bank,
        attempt: nextAttempt,
        picked,
        questions: filtered,
      });

      storage?.saveAttempt(nextAttempt);
      return;
    }


    const created = createAttempt({ bank, blueprint: defaultBlueprint, mode });
    const filtered = applyDomainFilter(created.questions, get().filters.domain);

    const visibleSet = buildVisibleSet(filtered);
    const nextIndex = clampToNearestVisible(created.attempt, visibleSet);
    const nextAttempt = { ...created.attempt, currentIndex: nextIndex };

    set({
      bank,
      attempt: nextAttempt,
      picked: created.questions,
      questions: filtered,
    });

    if (storage) await storage.saveAttempt(nextAttempt);
  },

  setDomainFilter: (d) => {
    const bank = get().bank;
    const attempt = get().attempt;
    if (!bank || !attempt) return;

    const pickedRaw = bank.filter((q) => attempt.questionOrder.includes(q.id));
    const picked = pickedRaw.length ? pickedRaw : bank; // ✅ fallback
    const filtered = applyDomainFilter(picked, d);


    const visibleSet = buildVisibleSet(filtered);
    const nextIndex = clampToNearestVisible(attempt, visibleSet);
    const nextAttempt = { ...attempt, currentIndex: nextIndex };

    set({
      filters: { domain: d },
      picked,
      questions: filtered,
      attempt: nextAttempt,
    });

    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },

    hardRestart: async ({ bank, blueprint, mode, reshuffleQuestions, storageNamespace }) => {
    const ns = storageNamespace ?? get().storageNamespace ?? "default";
    set({ storageNamespace: ns, bank });

    const storage = makeStorage(ns);

    // Fresh attempt using PROVIDED blueprint (full set), not prior attempt.blueprint
    const seed = reshuffleQuestions ? undefined : get().attempt?.seed;
    const created = createAttempt({ bank, blueprint, mode, seed });

    const filtered = applyDomainFilter(created.questions, get().filters.domain);
    const visibleSet = buildVisibleSet(filtered);
    const nextIndex = clampToNearestVisible(created.attempt, visibleSet);
    const nextAttempt = { ...created.attempt, currentIndex: nextIndex };

    set({
      attempt: nextAttempt,
      picked: created.questions,
      questions: filtered,
    });

    await storage?.saveAttempt(nextAttempt);
  },


  startNewAttempt: async ({ reshuffleQuestions }) => {
    const bank = get().bank;
    const attempt = get().attempt;
    if (!bank || !attempt) return;

    const blueprint = attempt.blueprint;
    const mode = attempt.mode;
    const seed = reshuffleQuestions ? undefined : attempt.seed;

    const created = createAttempt({ bank, blueprint, mode, seed });
    const filtered = applyDomainFilter(created.questions, get().filters.domain);

    const visibleSet = buildVisibleSet(filtered);
    const nextIndex = clampToNearestVisible(created.attempt, visibleSet);
    const nextAttempt = { ...created.attempt, currentIndex: nextIndex };

    set({
      attempt: nextAttempt,
      picked: created.questions,
      questions: filtered,
    });

    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },

  retryIncorrectOnly: async () => {
    const bank = get().bank;
    const attempt = get().attempt;
    if (!bank || !attempt) return;

    const attemptQuestions = bank.filter((q) => attempt.questionOrder.includes(q.id));
    const result = scoreAttempt(attempt, attemptQuestions);
    const incorrectIds = result.incorrectQuestionIds;

    if (incorrectIds.length === 0) {
      const created = createAttempt({ bank, blueprint: attempt.blueprint, mode: attempt.mode });
      const filtered = applyDomainFilter(created.questions, get().filters.domain);

      const visibleSet = buildVisibleSet(filtered);
      const nextIndex = clampToNearestVisible(created.attempt, visibleSet);
      const nextAttempt = { ...created.attempt, currentIndex: nextIndex };

      set({
        attempt: nextAttempt,
        picked: created.questions,
        questions: filtered,
      });

      makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
      return;
    }

    const filteredBank = bank.filter((q) => incorrectIds.includes(q.id));
    const bp = {
      ...attempt.blueprint,
      total: Math.min(attempt.blueprint.total, filteredBank.length),
    };

    const created = createAttempt({ bank: filteredBank, blueprint: bp, mode: attempt.mode });
    const filtered = applyDomainFilter(created.questions, get().filters.domain);

    const visibleSet = buildVisibleSet(filtered);
    const nextIndex = clampToNearestVisible(created.attempt, visibleSet);
    const nextAttempt = { ...created.attempt, currentIndex: nextIndex };

    set({
      attempt: nextAttempt,
      picked: created.questions,
      questions: filtered,
    });

    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },

  get currentQuestion() {
    const att = get().attempt;
    if (!att) return null;

    const picked = get().picked ?? [];
    const bank = get().bank ?? [];

    // If picked is empty (can happen after resume), fall back to bank
    const source = picked.length ? picked : bank;
    if (!source.length) return null;

    const qid = att.questionOrder[att.currentIndex];
    return source.find((q) => q.id === qid) ?? source[0] ?? null;
  },


  get canPrev() {
    const att = get().attempt;
    if (!att) return false;
    const visibleSet = buildVisibleSet(get().questions);
    return findNextVisibleIndex(att, visibleSet, -1) !== null;
  },

  get canNext() {
    const att = get().attempt;
    if (!att) return false;
    const visibleSet = buildVisibleSet(get().questions);
    return findNextVisibleIndex(att, visibleSet, 1) !== null;
  },
  
  goToIndex: (index: number) => {
  const att = get().attempt;
  if (!att) return;

  const i = Math.max(0, Math.min(index, att.questionOrder.length - 1));
  const nextAttempt = { ...att, currentIndex: i };
  set({ attempt: nextAttempt });
  makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
},


  prev: () => {
    const att = get().attempt;
    if (!att) return;

    const visibleSet = buildVisibleSet(get().questions);
    const prevIdx = findNextVisibleIndex(att, visibleSet, -1);
    if (prevIdx === null) return;

    const nextAttempt = { ...att, currentIndex: prevIdx };
    set({ attempt: nextAttempt });
    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },

  next: () => {
    const att = get().attempt;
    if (!att) return;

    const visibleSet = buildVisibleSet(get().questions);
    const nextIdx = findNextVisibleIndex(att, visibleSet, 1);
    if (nextIdx === null) return;

    const nextAttempt = { ...att, currentIndex: nextIdx };
    set({ attempt: nextAttempt });
    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },

  getResponse: (qid) => {
    const att = get().attempt;
    if (!att) return { type: "mcq_single", choiceId: null } as any;
    return att.responsesByQuestionId[qid];
  },

  setResponse: (qid, r) => {
    const att = get().attempt;
    if (!att) return;

    const next: Attempt = {
      ...att,
      responsesByQuestionId: { ...att.responsesByQuestionId, [qid]: r },
    };

    set({ attempt: next });
    makeStorage(get().storageNamespace)?.saveAttempt(next);
  },

  getOptionOrder: (qid) => {
    const att = get().attempt;
    return att?.optionOrderByQuestionId[qid] ?? [];
  },

  toggleFlagCurrent: () => {
    const att = get().attempt;
    if (!att) return;

    const qid = att.questionOrder[att.currentIndex];
    const nextFlagged = { ...att.flagged, [qid]: !att.flagged[qid] };
    const nextAttempt = { ...att, flagged: nextFlagged };

    set({ attempt: nextAttempt });
    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },

  get isCurrentFlagged() {
    const att = get().attempt;
    if (!att) return false;
    const qid = att.questionOrder[att.currentIndex];
    return !!att.flagged[qid];
  },

  submitAttempt: () => {
    const att = get().attempt;
    if (!att) return;
    const nextAttempt = { ...att, submittedAt: new Date().toISOString() };
    set({ attempt: nextAttempt });
    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },
}));
