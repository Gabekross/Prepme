"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { Question, Scenario, SetId } from "@/src/exam-engine/core/types";
import type { BankConfig } from "@/src/exam-engine/data/loadFromSupabase";
import { EngineRunner } from "@/src/exam-engine/ui/EngineRunner";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";
import { pmpBank } from "@/src/exam-engine/data/seed.pmp";
import { setABank } from "@/src/exam-engine/data/seed.set-a";

/** Map of URL-friendly setId slugs → internal SetId values */
const SET_MAP: Record<string, SetId> = {
  "set-a": "set_a",
  "set-b": "set_b",
  "set-c": "set_c",
  set_a: "set_a",
  set_b: "set_b",
  set_c: "set_c",
};

/** Seed-data fallbacks keyed by SetId (expand as sets B & C are generated) */
const SEED_FALLBACKS: Partial<Record<SetId, Question[]>> = {
  set_a: setABank,
  // set_b: setBBank,   ← import and add once generated
  // set_c: setCBank,   ← import and add once generated
};

/** Default bank config used when Supabase is unavailable */
const FALLBACK_BANK_CONFIG: BankConfig = {
  id: "local-fallback",
  slug: "pmp",
  durationMinutes: 230,
  passThreshold: 61,
};

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.45;
`;

interface ExamClientProps {
  bankSlug: string;
  /** Optional set identifier from the URL, e.g. "set-a". When omitted the exam
   *  draws from ALL questions in the bank (legacy behaviour / random exam). */
  setId?: string;
}

export default function ExamClient({ bankSlug, setId: rawSetId }: ExamClientProps) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [msg, setMsg] = useState("Loading exam…");

  const resolvedSetId: SetId | undefined = rawSetId ? SET_MAP[rawSetId] : undefined;
  const setLabel = resolvedSetId?.replace("_", " ").toUpperCase() ?? "Random";

  useEffect(() => {
    (async () => {
      try {
        const bank = await loadBankBySlug(bankSlug);
        setBankConfig(bank);
        const [qs, scns] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);

        // When a specific set is requested, check if Supabase actually has
        // enough questions for that set. If not, merge in (or use) the local
        // seed data so the exam is always playable.
        let finalQs: Question[];
        if (resolvedSetId) {
          const setQs = qs.filter((q) => (q.setId ?? "free") === resolvedSetId);
          const seedQs = SEED_FALLBACKS[resolvedSetId];
          if (setQs.length >= 180) {
            // Supabase has enough set questions — use full bank (blueprint will filter)
            finalQs = qs;
          } else if (seedQs) {
            // Not enough in Supabase — use seed data for this set, plus any
            // Supabase questions that aren't already in the seed (deduplicate)
            const seedIds = new Set(seedQs.map((q) => q.id));
            finalQs = [...seedQs, ...qs.filter((q) => !seedIds.has(q.id))];
          } else {
            // No seed data for this set yet — use whatever Supabase returned
            finalQs = qs.length ? qs : pmpBank;
          }
        } else {
          // No set filter — legacy "random draw" from full bank
          finalQs = qs.length ? qs : pmpBank;
        }

        setQuestions(finalQs);
        setScenarios(scns);
        setMsg("");
      } catch (e: any) {
        // Supabase unavailable — use seed data so the app stays usable
        setBankConfig(FALLBACK_BANK_CONFIG);
        setQuestions(
          resolvedSetId && SEED_FALLBACKS[resolvedSetId]
            ? SEED_FALLBACKS[resolvedSetId]!
            : pmpBank
        );
        setScenarios([]);
        setMsg("");
      }
    })();
  }, [bankSlug, resolvedSetId]);

  if (!questions || !bankConfig) return <P>{msg}</P>;

  const namespaceKey = resolvedSetId
    ? `${bankSlug}__exam__${resolvedSetId}`
    : `${bankSlug}__exam`;

  return (
    <EngineRunner
      key={namespaceKey}
      title={`Exam Simulation • ${setLabel}`}
      subtitle={
        resolvedSetId
          ? `${setLabel} simulation. Submit to see your results.`
          : "Simulation mode. Submit to see your results."
      }
      questions={questions}
      scenarios={scenarios}
      blueprint={{
        total: 180,
        domains: { people: 76, process: 90, business_environment: 14 },
        ...(resolvedSetId ? { setId: resolvedSetId } : {}),
      }}
      mode="exam"
      allowDomainFilter={false}
      storageNamespace={namespaceKey}
      durationMinutes={bankConfig.durationMinutes ?? undefined}
      passThreshold={bankConfig.passThreshold}
    />
  );
}
