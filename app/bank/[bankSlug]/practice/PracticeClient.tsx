"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { Question, Scenario } from "@/src/exam-engine/core/types";
import { EngineRunner } from "@/src/exam-engine/ui/EngineRunner";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";
import { useAuth } from "@/lib/auth/AuthProvider";
import { pmpBank } from "@/src/exam-engine/data/seed.pmp";
import { setABank } from "@/src/exam-engine/data/seed.set-a";

/** Combined local seed pool — practice mode draws from ALL available questions
 *  regardless of setId, giving the student maximum variety. */
const combinedSeedBank: Question[] = [...pmpBank, ...setABank];

const QUESTION_PRESETS = [10, 20, 25, 30, 50, 90];

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── styled ─────────────────────────────────────────────────────────────── */

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.45;
`;

const SetupWrap = styled.div`
  max-width: 520px;
  margin: 0 auto;
  animation: ${fadeUp} 400ms ease both;
`;

const SetupCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 28px 24px;
  box-shadow: ${(p) => p.theme.shadow};
  text-align: center;

  @media (max-width: 480px) {
    padding: 24px 16px;
  }
`;

const SetupIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, ${(p) => p.theme.success}, #06b6d4);
  display: grid;
  place-items: center;
  font-size: 26px;
  margin: 0 auto 16px;
  box-shadow: 0 4px 16px ${(p) => p.theme.successSoft ?? "rgba(0,0,0,0.1)"};
`;

const SetupTitle = styled.h1`
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.4px;
  color: ${(p) => p.theme.text};
`;

const SetupSubtitle = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
  margin-bottom: 10px;
`;

const PresetsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
`;

const PresetBtn = styled.button<{ $active: boolean }>`
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid ${(p) =>
    p.$active ? p.theme.success : p.theme.cardBorder};
  background: ${(p) =>
    p.$active ? p.theme.successSoft : p.theme.buttonBg};
  color: ${(p) =>
    p.$active ? p.theme.success : p.theme.text};
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 150ms ease;
  min-width: 54px;

  &:hover {
    border-color: ${(p) => p.theme.success};
    background: ${(p) => p.theme.successSoft};
    color: ${(p) => p.theme.success};
  }
`;

const CustomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
`;

const CustomLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
`;

const CustomInput = styled.input`
  width: 70px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  outline: none;
  transition: border-color 150ms ease;

  &:focus {
    border-color: ${(p) => p.theme.success};
    box-shadow: 0 0 0 3px ${(p) => p.theme.successSoft};
  }
`;

const StartBtn = styled.button`
  width: 100%;
  padding: 14px 20px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, ${(p) => p.theme.success}, #06b6d4);
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PoolInfo = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-top: 12px;
`;

/* ── component ──────────────────────────────────────────────────────────── */

export default function PracticeClient({ bankSlug }: { bankSlug: string }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [msg, setMsg] = useState("Loading questions…");
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const bank = await loadBankBySlug(bankSlug);
        const [qs, scns] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);
        setQuestions(qs.length ? qs : combinedSeedBank);
        setScenarios(scns);
        setMsg("");
      } catch (e: any) {
        setQuestions(combinedSeedBank);
        setScenarios([]);
        setMsg("");
      }
    })();
  }, [bankSlug]);

  if (!questions) return <P>{msg}</P>;

  const maxQuestions = questions.length;
  const clampedCount = Math.max(1, Math.min(questionCount, maxQuestions));

  // Build blueprint with proportional domain distribution
  const domainRatio = { people: 0.42, process: 0.50, business_environment: 0.08 };
  const blueprint = {
    total: clampedCount,
    domains: {
      people: Math.round(clampedCount * domainRatio.people),
      process: Math.round(clampedCount * domainRatio.process),
      business_environment: Math.max(1, clampedCount - Math.round(clampedCount * domainRatio.people) - Math.round(clampedCount * domainRatio.process)),
    },
  };

  if (!started) {
    return (
      <SetupWrap>
        <SetupCard>
          <SetupIcon>P</SetupIcon>
          <SetupTitle>Practice Session</SetupTitle>
          <SetupSubtitle>
            Choose how many questions you want to practice.
            Questions are randomly selected from the full question pool.
          </SetupSubtitle>

          <Label>Number of Questions</Label>
          <PresetsRow>
            {QUESTION_PRESETS.filter((n) => n <= maxQuestions).map((n) => (
              <PresetBtn
                key={n}
                $active={questionCount === n}
                onClick={() => setQuestionCount(n)}
              >
                {n}
              </PresetBtn>
            ))}
          </PresetsRow>

          <CustomRow>
            <CustomLabel>Or enter custom:</CustomLabel>
            <CustomInput
              type="number"
              min={1}
              max={maxQuestions}
              value={questionCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setQuestionCount(v);
              }}
            />
          </CustomRow>

          <StartBtn
            onClick={() => setStarted(true)}
            disabled={clampedCount < 1}
          >
            Start Practice ({clampedCount} questions) →
          </StartBtn>

          <PoolInfo>
            {maxQuestions} questions available in the pool
          </PoolInfo>
        </SetupCard>
      </SetupWrap>
    );
  }

  return (
    <EngineRunner
      key={`${bankSlug}__practice__${clampedCount}`}
      title={`Practice • ${bankSlug}`}
      subtitle={`${clampedCount} questions with immediate feedback.`}
      questions={questions}
      scenarios={scenarios}
      blueprint={blueprint}
      mode="practice"
      allowDomainFilter
      storageNamespace={`${bankSlug}__practice`}
      userId={user?.id}
      bankSlug={bankSlug}
    />
  );
}
