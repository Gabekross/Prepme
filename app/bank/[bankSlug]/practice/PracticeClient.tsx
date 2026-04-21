"use client";

import React, { useEffect, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { useSearchParams } from "next/navigation";
import type { Question, Scenario } from "@/src/exam-engine/core/types";
import { EngineRunner } from "@/src/exam-engine/ui/EngineRunner";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUpgrade } from "@/lib/useUpgrade";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { LocalAttemptStorage } from "@/src/exam-engine/core/storage";
import { pmpBank } from "@/src/exam-engine/data/seed.pmp";
import { setABank } from "@/src/exam-engine/data/seed.set-a";

/** Combined local seed pool — practice mode draws from ALL available questions
 *  regardless of setId, giving the student maximum variety. */
const combinedSeedBank: Question[] = [...pmpBank, ...setABank];

const FREE_PRESETS = [10, 20, 25, 30];
const PRO_PRESETS = [50, 90];
const QUESTION_PRESETS = [...FREE_PRESETS, ...PRO_PRESETS];

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

const LockedPresetBtn = styled.button`
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.muted};
  font-weight: 800;
  cursor: pointer;
  transition: all 150ms ease;
  min-width: 54px;
  opacity: 0.6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &:hover { opacity: 1; border-color: ${(p) => p.theme.warningBorder}; }
`;

const LockNum = styled.span`
  font-size: 15px;
  line-height: 1.2;
`;

const LockIcon = styled.span`
  font-size: 10px;
  line-height: 1;
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

/* ── upgrade modal ─────────────────────────────────────────────────────── */

const UpgradeOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9000;
  display: grid; place-items: center;
  padding: 20px;
  animation: ${fadeUp} 200ms ease both;
`;

const UpgradeCard = styled.div`
  background: ${(p) =>
    p.theme.name === "dark" ? "#111827" : p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: ${(p) => p.theme.shadowLg ?? p.theme.shadow};
  text-align: center;
`;

const UpgradeTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
`;

const UpgradeText = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  line-height: 1.6;
`;

const UpgradeFeature = styled.div`
  text-align: left;
  margin-bottom: 20px;
  display: grid;
  gap: 8px;
`;

const UpgradeFeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: ${(p) => p.theme.text};
  font-weight: 600;
`;

const UpgradeCheckmark = styled.span`
  width: 20px; height: 20px;
  border-radius: 50%;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  display: grid; place-items: center;
  font-size: 11px; flex-shrink: 0;
`;

const UpgradePrice = styled.div`
  font-size: 32px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
`;

const UpgradePriceNote = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 20px;
`;

const UpgradeBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #7c3aed);
  color: white;
  padding: 13px 20px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;
  margin-bottom: 10px;

  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

const UpgradeCloseBtn = styled.button`
  background: none; border: none;
  color: ${(p) => p.theme.muted};
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  padding: 8px 16px;

  &:hover { color: ${(p) => p.theme.text}; }
`;

/* ── resume card styled ────────────────────────────────────────────────── */

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
  updated_at: string;
  state: {
    questionOrder: string[];
    responsesByQuestionId: Record<string, unknown>;
    currentIndex: number;
  };
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function PracticeClient({ bankSlug }: { bankSlug: string }) {
  const { user, isPro } = useAuth();
  const { startCheckout, loading: checkoutLoading } = useUpgrade();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [msg, setMsg] = useState("Loading questions\u2026");

  // Read ?count from URL (set by PracticeIntroClient); fall back to 20
  const countParam = searchParams.get("count");
  const initialCount = countParam ? Math.max(1, parseInt(countParam, 10)) : 20;
  const [questionCount, setQuestionCount] = useState<number>(initialCount);

  // If a count was passed via URL, skip the setup screen
  const [started, setStarted] = useState<boolean>(!!countParam);

  // Resume-flow state
  const [inProgressAttempt, setInProgressAttempt] = useState<InProgressAttempt | null>(null);
  const [resumeCheckDone, setResumeCheckDone] = useState(false);
  const [clearing, setClearing] = useState(false);

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

  // Check for in-progress attempt once questions are loaded and user is known
  useEffect(() => {
    if (!questions || !user?.id) {
      setResumeCheckDone(true);
      return;
    }

    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data } = await sb
          .from("attempts")
          .select("id, state, created_at, updated_at")
          .eq("user_id", user.id)
          .eq("bank_slug", bankSlug)
          .eq("mode", "practice")
          .eq("status", "in_progress")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.state?.questionOrder) {
          setInProgressAttempt(data as InProgressAttempt);
        }
      } catch {
        // Silently ignore — proceed to setup
      } finally {
        setResumeCheckDone(true);
      }
    })();
  }, [questions, user?.id, bankSlug]);

  const handleStartFresh = useCallback(async () => {
    if (!inProgressAttempt) return;
    setClearing(true);
    try {
      const sb = supabaseBrowser();
      await sb.from("attempts").update({ status: "abandoned" }).eq("id", inProgressAttempt.id);
      new LocalAttemptStorage(`${bankSlug}__practice`).clearLatest();
    } catch {
      // Best-effort clear
    }
    setInProgressAttempt(null);
    setClearing(false);
  }, [inProgressAttempt, bankSlug]);

  const handleResume = useCallback(() => {
    setStarted(true);
  }, []);

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

  // Show resume card if there is an in-progress attempt and we haven't started yet
  if (!started && resumeCheckDone && inProgressAttempt) {
    const { state, updated_at } = inProgressAttempt;
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

    return (
      <SetupWrap>
        <SetupCard>
          <ResumeIcon>&#9654;</ResumeIcon>
          <SetupTitle>Resume Session?</SetupTitle>
          <SetupSubtitle>
            You have an unfinished practice session.
          </SetupSubtitle>

          <ProgressText>
            {answered} of {totalQ} questions answered
          </ProgressText>
          <ProgressBar>
            <ProgressFill $pct={pct} />
          </ProgressBar>
          <MetaText>
            Last active: {formattedDate} at {formattedTime}
          </MetaText>

          <ButtonRow>
            <ResumeBtn onClick={handleResume}>
              Resume Session
            </ResumeBtn>
            <FreshBtn onClick={handleStartFresh} disabled={clearing}>
              {clearing ? "Clearing\u2026" : "Start Fresh"}
            </FreshBtn>
          </ButtonRow>
        </SetupCard>
      </SetupWrap>
    );
  }

  if (!started) {
    // Wait for resume check before showing setup
    if (!resumeCheckDone) return <P>Loading questions\u2026</P>;

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
            {QUESTION_PRESETS.filter((n) => n <= maxQuestions).map((n) => {
              const isProPreset = PRO_PRESETS.includes(n);
              if (isProPreset && !isPro) {
                return (
                  <LockedPresetBtn
                    key={n}
                    onClick={() => setShowUpgrade(true)}
                    title="Study Mode feature"
                  >
                    <LockNum>{n}</LockNum>
                    <LockIcon>🔒</LockIcon>
                  </LockedPresetBtn>
                );
              }
              return (
                <PresetBtn
                  key={n}
                  $active={questionCount === n}
                  onClick={() => setQuestionCount(n)}
                >
                  {n}
                </PresetBtn>
              );
            })}
          </PresetsRow>

          <StartBtn
            onClick={() => setStarted(true)}
            disabled={clampedCount < 1}
          >
            Start Practice ({clampedCount} questions) →
          </StartBtn>

          {/* <PoolInfo>
            {maxQuestions} questions available in the pool
          </PoolInfo> */}
        </SetupCard>

        {showUpgrade && (
          <UpgradeOverlay onClick={() => setShowUpgrade(false)}>
            <UpgradeCard onClick={(e) => e.stopPropagation()}>
              <UpgradeTitle>Upgrade to Study Mode</UpgradeTitle>
              <UpgradeText>
                Unlock the full exam preparation experience and maximize your chances of passing the PMP on your first attempt.
              </UpgradeText>
              <UpgradeFeature>
                <UpgradeFeatureItem>
                  <UpgradeCheckmark>✓</UpgradeCheckmark>
                  All 3 exam simulations (210 exam questions)
                </UpgradeFeatureItem>
                <UpgradeFeatureItem>
                  <UpgradeCheckmark>✓</UpgradeCheckmark>
                  Extended practice sessions (50 & 90 questions)
                </UpgradeFeatureItem>
                <UpgradeFeatureItem>
                  <UpgradeCheckmark>✓</UpgradeCheckmark>
                  Adaptive difficulty engine
                </UpgradeFeatureItem>
                <UpgradeFeatureItem>
                  <UpgradeCheckmark>✓</UpgradeCheckmark>
                  Weakness targeting per domain & topic
                </UpgradeFeatureItem>
                <UpgradeFeatureItem>
                  <UpgradeCheckmark>✓</UpgradeCheckmark>
                  Personalized study recommendations
                </UpgradeFeatureItem>
              </UpgradeFeature>
              <UpgradePrice>$29</UpgradePrice>
              <UpgradePriceNote>One-time payment · Lifetime access</UpgradePriceNote>
              <UpgradeBtn onClick={startCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? "Redirecting…" : "Upgrade Now"}
              </UpgradeBtn>
              <UpgradeCloseBtn onClick={() => setShowUpgrade(false)}>
                Maybe later
              </UpgradeCloseBtn>
            </UpgradeCard>
          </UpgradeOverlay>
        )}
      </SetupWrap>
    );
  }

  return (
    <EngineRunner
      key={`${bankSlug}__practice__${clampedCount}`}
      title={`Practice \u2022 ${bankSlug}`}
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
