"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { Question, Scenario, SetId } from "@/src/exam-engine/core/types";
import type { BankConfig } from "@/src/exam-engine/data/loadFromSupabase";
import { EngineRunner } from "@/src/exam-engine/ui/EngineRunner";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";
import { balanceSimulationBlueprint } from "@/src/exam-engine/core/simulationBalance";
import { useAuth } from "@/lib/auth/AuthProvider";
import { pmpBank } from "@/src/exam-engine/data/seed.pmp";
import { setABank } from "@/src/exam-engine/data/seed.set-a";
import { setBBank } from "@/src/exam-engine/data/seed.set-b";
import { setCBank } from "@/src/exam-engine/data/seed.set-c";

/** Map of URL-friendly setId slugs → internal SetId values */
const SET_MAP: Record<string, SetId> = {
  "set-a": "set_a",
  "set-b": "set_b",
  "set-c": "set_c",
  set_a: "set_a",
  set_b: "set_b",
  set_c: "set_c",
};

/** Seed-data fallbacks keyed by SetId */
const SEED_FALLBACKS: Partial<Record<SetId, Question[]>> = {
  set_a: setABank,
  set_b: setBBank,
  set_c: setCBank,
};

/** Default bank config used when Supabase is unavailable */
const FALLBACK_BANK_CONFIG: BankConfig = {
  id: "local-fallback",
  slug: "pmp",
  durationMinutes: 230,
  passThreshold: 61,
};

/* ── styled ─────────────────────────────────────────────────────────────── */

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.45;
`;

/* ── component ──────────────────────────────────────────────────────────── */

interface ExamClientProps {
  bankSlug: string;
  /** Optional set identifier from the URL, e.g. "set-a". When omitted the exam
   *  draws from ALL questions in the bank (legacy behaviour / random exam). */
  setId?: string;
}

export default function ExamClient({ bankSlug, setId: rawSetId }: ExamClientProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [msg, setMsg] = useState("Loading exam\u2026");
  const [loadError, setLoadError] = useState(false);

  const resolvedSetId: SetId | undefined = rawSetId ? SET_MAP[rawSetId] : undefined;
  const setLabel = resolvedSetId?.replace("_", " ").toUpperCase() ?? "Random";

  const namespaceKey = resolvedSetId
    ? `${bankSlug}__exam__${resolvedSetId}`
    : `${bankSlug}__exam`;

  useEffect(() => {
    let cancelled = false;

    // Safety timeout — if data loading takes > 20s, fall back to seed data
    const timeout = setTimeout(() => {
      if (cancelled) return;
      if (!questions && !loadError) {
        console.warn("[ExamClient] Data load timed out, falling back to seed data");
        setBankConfig(FALLBACK_BANK_CONFIG);
        setQuestions(
          resolvedSetId && SEED_FALLBACKS[resolvedSetId]
            ? SEED_FALLBACKS[resolvedSetId]!
            : pmpBank
        );
        setScenarios([]);
        setMsg("");
      }
    }, 20_000);

    (async () => {
      try {
        const bank = await loadBankBySlug(bankSlug);
        if (cancelled) return;
        setBankConfig(bank);
        const [qs, scns] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);
        if (cancelled) return;

        let finalQs: Question[];
        if (resolvedSetId) {
          const setQs = qs.filter((q) => (q.setId ?? "free") === resolvedSetId);
          const seedQs = SEED_FALLBACKS[resolvedSetId];
          if (setQs.length >= 180) {
            finalQs = qs;
          } else if (seedQs) {
            const seedIds = new Set(seedQs.map((q) => q.id));
            finalQs = [...seedQs, ...qs.filter((q) => !seedIds.has(q.id))];
          } else {
            finalQs = qs.length ? qs : pmpBank;
          }
        } else {
          finalQs = qs.length ? qs : pmpBank;
        }

        setQuestions(finalQs);
        setScenarios(scns);
        setMsg("");
      } catch (e: any) {
        if (cancelled) return;
        console.error("[ExamClient] Data load failed, using seed fallback:", e?.message);
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

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [bankSlug, resolvedSetId]);

  if (!questions || !bankConfig) return <P>{msg}</P>;

  return (
    <EngineRunner
      key={namespaceKey}
      title={`Exam Simulation \u2022 ${setLabel}`}
      subtitle={
        resolvedSetId
          ? `${setLabel} simulation. Submit to see your results.`
          : "Simulation mode. Submit to see your results."
      }
      questions={questions}
      scenarios={scenarios}
      blueprint={balanceSimulationBlueprint({
        total: 180,
        domains: { people: 76, process: 90, business_environment: 14 },
        ...(resolvedSetId ? { setId: resolvedSetId } : {}),
      })}
      mode="exam"
      allowDomainFilter={false}
      storageNamespace={namespaceKey}
      durationMinutes={bankConfig.durationMinutes ?? undefined}
      passThreshold={bankConfig.passThreshold}
      userId={user?.id}
      bankSlug={bankSlug}
      setId={resolvedSetId}
    />
  );
}
