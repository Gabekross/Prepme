"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { Blueprint, Domain, Question, Scenario, Response } from "../core/types";
import { useExamSession } from "../hooks/useExamSession";
import { QuestionRenderer } from "./QuestionRenderer";
import { scoreAttempt } from "../core/scoring";
import { LocalAttemptStorage } from "../core/storage";

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;

  @media (min-width: 980px) {
    grid-template-columns: 360px 1fr;
    align-items: start;
  }
`;

const Card = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 14px;
  box-shadow: ${(p) => p.theme.shadow};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: -40px -40px auto auto;
    width: 260px;
    height: 260px;
    background: radial-gradient(circle at 30% 30%, ${(p) => p.theme.accentSoft}, transparent 65%);
    transform: rotate(10deg);
    pointer-events: none;
  }
`;

const Title = styled.h1`
  font-size: 18px;
  margin: 0 0 8px 0;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.15px;
`;

const Subtle = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  line-height: 1.4;
`;

const Row = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const Label = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 6px;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Button = styled.button`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 10px 12px;
  font-weight: 900;
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 10px 12px;
  outline: none;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.cardBorder};
  margin: 8px 0;
`;

const SectionTitle = styled.div`
  font-weight: 950;
  font-size: 14px;
  color: ${(p) => p.theme.text};
  margin-top: 6px;
`;

const Stat = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const StatBox = styled.div`
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => (p.theme.name === "dark" ? "rgba(255,255,255,0.04)" : "#f8fafc")};
  border-radius: 14px;
  padding: 10px 12px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
`;

const StatValue = styled.div`
  margin-top: 4px;
  font-size: 16px;
  font-weight: 950;
  color: ${(p) => p.theme.text};
`;

const AccentPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  font-size: 12px;
  font-weight: 900;
  margin-top: 10px;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${(p) => p.theme.accent};
  }
`;

const CounterPill = styled.div`
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  font-size: 12px;
  font-weight: 900;
`;

const RightCol = styled.div`
  display: grid;
  gap: 16px;
`;

const ExplanationCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 14px;
  box-shadow: ${(p) => p.theme.shadow};
`;

const ExplanationTitle = styled.div`
  font-weight: 950;
  font-size: 14px;
  color: ${(p) => p.theme.text};
`;

const ExplanationBody = styled.div`
  margin-top: 8px;
  color: ${(p) => p.theme.text};
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
`;

function isAnswered(question: Question | null, response: Response): boolean {
  if (!question) return false;

  switch (question.type) {
    case "mcq_single":
      return response?.type === "mcq_single" && !!response.choiceId;
    case "mcq_multi":
      return response?.type === "mcq_multi" && Array.isArray(response.choiceIds) && response.choiceIds.length > 0;
    case "dnd_match":
      return response?.type === "dnd_match" && response.mapping && Object.values(response.mapping).some((v) => !!v);
    case "dnd_order":
      return response?.type === "dnd_order" && Array.isArray(response.orderedIds) && response.orderedIds.length > 0;
    case "hotspot":
      return response?.type === "hotspot" && !!response.selectedRegionId;
    case "fill_blank":
      return (
        response?.type === "fill_blank" &&
        response.values &&
        Object.values(response.values).some((v) => String(v ?? "").trim().length > 0)
      );
    default:
      return false;
  }
}

export function EngineRunner(props: {
  title: string;
  subtitle: string;
  questions: Question[];
  scenarios: Scenario[];
  blueprint: Blueprint;
  mode: "practice" | "exam";
  allowDomainFilter?: boolean;
  storageNamespace: string;
}) {
  const { title, subtitle, questions, scenarios, blueprint, mode, storageNamespace } = props;

  const engine = useExamSession();

  // practice-only reveal state
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  // practice-only: submitted per question (unlocks Learn more)
  const [submittedQ, setSubmittedQ] = useState<Record<string, boolean>>({});
  // practice-only: explanation visibility per question
  const [showExplain, setShowExplain] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setRevealed({});
    setSubmittedQ({});
    setShowExplain({});
    engine.initIfNeeded({
      bank: questions,
      defaultBlueprint: blueprint,
      mode,
      storageNamespace,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, questions, storageNamespace]);

  const current = useMemo(() => {
    if (!engine.attempt) return null;
    const order = engine.attempt.questionOrder ?? [];
    if (!order.length) return questions[0] ?? null;
    const qid = order[engine.attempt.currentIndex];
    return questions.find((q) => q.id === qid) ?? questions[0] ?? null;
  }, [engine.attempt, questions]);

  const currentId = current?.id ?? null;

  // Close explanation whenever question changes
  useEffect(() => {
    if (!currentId) return;
    setShowExplain((prev) => ({ ...prev, [currentId]: false }));
  }, [currentId]);

  // ✅ Listen for restart event from AppShell menu (practice only)
  useEffect(() => {
    if (mode !== "practice") return;

    async function handler(e: any) {
      const evtSlug = e?.detail?.bankSlug as string | undefined;
      if (!evtSlug) return;

      // namespace format: `${bankSlug}__practice`
      if (!storageNamespace.startsWith(`${evtSlug}__practice`)) return;

      // full reset
      setRevealed({});
      setSubmittedQ({});
      setShowExplain({});

      const s = new LocalAttemptStorage(storageNamespace);
      if (s.clearLatest) await s.clearLatest();

      if ((engine as any).hardRestart) {
        await (engine as any).hardRestart({
          bank: questions,
          blueprint,
          mode,
          reshuffleQuestions: true,
          storageNamespace,
        });
      } else {
        await engine.startNewAttempt({ reshuffleQuestions: true });
      }
    }

    window.addEventListener("practice:restart", handler as any);
    return () => window.removeEventListener("practice:restart", handler as any);
  }, [mode, storageNamespace, questions, blueprint, engine]);

  const total = engine.attempt?.questionOrder?.length ?? questions.length;
  const index = engine.attempt ? engine.attempt.currentIndex : 0;
  const x = total ? Math.min(total, index + 1) : 0;
  const isLast = engine.attempt ? index >= engine.attempt.questionOrder.length - 1 : false;

  const domain = engine.filters.domain as Domain | "all";

  const result = useMemo(() => {
    if (!engine.attempt || !engine.bank) return null;
    if (!engine.attempt.submittedAt) return null;
    const qs = engine.bank.filter((q) => engine.attempt!.questionOrder.includes(q.id));
    return scoreAttempt(engine.attempt, qs);
  }, [engine.attempt, engine.bank]);

  const currentResponse = current ? engine.getResponse(current.id) : (null as any);
  const answered = isAnswered(current, currentResponse);

  // showCorrect rules
  const showCorrect =
    mode === "exam"
      ? !!engine.attempt?.submittedAt
      : !!engine.attempt?.submittedAt || (currentId ? !!revealed[currentId] : false);

  // Primary label/behavior
  const primaryLabel = useMemo(() => {
    if (!engine.attempt) return "Next";

    if (mode === "practice") {
      const isRevealed = !!(currentId && revealed[currentId]);
      if (!isRevealed && answered) return "Submit answer";
      if (isLast) return "Done";
      return "Next question";
    }

    // exam strict
    return isLast ? "Done" : "Next question";
  }, [engine.attempt, mode, answered, currentId, revealed, isLast]);

  const primaryDisabled = useMemo(() => {
    if (!engine.attempt) return true;

    if (mode === "practice") {
      const isRevealed = !!(currentId && revealed[currentId]);
      if (!isRevealed && !answered) return true;
      return false;
    }

    return false;
  }, [engine.attempt, mode, answered, currentId, revealed]);

  function onPrimary() {
    if (!engine.attempt) return;

    if (mode === "practice") {
      const isRevealed = !!(currentId && revealed[currentId]);

      // Submit answer => reveal current only + unlock Learn more
      if (!isRevealed) {
        if (!currentId) return;
        setRevealed((prev) => ({ ...prev, [currentId]: true }));
        setSubmittedQ((prev) => ({ ...prev, [currentId]: true }));
        setShowExplain((prev) => ({ ...prev, [currentId]: false }));
        return;
      }

      // Next question/done
      if (isLast) return;
      engine.next();
      return;
    }

    // exam strict: next or done submits attempt
    if (isLast) {
      engine.submitAttempt();
      return;
    }
    engine.next();
  }

  return (
    <Grid>
      <Card>
        <Title>{title}</Title>
        <Subtle>{subtitle}</Subtle>

        <AccentPill>{mode === "practice" ? "Practice mode" : "Exam simulation"}</AccentPill>
        <CounterPill>Question {x} of {total}</CounterPill>

        <Row>
          {props.allowDomainFilter ? (
            <div>
              <Label>Filter by domain</Label>
              <Select value={domain} onChange={(e) => engine.setDomainFilter(e.target.value as any)}>
                <option value="all">All domains</option>
                <option value="people">People</option>
                <option value="process">Process</option>
                <option value="business_environment">Business Environment</option>
              </Select>
            </div>
          ) : null}

          <Divider />

          {/* Main nav: no Restart/Exit here — menu handles it */}
          <ButtonRow>
            <Button onClick={() => engine.prev()} disabled={!engine.attempt || engine.attempt.currentIndex <= 0}>
              Previous
            </Button>

            <Button onClick={onPrimary} disabled={primaryDisabled}>
              {primaryLabel}
            </Button>

            {/* Exam strict: allow submit anytime */}
            {mode === "exam" ? (
              <Button onClick={() => engine.submitAttempt()} disabled={!engine.attempt}>
                Submit Exam
              </Button>
            ) : null}
          </ButtonRow>

          {/* Learn more appears only after submitting current answer in practice */}
          {mode === "practice" && currentId && submittedQ[currentId] ? (
            <ButtonRow>
              <Button
                onClick={() => {
                  setShowExplain((prev) => ({ ...prev, [currentId]: !prev[currentId] }));
                }}
              >
                {showExplain[currentId] ? "Hide" : "Learn more"}
              </Button>
            </ButtonRow>
          ) : null}

          {result ? (
            <>
              <SectionTitle>Results</SectionTitle>
              <Stat>
                <StatBox>
                  <StatLabel>Total</StatLabel>
                  <StatValue>{result.totalScore} / {result.maxScore}</StatValue>
                </StatBox>
                <StatBox>
                  <StatLabel>Incorrect</StatLabel>
                  <StatValue>{result.incorrectQuestionIds.length}</StatValue>
                </StatBox>
              </Stat>
            </>
          ) : null}
        </Row>
      </Card>

      <RightCol>
        <Card>
          {current ? (
            <QuestionRenderer
              question={current}
              scenario={current.scenarioId ? scenarios.find((s) => s.id === current.scenarioId) : undefined}
              response={engine.getResponse(current.id)}
              optionOrder={engine.getOptionOrder(current.id)}
              onChange={(r) => engine.setResponse(current.id, r)}
              showCorrect={showCorrect}
            />
          ) : (
            <Subtle>Loading…</Subtle>
          )}
        </Card>

        {/* Explanation card (practice only, Learn more toggled) */}
        {mode === "practice" && current && currentId && showExplain[currentId] ? (
          <ExplanationCard>
            <ExplanationTitle>Explanation</ExplanationTitle>
            <ExplanationBody>
              {current.explanation?.trim()
                ? current.explanation
                : "No explanation has been provided for this question yet."}
            </ExplanationBody>
          </ExplanationCard>
        ) : null}
      </RightCol>
    </Grid>
  );
}
