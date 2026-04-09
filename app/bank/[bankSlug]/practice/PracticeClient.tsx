"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { Question, Scenario } from "@/src/exam-engine/core/types";
import { EngineRunner } from "@/src/exam-engine/ui/EngineRunner";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";
import { pmpBank } from "@/src/exam-engine/data/seed.pmp";
import { setABank } from "@/src/exam-engine/data/seed.set-a";

/** Combined local seed pool — practice mode draws from ALL available questions
 *  regardless of setId, giving the student maximum variety. */
const combinedSeedBank: Question[] = [...pmpBank, ...setABank];

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.45;
`;

export default function PracticeClient({ bankSlug }: { bankSlug: string }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [msg, setMsg] = useState("Loading questions…");

  useEffect(() => {
    (async () => {
      try {
        const bank = await loadBankBySlug(bankSlug);
        const [qs, scns] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);
        // Fall back to combined seed data when Supabase bank is empty (local dev / demo)
        setQuestions(qs.length ? qs : combinedSeedBank);
        setScenarios(scns);
        setMsg("");
      } catch (e: any) {
        // Supabase unavailable — use seed data so the app stays usable
        setQuestions(combinedSeedBank);
        setScenarios([]);
        setMsg("");
      }
    })();
  }, [bankSlug]);

  if (!questions) return <P>{msg}</P>;

  return (
    <EngineRunner
      key={`${bankSlug}__practice`}
      title={`Practice • ${bankSlug}`}
      subtitle="Work through questions with feedback after submission."
      questions={questions}
      scenarios={scenarios}
      blueprint={{
        total: 20,
        domains: { people: 8, process: 10, business_environment: 2 },
      }}
      mode="practice"
      allowDomainFilter
      storageNamespace={`${bankSlug}__practice`}
    />
  );
}
