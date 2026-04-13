"use client";

import React, { useEffect, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import type { Question, Scenario, SetId } from "@/src/exam-engine/core/types";
import type { BankConfig } from "@/src/exam-engine/data/loadFromSupabase";
import { EngineRunner } from "@/src/exam-engine/ui/EngineRunner";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";
import { balanceSimulationBlueprint } from "@/src/exam-engine/core/simulationBalance";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { LocalAttemptStorage } from "@/src/exam-engine/core/storage";
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

/** Seed-data fallbacks keyed by SetId (expand as sets B & C are generated) */
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

const ResumeWrap = styled.div`
  max-width: 520px;
  margin: 0 auto;
  animation: ${fadeUp} 400ms ease both;
`;

const ResumeCard = styled.div`
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

const ResumeIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #f59e0b);
  display: grid;
  place-items: center;
  font-size: 26px;
  margin: 0 auto 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const ResumeTitle = styled.h1`
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.4px;
  color: ${(p) => p.theme.text};
`;

const ResumeSubtitle = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: ${(p) => p.theme.cardBorder};
  margin: 16px 0 8px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  border-radius: 4px;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #f59e0b);
  transition: width 400ms ease;
`;

const ProgressText = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
`;

const MetaText = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 4px;
`;

const MetaTextLast = styled(MetaText)`
  margin-bottom: 20px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ResumeBtn = styled.button`
  flex: 1;
  padding: 14px 20px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #f59e0b);
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const FreshBtn = styled.button`
  flex: 1;
  padding: 14px 20px;
  border-radius: 14px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg};
  color: ${(p) => p.theme.text};
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;

  &:hover {
    border-color: ${(p) => p.theme.error};
    color: ${(p) => p.theme.error};
    background: ${(p) => p.theme.errorSoft};
    transform: translateY(-1px);
  }
`;

/* ── types ─────────────────────────────────────────────────────────────── */

interface InProgressAttempt {
  id: string;
  created_at: string;
  updated_at: string;
  state: {
    questionOrder: string[];
    responsesByQuestionId: Record<string, unknown>;
    currentIndex: number;
  };
}

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

  // Resume-flow state
  const [inProgressAttempt, setInProgressAttempt] = useState<InProgressAttempt | null>(null);
  const [resumeCheckDone, setResumeCheckDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [clearing, setClearing] = useState(false);

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

        // When a specific set is requested, check if Supabase actually has
        // enough questions for that set. If not, merge in (or use) the local
        // seed data so the exam is always playable.
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

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [bankSlug, resolvedSetId]);

  // Check for in-progress exam attempt once data is loaded
  useEffect(() => {
    if (!questions || !bankConfig || !user?.id) {
      setResumeCheckDone(true);
      return;
    }

    let cancelled = false;

    // Timeout: don't let resume check hang forever
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("[ExamClient] Resume check timed out");
        setResumeCheckDone(true);
      }
    }, 10_000);

    (async () => {
      try {
        const sb = supabaseBrowser();
        let query = sb
          .from("attempts")
          .select("id, state, created_at, updated_at")
          .eq("user_id", user.id)
          .eq("bank_slug", bankSlug)
          .eq("mode", "exam")
          .eq("status", "in_progress");

        if (resolvedSetId) {
          query = query.eq("set_id", resolvedSetId);
        }

        const { data } = await query
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled && data?.state?.questionOrder) {
          setInProgressAttempt(data as InProgressAttempt);
        }
      } catch (err) {
        console.warn("[ExamClient] Resume check failed:", err);
      } finally {
        if (!cancelled) setResumeCheckDone(true);
        clearTimeout(timeout);
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [questions, bankConfig, user?.id, bankSlug, resolvedSetId]);

  const handleStartFresh = useCallback(async () => {
    if (!inProgressAttempt) return;
    setClearing(true);
    try {
      const sb = supabaseBrowser();
      await sb.from("attempts").update({ status: "abandoned" }).eq("id", inProgressAttempt.id);
      new LocalAttemptStorage(namespaceKey).clearLatest();
    } catch {
      // Best-effort clear
    }
    setInProgressAttempt(null);
    setClearing(false);
  }, [inProgressAttempt, namespaceKey]);

  const handleResume = useCallback(() => {
    setStarted(true);
  }, []);

  if (!questions || !bankConfig) return <P>{msg}</P>;

  // Show resume card if there's an in-progress attempt
  if (!started && resumeCheckDone && inProgressAttempt) {
    const { state, created_at, updated_at } = inProgressAttempt;
    const totalQ = state.questionOrder.length;
    const answered = Object.keys(state.responsesByQuestionId).length;
    const pct = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;

    const lastActive = new Date(updated_at);
    const formattedDate = lastActive.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = lastActive.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    // Compute time remaining if timed
    let timeRemainingLabel: string | null = null;
    const durationMinutes = bankConfig.durationMinutes;
    if (durationMinutes) {
      const startedAt = new Date(created_at).getTime();
      const deadline = startedAt + durationMinutes * 60 * 1000;
      const remainMs = deadline - Date.now();
      if (remainMs > 0) {
        const remainMin = Math.floor(remainMs / 60000);
        const remainHrs = Math.floor(remainMin / 60);
        const leftoverMin = remainMin % 60;
        timeRemainingLabel = remainHrs > 0
          ? `${remainHrs}h ${leftoverMin}m remaining`
          : `${remainMin}m remaining`;
      } else {
        timeRemainingLabel = "Time expired";
      }
    }

    return (
      <ResumeWrap>
        <ResumeCard>
          <ResumeIcon>&#9654;</ResumeIcon>
          <ResumeTitle>Resume Exam?</ResumeTitle>
          <ResumeSubtitle>
            You have an unfinished exam simulation{resolvedSetId ? ` (${setLabel})` : ""}.
          </ResumeSubtitle>

          <ProgressText>
            {answered} of {totalQ} questions answered
          </ProgressText>
          <ProgressBar>
            <ProgressFill $pct={pct} />
          </ProgressBar>
          {timeRemainingLabel && (
            <MetaText>
              {timeRemainingLabel}
            </MetaText>
          )}
          <MetaTextLast>
            Last active: {formattedDate} at {formattedTime}
          </MetaTextLast>

          <ButtonRow>
            <ResumeBtn onClick={handleResume}>
              Resume Exam
            </ResumeBtn>
            <FreshBtn onClick={handleStartFresh} disabled={clearing}>
              {clearing ? "Clearing\u2026" : "Start Fresh"}
            </FreshBtn>
          </ButtonRow>
        </ResumeCard>
      </ResumeWrap>
    );
  }

  // Wait for resume check before rendering engine
  if (!resumeCheckDone) return <P>Loading exam…</P>;

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
