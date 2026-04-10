"use client";

import { create } from "zustand";
import type { Attempt, AdaptiveState, Blueprint, Difficulty, Mode, Question, Response, Domain } from "../core/types";
import { createAttempt } from "../core/attempt";
import { scoreAttempt, scoreQuestion } from "../core/scoring";
import { LocalAttemptStorage } from "../core/storage";
import {
  createAdaptiveSessionState,
  updateStreakState,
  selectNextAdaptiveQuestion,
  buildAdaptiveCandidatePool,
  type AdaptiveSessionState,
} from "../core/adaptiveSelection";
import { weightedScoreAttempt } from "../core/weightedScoring";
import { computeTopicStats, getTopicWeaknessMap } from "../core/topicAnalytics";
import { DEFAULT_DIFFICULTY } from "../core/adaptiveConfig";
import { adaptiveDebug } from "../core/adaptiveDebug";

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

  /** Adaptive engine state for practice mode. */
  adaptiveSession: AdaptiveSessionState | null;

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

  currentQuestion: () => Question | null;
  canPrev: () => boolean;
  canNext: () => boolean;

  prev: () => void;
  next: () => void;

  getResponse: (qid: string) => Response;
  setResponse: (qid: string, r: Response) => void;
  getOptionOrder: (qid: string) => string[];

  toggleFlagCurrent: () => void;
  isCurrentFlagged: () => boolean;

  submitAttempt: () => void;
  goToIndex: (index: number) => void;
  recordTimeOnQuestion: (qid: string, ms: number) => void;

  /**
   * Record an answer AND update adaptive state (streak, weakness tracking).
   * Call this after revealing the answer in practice mode.
   */
  recordAdaptiveResult: (qid: string, isCorrect: boolean) => void;

  /**
   * Set confidence level for a specific question.
   */
  setConfidence: (qid: string, level: "low" | "medium" | "high") => void;

  /**
   * Explicitly destroy the current in-progress session.
   * Clears both the Zustand in-memory state and the localStorage entry.
   * Does NOT clear submitted attempts (results must remain accessible).
   * Call this when the user explicitly chooses to abandon an exam.
   */
  resetSession: () => Promise<void>;

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
  // Empty or broken attempts are always stale
  if (!existing.questionOrder?.length) return true;

  const bankIds = new Set(bank.map((q) => q.id));
  const overlap = existing.questionOrder.filter((id) => bankIds.has(id)).length;

  // If the attempt references almost nothing in the current bank, it's stale.
  // Threshold: must overlap at least 5 questions OR at least 50% of its order, whichever is smaller.
  const minRequired = Math.min(5, Math.ceil(existing.questionOrder.length * 0.5));
  return overlap < minRequired;
}

/** Rebuild adaptive weakness maps from current attempt state. */
function rebuildAdaptiveWeakness(
  attempt: Attempt,
  questions: Question[],
  session: AdaptiveSessionState,
): AdaptiveSessionState {
  const qs = questions.filter((q) => attempt.questionOrder.includes(q.id));
  if (!qs.length) return session;

  const weighted = weightedScoreAttempt(attempt, qs);

  // Domain weakness: invert weighted percent (100% = 0 weakness)
  const domainWeakness = { ...session.domainWeakness };
  for (const d of ["people", "process", "business_environment"] as Domain[]) {
    const stats = weighted.byDomain[d];
    if (stats.total > 0) {
      domainWeakness[d] = 1 - stats.weightedPercent / 100;
    }
  }

  // Topic weakness
  const topicStats = computeTopicStats(weighted.scoreResults, qs);
  const topicWeakness = getTopicWeaknessMap(topicStats);

  return { ...session, domainWeakness, topicWeakness };
}

export const useExamSession = create<State>((set, get) => ({
  bank: null,
  picked: null,
  questions: null,
  attempt: null,

  filters: { domain: "all" },

  storageNamespace: "default",

  adaptiveSession: null,

  initIfNeeded: async ({ bank, defaultBlueprint, mode, storageNamespace }) => {
    const ns = storageNamespace ?? "default";
    set({ storageNamespace: ns });

    const storage = makeStorage(ns);
    const existing = storage ? await storage.loadLatestAttempt() : null;

    // Initialize adaptive session for practice mode (safe: never throws)
    const initAdaptive = (att: Attempt, qs: Question[]) => {
      try {
        if (mode !== "practice") { set({ adaptiveSession: null }); return; }
        let session = createAdaptiveSessionState();
        // Restore from persisted adaptive state if available
        if (att.adaptiveState) {
          session = {
            ...session,
            consecutiveCorrect: att.adaptiveState.consecutiveCorrect ?? 0,
            consecutiveWrong: att.adaptiveState.consecutiveWrong ?? 0,
            targetDifficulty: att.adaptiveState.targetDifficulty ?? DEFAULT_DIFFICULTY,
            recentQuestionIds: att.adaptiveState.recentQuestionIds ?? [],
            recentDomains: (att.adaptiveState.recentDomains ?? []) as Domain[],
          };
        }
        // Rebuild weakness maps from current progress
        session = rebuildAdaptiveWeakness(att, qs, session);
        set({ adaptiveSession: session });
        adaptiveDebug.dumpState("Init adaptive session", {
          targetDifficulty: session.targetDifficulty,
          streak: `${session.consecutiveCorrect}✓ ${session.consecutiveWrong}✗`,
          domainWeakness: session.domainWeakness,
        });
      } catch (e) {
        // Never let adaptive init failure block the main exam flow
        console.warn("[Adaptive] Init failed, continuing without adaptive state:", e);
        set({ adaptiveSession: null });
      }
    };

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
      initAdaptive(nextAttempt, created.questions);

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
      initAdaptive(nextAttempt, bank);

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
    initAdaptive(nextAttempt, created.questions);

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
      adaptiveSession: mode === "practice" ? createAdaptiveSessionState() : null,
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
      adaptiveSession: mode === "practice" ? createAdaptiveSessionState() : null,
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

  currentQuestion: (): Question | null => {
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

  canPrev: (): boolean => {
    const att = get().attempt;
    if (!att) return false;
    const visibleSet = buildVisibleSet(get().questions);
    return findNextVisibleIndex(att, visibleSet, -1) !== null;
  },

  canNext: (): boolean => {
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
    // Guard: return a safe default if the question isn't in the response map
    // (can happen during state transitions between different exam sets)
    return att.responsesByQuestionId[qid] ?? ({ type: "mcq_single", choiceId: null } as any);
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

  isCurrentFlagged: (): boolean => {
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

  recordTimeOnQuestion: (qid: string, ms: number) => {
    const att = get().attempt;
    if (!att || ms <= 0) return;
    const prev = att.timeSpentMsByQuestionId[qid] ?? 0;
    const nextAttempt = {
      ...att,
      timeSpentMsByQuestionId: { ...att.timeSpentMsByQuestionId, [qid]: prev + ms },
    };
    set({ attempt: nextAttempt });
    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },

  recordAdaptiveResult: (qid: string, isCorrect: boolean) => {
    try {
      const att = get().attempt;
      const session = get().adaptiveSession;
      const bank = get().bank;
      if (!att || !session || !bank || att.mode !== "practice") return;

      const q = bank.find((bq) => bq.id === qid);
      if (!q) return;

      // Update streak and difficulty target
      let nextSession = updateStreakState(session, qid, q.domain, isCorrect);

      // Rebuild weakness maps periodically (every answer in practice mode)
      nextSession = rebuildAdaptiveWeakness(att, bank, nextSession);

      // Persist adaptive state into the attempt
      const adaptiveState: AdaptiveState = {
        consecutiveCorrect: nextSession.consecutiveCorrect,
        consecutiveWrong: nextSession.consecutiveWrong,
        targetDifficulty: nextSession.targetDifficulty,
        recentQuestionIds: nextSession.recentQuestionIds,
        recentDomains: nextSession.recentDomains,
      };
      const nextAttempt = { ...att, adaptiveState };

      set({ adaptiveSession: nextSession, attempt: nextAttempt });
      makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
    } catch (e) {
      console.warn("[Adaptive] recordAdaptiveResult failed:", e);
    }
  },

  setConfidence: (qid: string, level: "low" | "medium" | "high") => {
    const att = get().attempt;
    if (!att) return;

    const confidenceByQuestionId = { ...(att.confidenceByQuestionId ?? {}), [qid]: level };
    const nextAttempt = { ...att, confidenceByQuestionId };

    set({ attempt: nextAttempt });
    makeStorage(get().storageNamespace)?.saveAttempt(nextAttempt);
  },

  resetSession: async () => {
    const att = get().attempt;
    const ns = get().storageNamespace;
    // Only wipe in-progress attempts; keep submitted ones so results remain accessible
    if (att && !att.submittedAt) {
      await makeStorage(ns)?.clearLatest();
    }
    set({ attempt: null, picked: null, questions: null, bank: null, adaptiveSession: null });
  },
}));
