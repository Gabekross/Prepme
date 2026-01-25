"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { Question, Scenario } from "@/src/exam-engine/core/types";
import { EngineRunner } from "@/src/exam-engine/ui/EngineRunner";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";

const P = styled.p`
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
  font-size: 14px;
  line-height: 1.45;
`;

export default function ExamClient({ bankSlug }: { bankSlug: string }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [msg, setMsg] = useState("Loading exam…");

  useEffect(() => {
    (async () => {
      try {
        const bank = await loadBankBySlug(bankSlug);
        const [qs, scns] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);
        setQuestions(qs);
        setScenarios(scns);
        setMsg(qs.length ? "" : "No questions found for this bank (or none are free + published).");
      } catch (e: any) {
        setMsg(e?.message ?? "Failed to load bank.");
      }
    })();
  }, [bankSlug]);

  if (!questions) return <P>{msg}</P>;
  if (msg) return <P>{msg}</P>;

  return (
<EngineRunner
  key={`${bankSlug}__exam`}                     // ✅ forces a clean remount
  title={`Exam Simulation • ${bankSlug}`}
  subtitle="Simulation mode. Submit to see your results."
  questions={questions}
  scenarios={scenarios}
  blueprint={{ total: 60 }}
  mode="exam"
  allowDomainFilter={false}
  storageNamespace={`${bankSlug}__exam`}         // ✅ isolates attempts
/>

  );
}
