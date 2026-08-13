"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Question, Scenario, AttemptResult, Response } from "@/src/exam-engine/core/types";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";
import { QuestionRenderer } from "@/src/exam-engine/ui/QuestionRenderer";

/* ── types ──────────────────────────────────────────────────────────────── */

type FilterMode = "all" | "incorrect" | "unanswered" | "flagged";

const FILTERS: FilterMode[] = ["all", "incorrect", "unanswered", "flagged"];

function parseFilter(value: string | null): FilterMode {
  return FILTERS.includes(value as FilterMode) ? (value as FilterMode) : "all";
}

function parseQuestionIndex(value: string | null): number {
  const n = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function defaultResponseFor(question: Question): Response {
  switch (question.type) {
    case "mcq_multi":
      return { type: "mcq_multi", choiceIds: [] };
    case "dnd_match":
      return { type: "dnd_match", mapping: {} };
    case "dnd_order":
      return { type: "dnd_order", orderedIds: [] };
    case "hotspot":
      return { type: "hotspot", selectedRegionId: null };
    default:
      return { type: "mcq_single", choiceId: null };
  }
}

type AttemptRow = {
  id: string;
  bank_slug: string;
  result: AttemptResult | null;
  state: any;
};

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── styled components ──────────────────────────────────────────────────── */

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  animation: ${fadeUp} 400ms ease both;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  text-decoration: none;
  transition: color 150ms ease;
  &:hover { color: ${(p) => p.theme.text}; }
`;

const ProgressLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  font-variant-numeric: tabular-nums;
`;

/* ── filter bar ─────────────────────────────────────────────────────────── */

const FilterBar = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  border: 1.5px solid ${(p) => (p.$active ? p.theme.accent : p.theme.cardBorder)};
  background: ${(p) => (p.$active ? p.theme.accentSoft : p.theme.cardBg)};
  color: ${(p) => (p.$active ? p.theme.accent : p.theme.text)};
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    border-color: ${(p) => p.theme.accent};
  }
`;

const FilterCount = styled.span`
  font-size: 11px;
  font-weight: 800;
  opacity: 0.7;
`;

/* ── question card ──────────────────────────────────────────────────────── */

const QuestionCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: ${(p) => p.theme.shadow};
  margin-bottom: 16px;
  animation: ${slideIn} 280ms ease both;

  @media (max-width: 480px) {
    padding: 18px 14px;
  }
`;

const QuestionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
`;

const QuestionNumber = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${(p) => p.theme.muted};
`;

const ResultBadge = styled.div<{ $correct: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
  background: ${(p) => (p.$correct ? p.theme.successSoft : p.theme.errorSoft)};
  color: ${(p) => (p.$correct ? p.theme.success : p.theme.error)};
  border: 1px solid ${(p) => (p.$correct ? p.theme.successBorder : p.theme.errorBorder)};
`;

const FlagBadge = styled.span`
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  background: ${(p) => p.theme.warningSoft};
  color: ${(p) => p.theme.warning};
  border: 1px solid ${(p) => p.theme.warningBorder};
  font-weight: 700;
`;

const UnansweredBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
  background: ${(p) => p.theme.name === "dark" ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.08)"};
  color: ${(p) => p.theme.muted};
  border: 1px solid ${(p) => p.theme.cardBorder};
`;

/* ── explanation card ───────────────────────────────────────────────────── */

const ExplanationCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 20px;
  box-shadow: ${(p) => p.theme.shadow};
  margin-bottom: 16px;
  animation: ${slideIn} 280ms 80ms ease both;
`;

const ExplanationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const ExplanationIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  display: grid;
  place-items: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const ExplanationTitleWrap = styled.div``;

const ExplanationTitle = styled.div`
  font-weight: 800;
  font-size: 14px;
  color: ${(p) => p.theme.text};
`;

const ExplanationSubtitle = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
`;

const ExplanationBody = styled.div`
  color: ${(p) => p.theme.text};
  font-size: 14px;
  line-height: 1.70;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  border-top: 1px solid ${(p) => p.theme.divider};
  padding-top: 12px;
  overflow: auto;
  max-height: 480px;
`;

/* ── navigation ─────────────────────────────────────────────────────────── */

const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 32px;
`;

const NavBtn = styled.button<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  border: 1.5px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg};
  color: ${(p) => (p.$disabled ? p.theme.muted : p.theme.text)};
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  transition: all 150ms ease;

  &:hover:not(:disabled) {
    border-color: ${(p) => p.theme.accent};
    color: ${(p) => p.theme.accent};
  }
`;

const NavCenter = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  font-variant-numeric: tabular-nums;
`;

/* ── loading / error ────────────────────────────────────────────────────── */

const Message = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
`;

/* ── component ──────────────────────────────────────────────────────────── */

export default function ReviewClient({ attemptId }: { attemptId: string }) {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const sb = useMemo(() => supabaseBrowser(), []);

  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter & nav state
  const initialFilter = parseFilter(searchParams.get("filter"));
  const initialQ = parseQuestionIndex(searchParams.get("q"));
  const [filter, setFilter] = useState<FilterMode>(initialFilter);
  const [currentIdx, setCurrentIdx] = useState(initialQ);
  const didMountFilter = useRef(false);

  // Load attempt
  useEffect(() => {
    if (authLoading || !user) return;

    (async () => {
      try {
        const { data, error: fetchError } = await sb
          .from("attempts")
          .select("id, bank_slug, result, state")
          .eq("id", attemptId)
          .eq("user_id", user.id)
          .single();

        if (fetchError || !data) {
          setError("Attempt not found.");
          return;
        }
        setAttempt(data as AttemptRow);
      } catch (err) {
        console.error("[Review] Failed to load attempt:", err);
        setError("Failed to load review data.");
      }
    })();
  }, [user, authLoading, sb, attemptId]);

  // Load questions & scenarios
  useEffect(() => {
    if (!attempt?.bank_slug) return;
    let cancelled = false;

    (async () => {
      try {
        const bank = await loadBankBySlug(attempt.bank_slug);
        const [qs, scs] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);
        if (cancelled) return;
        setQuestions(qs);
        setScenarios(scs);
      } catch (err) {
        console.error("[Review] Failed to load questions:", err);
        setError("Failed to load questions.");
      } finally {
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [attempt?.bank_slug]);

  // Build derived data
  const questionMap = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.id, q])),
    [questions]
  );

  const scenarioMap = useMemo(
    () => Object.fromEntries(scenarios.map((s) => [s.id, s])),
    [scenarios]
  );

  const scoreResultMap = useMemo(() => {
    if (!attempt?.result?.scoreResults) return new Map<string, any>();
    return new Map(attempt.result.scoreResults.map((sr: any) => [sr.questionId, sr]));
  }, [attempt?.result]);

  const flaggedSet = useMemo(() => {
    const flags = attempt?.state?.flagged;
    if (!flags || typeof flags !== "object") return new Set<string>();
    return new Set(Object.entries(flags).filter(([, v]) => v).map(([k]) => k));
  }, [attempt?.state]);

  // Full ordered question list — ALL questions in exam order (including unanswered)
  const allQuestionIds = useMemo(() => {
    const order: string[] = attempt?.state?.questionOrder ?? [];
    // Only include questions we have loaded in the bank
    return order.filter((qid) => questionMap[qid]);
  }, [attempt?.state, questionMap]);

  // Attempted questions (maxScore > 0)
  const attemptedIds = useMemo(
    () => allQuestionIds.filter((qid) => {
      const sr = scoreResultMap.get(qid);
      return sr && sr.maxScore > 0;
    }),
    [allQuestionIds, scoreResultMap]
  );

  const incorrectIds = useMemo(
    () => attemptedIds.filter((qid) => {
      const sr = scoreResultMap.get(qid);
      return sr && !sr.isCorrect;
    }),
    [attemptedIds, scoreResultMap]
  );

  const unansweredIds = useMemo(
    () => allQuestionIds.filter((qid) => {
      const sr = scoreResultMap.get(qid);
      return !sr || sr.maxScore === 0;
    }),
    [allQuestionIds, scoreResultMap]
  );

  const flaggedIds = useMemo(
    () => allQuestionIds.filter((qid) => flaggedSet.has(qid)),
    [allQuestionIds, flaggedSet]
  );

  // Filtered list based on current filter mode
  const filteredIds = useMemo(() => {
    switch (filter) {
      case "incorrect": return incorrectIds;
      case "unanswered": return unansweredIds;
      case "flagged": return flaggedIds;
      default: return allQuestionIds;
    }
  }, [filter, allQuestionIds, incorrectIds, unansweredIds, flaggedIds]);

  // Reset index when filter changes
  useEffect(() => {
    if (!didMountFilter.current) {
      didMountFilter.current = true;
      return;
    }
    setCurrentIdx(0);
  }, [filter]);

  useEffect(() => {
    if (filteredIds.length === 0) return;
    setCurrentIdx((i) => Math.max(0, Math.min(i, filteredIds.length - 1)));
  }, [filteredIds.length]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentIdx((i) => Math.min(i + 1, filteredIds.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentIdx((i) => Math.max(i - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filteredIds.length]);

  const goNext = useCallback(() => setCurrentIdx((i) => Math.min(i + 1, filteredIds.length - 1)), [filteredIds.length]);
  const goPrev = useCallback(() => setCurrentIdx((i) => Math.max(i - 1, 0)), []);

  // Current question data
  const currentQid = filteredIds[currentIdx];
  const currentQuestion = currentQid ? questionMap[currentQid] : null;
  const currentScenario = currentQuestion?.scenarioId ? scenarioMap[currentQuestion.scenarioId] : undefined;
  const currentResponse = currentQid && currentQuestion
    ? (attempt?.state?.responsesByQuestionId?.[currentQid] ?? defaultResponseFor(currentQuestion))
    : null;
  const currentOptionOrder = currentQid ? (attempt?.state?.optionOrderByQuestionId?.[currentQid] ?? []) : [];
  const currentScoreResult = currentQid ? scoreResultMap.get(currentQid) : null;
  const isFlagged = currentQid ? flaggedSet.has(currentQid) : false;

  // Loading states
  if (authLoading || loading) return <Message>Loading review...</Message>;
  if (error) return <Message>{error}</Message>;
  if (!attempt) return <Message>Attempt not found.</Message>;
  if (allQuestionIds.length === 0) return <Message>No questions to review.</Message>;

  return (
    <Wrap>
      {/* ── Top bar ──────────────────────────────────────────── */}
      <TopBar>
        <BackLink href={`/dashboard/results/${attemptId}`}>
          ← Back to Results
        </BackLink>
        <ProgressLabel>
          {filteredIds.length} question{filteredIds.length !== 1 ? "s" : ""}
        </ProgressLabel>
      </TopBar>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <FilterBar>
        <FilterBtn $active={filter === "all"} onClick={() => setFilter("all")}>
          All <FilterCount>({allQuestionIds.length})</FilterCount>
        </FilterBtn>
        <FilterBtn $active={filter === "incorrect"} onClick={() => setFilter("incorrect")}>
          Incorrect <FilterCount>({incorrectIds.length})</FilterCount>
        </FilterBtn>
        {unansweredIds.length > 0 && (
          <FilterBtn $active={filter === "unanswered"} onClick={() => setFilter("unanswered")}>
            Unanswered <FilterCount>({unansweredIds.length})</FilterCount>
          </FilterBtn>
        )}
        <FilterBtn $active={filter === "flagged"} onClick={() => setFilter("flagged")}>
          Flagged <FilterCount>({flaggedIds.length})</FilterCount>
        </FilterBtn>
      </FilterBar>

      {/* ── Question ─────────────────────────────────────────── */}
      {currentQuestion && filteredIds.length > 0 ? (
        <>
          <QuestionCard key={currentQid}>
            <QuestionHeader>
              <QuestionNumber>Question {currentIdx + 1} of {filteredIds.length}</QuestionNumber>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {isFlagged && <FlagBadge>Flagged</FlagBadge>}
                {currentScoreResult && currentScoreResult.maxScore > 0 ? (
                  <ResultBadge $correct={currentScoreResult.isCorrect}>
                    {currentScoreResult.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </ResultBadge>
                ) : (
                  <UnansweredBadge>— Not Answered</UnansweredBadge>
                )}
              </div>
            </QuestionHeader>

            <QuestionRenderer
              question={currentQuestion}
              scenario={currentScenario}
              response={currentResponse}
              optionOrder={currentOptionOrder}
              onChange={() => {}}
              showCorrect={true}
            />
          </QuestionCard>

          {/* ── Explanation ─────────────────────────────────────── */}
          <ExplanationCard>
            <ExplanationHeader>
              <ExplanationIcon>💡</ExplanationIcon>
              <ExplanationTitleWrap>
                <ExplanationTitle>Explanation</ExplanationTitle>
                <ExplanationSubtitle>Why this answer is correct</ExplanationSubtitle>
              </ExplanationTitleWrap>
            </ExplanationHeader>
            <ExplanationBody>
              {currentQuestion.explanation
                ? currentQuestion.explanation
                : "No explanation has been provided for this question yet."}
            </ExplanationBody>
          </ExplanationCard>

          {/* ── Navigation ─────────────────────────────────────── */}
          <NavRow>
            <NavBtn onClick={goPrev} disabled={currentIdx === 0} $disabled={currentIdx === 0}>
              ← Prev
            </NavBtn>
            <NavCenter>
              {currentIdx + 1} / {filteredIds.length}
            </NavCenter>
            <NavBtn
              onClick={goNext}
              disabled={currentIdx >= filteredIds.length - 1}
              $disabled={currentIdx >= filteredIds.length - 1}
            >
              Next →
            </NavBtn>
          </NavRow>
        </>
      ) : (
        <QuestionCard>
          <Message>
            {filter === "flagged"
              ? "You didn't flag any questions during this attempt."
              : filter === "incorrect"
              ? "All questions were answered correctly!"
              : filter === "unanswered"
              ? "All questions were answered."
              : "No questions to display."}
          </Message>
        </QuestionCard>
      )}
    </Wrap>
  );
}
