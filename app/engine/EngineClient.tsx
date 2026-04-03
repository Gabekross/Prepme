"use client";
import React, { useEffect, useMemo } from "react";
import styled from "styled-components";
import { useExamSession } from "@/src/exam-engine/hooks/useExamSession";
import { seedBank } from "@/src/exam-engine/data/seed.bank";
import { seedScenarios } from "@/src/exam-engine/data/seed.scenarios";
import { QuestionRenderer } from "@/src/exam-engine/ui/QuestionRenderer";
import { scoreAttempt } from "@/src/exam-engine/core/scoring";
import type { Domain } from "@/src/exam-engine/core/types";
import { Button, Subtle } from "@/src/exam-engine/components/shared";

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;

  @media (min-width: 980px) {
    grid-template-columns: 340px 1fr;
    align-items: start;
  }
`;

const Card = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 14px;
  box-shadow: ${(p) => p.theme.shadow};
`;

const Title = styled.h1`
  font-size: 18px;
  margin: 0 0 8px 0;
  color: ${(p) => p.theme.text};
`;

const Row = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Select = styled.select`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 10px 36px 10px 12px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
`;

const Stat = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const StatBox = styled.div`
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
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
  font-weight: 900;
  color: ${(p) => p.theme.text};
`;

const Bullets = styled.ul`
  margin: 6px 0 0;
  padding-left: 18px;
  font-size: 13px;
  opacity: 0.85;
`;

export default function EngineClient() {
  const engine = useExamSession();
  const scenarios = useMemo(() => seedScenarios, []);

  // useEffect(() => {
  //   engine.initIfNeeded({
  //     bank: seedBank,
  //     defaultBlueprint: { total: 30, domains: { people: 10, process: 15, business_environment: 5 } },
  //     mode: "practice",
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
  (async () => {
    try {
      const { loadBankBySlug, loadQuestions, loadScenarios } = await import("@/src/exam-engine/data/loadFromSupabase");

      const bank = await loadBankBySlug("pmp"); // you’ll create this bank row
      const [qs, scns] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);

      engine.initIfNeeded({
        bank: qs,
        defaultBlueprint: { total: 30, domains: { people: 10, process: 15, business_environment: 5 } },
        mode: "practice",
      });

      // If you store scenarios in state, set them here; otherwise keep seedScenarios approach.
      // For now, you can replace seedScenarios with scns in local component state if desired.
    } catch (e) {
      // fallback to seed if supabase not ready
      engine.initIfNeeded({
        bank: seedBank,
        defaultBlueprint: { total: 30, domains: { people: 10, process: 15, business_environment: 5 } },
        mode: "practice",
      });
      console.error(e);
    }
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const current = useMemo(() => {
  if (!engine.attempt || !engine.questions || engine.questions.length === 0) return null;

  const order = engine.attempt.questionOrder;
  const startIdx = engine.attempt.currentIndex;

  // Find the nearest question in the current filtered list
  for (let i = startIdx; i < order.length; i++) {
    const q = engine.questions.find((x) => x.id === order[i]);
    if (q) return q;
  }
  for (let i = startIdx - 1; i >= 0; i--) {
    const q = engine.questions.find((x) => x.id === order[i]);
    if (q) return q;
  }

  return engine.questions[0];
}, [engine.attempt, engine.questions]);

const canPrev = !!engine.attempt && engine.attempt.currentIndex > 0;
const canNext =
  !!engine.attempt && engine.attempt.currentIndex < engine.attempt.questionOrder.length - 1;





  const result = useMemo(() => {
    if (!engine.attempt || !engine.bank) return null;
    if (!engine.attempt.submittedAt) return null;
    const qs = engine.bank.filter((q) => engine.attempt!.questionOrder.includes(q.id));
    return scoreAttempt(engine.attempt, qs);
  }, [engine.attempt, engine.bank]);

  const domain = engine.filters.domain as Domain | "all";

  

  return (
    <Grid>
      <Card>
        <Title>Controls</Title>
        <Subtle>
          Demo engine showing all PMP-style formats + production behaviors (deterministic shuffle, resume, flag, analytics).
        </Subtle>

        <Row>
          <div>
            <Subtle>Filter by domain</Subtle>
            <Select value={domain} onChange={(e) => engine.setDomainFilter(e.target.value as any)}>
              <option value="all">All domains</option>
              <option value="people">People</option>
              <option value="process">Process</option>
              <option value="business_environment">Business Environment</option>
            </Select>
          </div>

          <ButtonRow>
            <Button onClick={() => engine.startNewAttempt({ reshuffleQuestions: true })}>Reshuffle questions</Button>
            <Button onClick={() => engine.startNewAttempt({ reshuffleQuestions: false })}>Restart attempt</Button>
            <Button onClick={() => engine.retryIncorrectOnly()}>Retry incorrect only</Button>
            <Button onClick={() => engine.toggleFlagCurrent()}>{engine.isCurrentFlagged() ? "Unflag" : "Flag"} question</Button>
          </ButtonRow>

          <ButtonRow>
            <Button onClick={() => engine.prev()} disabled={!canPrev}>Previous</Button>
            <Button onClick={() => engine.next()} disabled={!canNext}>Next</Button>
            <Button onClick={() => engine.submitAttempt()} disabled={!engine.attempt}>Submit</Button>
          </ButtonRow>

          {result ? (
            <>
              <Title>Results</Title>
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

              <Subtle>Domain breakdown</Subtle>
              <Bullets>
                <li>People: {result.byDomain.people.score}/{result.byDomain.people.maxScore}</li>
                <li>Process: {result.byDomain.process.score}/{result.byDomain.process.maxScore}</li>
                <li>Business Env: {result.byDomain.business_environment.score}/{result.byDomain.business_environment.maxScore}</li>
              </Bullets>
            </>
          ) : null}
        </Row>
      </Card>

      <Card>
        {current ? (
          <QuestionRenderer
            question={current}
            scenario={current.scenarioId ? scenarios.find((s) => s.id === current.scenarioId) : undefined}
            response={engine.getResponse(current.id)}
            optionOrder={engine.getOptionOrder(current.id)}
            onChange={(r) => engine.setResponse(current.id, r)}
            showCorrect={!!engine.attempt?.submittedAt}
          />
        ) : (
          <Subtle>Loading…</Subtle>
        )}
      </Card>
    </Grid>
  );
}
