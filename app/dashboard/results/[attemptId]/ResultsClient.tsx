"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUpgrade } from "@/lib/useUpgrade";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { AttemptResult, Domain } from "@/src/exam-engine/core/types";
import { loadBankBySlug, loadQuestions } from "@/src/exam-engine/data/loadFromSupabase";
import { TOPICS_BY_DOMAIN, buildTopicIndex } from "@/src/exam-engine/core/topicLabels";

/* ── types ──────────────────────────────────────────────────────────────── */

type AttemptFullRow = {
  id: string;
  bank_slug: string;
  mode: "practice" | "exam";
  set_id: string | null;
  status: string;
  total_score: number | null;
  max_score: number | null;
  score_percent: number | null;
  passed: boolean | null;
  result: AttemptResult | null;
  state: any;
  created_at: string;
  submitted_at: string | null;
};

/* ── constants ──────────────────────────────────────────────────────────── */

const DOMAIN_LABELS: Record<string, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Environment",
};


/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const growWidth = keyframes`
  from { width: 0%; }
`;

/* ── styled components ──────────────────────────────────────────────────── */

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

/* breadcrumb */
const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 24px;
  animation: ${fadeUp} 400ms ease both;
`;

const BreadcrumbLink = styled(Link)`
  color: ${(p) => p.theme.muted};
  text-decoration: none;
  font-weight: 600;
  transition: color 150ms ease;
  &:hover { color: ${(p) => p.theme.text}; }
`;

const BreadcrumbSep = styled.span`opacity: 0.4;`;

/* hero card */
const HeroCard = styled.div<{ $pass: boolean }>`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.$pass ? p.theme.successBorder : p.theme.errorBorder};
  border-radius: 24px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: ${(p) => p.theme.shadow};
  margin-bottom: 20px;
  animation: ${fadeUp} 400ms 60ms ease both;

  @media (max-width: 480px) {
    padding: 24px 16px;
  }
`;

const HeroLabel = styled.div<{ $pass: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-bottom: 16px;
  background: ${(p) => p.$pass ? p.theme.successSoft : p.theme.errorSoft};
  color: ${(p) => p.$pass ? p.theme.success : p.theme.error};
`;

const HeroScore = styled.div`
  font-size: 56px;
  font-weight: 900;
  letter-spacing: -2px;
  color: ${(p) => p.theme.text};
  line-height: 1.1;

  @media (max-width: 480px) {
    font-size: 44px;
  }
`;

const HeroSubtext = styled.div`
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  margin-top: 8px;
  line-height: 1.5;
`;

const HeroMeta = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-top: 12px;
  opacity: 0.7;
`;

/* stat grid */
const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  animation: ${fadeUp} 400ms 120ms ease both;
`;

const StatCard = styled.div<{ $variant?: "success" | "error" }>`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) =>
    p.$variant === "success"
      ? p.theme.successBorder
      : p.$variant === "error"
        ? p.theme.errorBorder
        : p.theme.cardBorder};
  border-radius: 18px;
  padding: 16px;
  text-align: center;
`;

const StatValue = styled.div<{ $variant?: "success" | "error" }>`
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${(p) =>
    p.$variant === "success"
      ? p.theme.success
      : p.$variant === "error"
        ? p.theme.error
        : p.theme.text};
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(p) => p.theme.muted};
  margin-top: 4px;
`;

/* section card */
const SectionCard = styled.div<{ $delay?: number }>`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 20px;
  box-shadow: ${(p) => p.theme.shadow};
  margin-bottom: 16px;
  animation: ${fadeUp} 400ms ${(p) => p.$delay ?? 160}ms ease both;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin: 0 0 14px;
  letter-spacing: -0.2px;
`;

const SectionToggleBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: none;
  color: ${(p) => p.theme.text};
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  padding: 4px 0;
  letter-spacing: -0.2px;
  transition: opacity 150ms ease;

  &:hover { opacity: 0.7; }
`;

const SectionArrow = styled.span<{ $open: boolean }>`
  display: inline-block;
  font-size: 12px;
  transition: transform 200ms ease;
  transform: ${(p) => (p.$open ? "rotate(180deg)" : "rotate(0)")};
`;

/* domain / type rows */
const BreakdownGrid = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const BreakdownItem = styled.div`
  display: grid;
  gap: 4px;
`;

const BreakdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BreakdownName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
`;

const BreakdownValues = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BreakdownScore = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
  font-variant-numeric: tabular-nums;
`;

const BreakdownPct = styled.span<{ $pass: boolean }>`
  font-size: 13px;
  font-weight: 800;
  color: ${(p) => p.$pass ? p.theme.success : p.theme.error};
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: right;
`;

const BarTrack = styled.div`
  height: 6px;
  background: ${(p) => p.theme.divider};
  border-radius: 999px;
  overflow: hidden;
`;

const BarFill = styled.div<{ $pct: number; $pass: boolean }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  border-radius: 999px;
  background: ${(p) => p.$pass ? p.theme.success : p.theme.error};
  animation: ${growWidth} 800ms ease both;
`;

/* question list */
const QList = styled.div`
  display: grid;
  gap: 6px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
  margin-top: 12px;
`;

const QRow = styled.div<{ $correct: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${(p) =>
    p.$correct
      ? p.theme.successSoft
      : p.theme.errorSoft};
  border: 1px solid ${(p) =>
    p.$correct
      ? p.theme.successBorder
      : p.theme.errorBorder};
  font-size: 13px;
`;

const QIcon = styled.span<{ $correct: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
  background: ${(p) => p.$correct ? p.theme.success : p.theme.error};
  color: white;
`;

const QNumber = styled.span`
  font-weight: 700;
  color: ${(p) => p.theme.text};
  min-width: 24px;
`;

const QDomain = styled.span`
  color: ${(p) => p.theme.muted};
  font-size: 12px;
  flex: 1;
  text-align: right;
`;

/* time stats */
const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const TimeStat = styled.div`
  text-align: center;
  padding: 12px 8px;
  border-radius: 14px;
  background: ${(p) =>
    p.theme.name === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc"};
  border: 1px solid ${(p) => p.theme.cardBorder};
`;

const TimeValue = styled.div`
  font-size: 20px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.3px;
`;

const TimeLabel = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
  margin-top: 2px;
`;

/* footer actions */
const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
  animation: ${fadeUp} 400ms 200ms ease both;
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 150ms ease;
  &:hover { opacity: 0.85; }
`;

const PrimaryAction = styled(ActionLink)`
  background: ${(p) => p.theme.accent};
  color: white;
`;

const SecondaryAction = styled(ActionLink)`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  color: ${(p) => p.theme.text};
`;

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
`;

/* ── pro upsell ────────────────────────────────────────────────────────── */

const UpsellBanner = styled.div`
  background: linear-gradient(135deg, ${(p) => p.theme.accentSoft}, ${(p) => p.theme.warningSoft});
  border: 1px solid ${(p) => p.theme.accentSoft};
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: ${fadeUp} 400ms 120ms ease both;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

const UpsellText = styled.div`
  flex: 1;
`;

const UpsellTitle = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
`;

const UpsellSub = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
`;

const UpsellBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #7c3aed);
  color: white;
  white-space: nowrap;
  transition: opacity 150ms ease;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const ProGateWrap = styled.div`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
`;

const ProGateBlur = styled.div`
  filter: blur(5px);
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
`;

const ProGateOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  gap: 8px;
`;

const ProGateBadge = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${(p) => p.theme.warning};
  background: ${(p) => p.theme.warningSoft};
  border: 1px solid ${(p) => p.theme.warningBorder};
  padding: 4px 12px;
  border-radius: 8px;
`;

const ProGateLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
`;

/* ── helpers ─────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function setLabel(setId: string | null) {
  if (!setId) return "";
  return " — " + setId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMs(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  return `${mins}m ${remaining}s`;
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function ResultsClient({ attemptId }: { attemptId: string }) {
  const { user, loading: authLoading, isPro } = useAuth();
  const { startCheckout, loading: checkoutLoading } = useUpgrade();
  const sb = useMemo(() => supabaseBrowser(), []);
  const [attempt, setAttempt] = useState<AttemptFullRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDomains, setShowDomains] = useState(true);
  const [showTopics, setShowTopics] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questionMeta, setQuestionMeta] = useState<Map<string, { domain: Domain; tags: string[] }>>(
    new Map()
  );

  useEffect(() => {
    if (authLoading || !user) return;

    (async () => {
      try {
        const { data, error: fetchError } = await sb
          .from("attempts")
          .select(
            "id, bank_slug, mode, set_id, status, total_score, max_score, score_percent, passed, result, state, created_at, submitted_at"
          )
          .eq("id", attemptId)
          .eq("user_id", user.id)
          .single();

        if (fetchError || !data) {
          setError("Attempt not found.");
          return;
        }

        setAttempt(data as AttemptFullRow);
      } catch (err) {
        console.error("[Results] Failed to load attempt:", err);
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, sb, attemptId]);

  // Load the attempt's question bank once so we can resolve questionId → tags
  // for the per-topic breakdown.
  useEffect(() => {
    if (!attempt?.bank_slug) return;
    let cancelled = false;
    (async () => {
      try {
        const bank = await loadBankBySlug(attempt.bank_slug);
        const qs = await loadQuestions(bank.id);
        if (cancelled) return;
        const m = new Map<string, { domain: Domain; tags: string[] }>();
        for (const q of qs) m.set(q.id, { domain: q.domain, tags: q.tags ?? [] });
        setQuestionMeta(m);
      } catch (err) {
        console.error("[Results] Failed to load question bank for topic analytics:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt?.bank_slug]);

  // Per-topic breakdown for this single attempt. Mirrors the dashboard logic:
  // map each scoreResult's questionId → tags → topic bucket(s), with an
  // "Other" fallback per domain for tags that don't map to any bucket.
  const topicEntries = useMemo(() => {
    const sr = attempt?.result?.scoreResults;
    if (!sr || sr.length === 0 || questionMeta.size === 0) return [];

    const topicIndex = buildTopicIndex();
    const buckets: Record<
      string,
      { domain: Domain; label: string; correct: number; total: number }
    > = {};

    for (const s of sr) {
      const meta = questionMeta.get(s.questionId);
      if (!meta) continue;
      const idx = topicIndex[meta.domain];
      const matched = new Set<string>();
      if (idx) {
        for (const rawTag of meta.tags) {
          const hit = idx.get(rawTag.toLowerCase());
          if (!hit) continue;
          for (const topicId of hit) matched.add(topicId);
        }
      }
      if (matched.size === 0) matched.add("__other__");

      for (const topicId of matched) {
        const label =
          topicId === "__other__"
            ? `Other — ${DOMAIN_LABELS[meta.domain] ?? meta.domain}`
            : TOPICS_BY_DOMAIN[meta.domain].find((t) => t.id === topicId)?.label ?? topicId;
        const key = `${meta.domain}:${topicId}`;
        const b = (buckets[key] ||= { domain: meta.domain, label, correct: 0, total: 0 });
        b.total += 1;
        if (s.isCorrect) b.correct += 1;
      }
    }

    const domOrder: Record<string, number> = { people: 0, process: 1, business_environment: 2 };
    return Object.entries(buckets)
      .map(([key, b]) => ({
        key,
        label: b.label,
        domain: b.domain,
        domainLabel: DOMAIN_LABELS[b.domain] ?? b.domain,
        isOther: key.endsWith(":__other__"),
        correct: b.correct,
        total: b.total,
        pct: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
      }))
      .sort((a, b) => {
        // Keep "Other" rows at the bottom of their domain group.
        const dd = (domOrder[a.domain] ?? 9) - (domOrder[b.domain] ?? 9);
        if (dd !== 0) return dd;
        if (a.isOther !== b.isOther) return a.isOther ? 1 : -1;
        return b.total - a.total;
      });
  }, [attempt, questionMeta]);

  if (authLoading || loading) return <P>Loading results...</P>;
  if (error) return <P>{error}</P>;
  if (!attempt) return <P>Attempt not found.</P>;

  const result = attempt.result;
  const hasScoring = result !== null && attempt.total_score !== null;
  const passed = attempt.passed ?? false;
  const scorePercent = attempt.score_percent ?? 0;
  const modeLabel = attempt.mode === "exam" ? "Exam Simulation" : "Practice Session";

  // Use QUESTION counts (not raw points) for the stats
  const questionCount = attempt.state?.questionOrder?.length ?? 0;
  const correctCount = result
    ? result.scoreResults.filter((sr: any) => sr.isCorrect).length
    : 0;
  const incorrectCount = result
    ? result.scoreResults.filter((sr: any) => !sr.isCorrect).length
    : 0;
  const totalPoints = result ? result.totalScore : (attempt.total_score ?? 0);
  const maxPoints = result ? result.maxScore : (attempt.max_score ?? 0);

  // Time stats from state
  const timeSpent: Record<string, number> = attempt.state?.timeSpentMsByQuestionId ?? {};
  const totalTimeMs = Object.values(timeSpent).reduce((a: number, b: number) => a + b, 0);
  const avgTimeMs = questionCount > 0 ? totalTimeMs / questionCount : 0;
  const maxTimeMs = Object.values(timeSpent).length
    ? Math.max(...Object.values(timeSpent).map(Number))
    : 0;

  // Pass threshold from blueprint
  const passThreshold = attempt.state?.blueprint?.passThreshold ?? 70;

  return (
    <Wrap>
      <Breadcrumb>
        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <span>Results</span>
      </Breadcrumb>

      {/* ── Hero ────────────────────────────────────────────── */}
      <HeroCard $pass={passed}>
        <HeroLabel $pass={passed}>
          {passed ? "Passed" : "Not Passed"}
        </HeroLabel>
        <HeroScore>{scorePercent}%</HeroScore>
        <HeroSubtext>
          {modeLabel}{setLabel(attempt.set_id)}
          {passed
            ? ` — Congratulations! You passed with ${scorePercent}%.`
            : ` — You need ${passThreshold}% to pass. Keep studying!`}
        </HeroSubtext>
        {attempt.submitted_at && (
          <HeroMeta>{formatDate(attempt.submitted_at)}</HeroMeta>
        )}
      </HeroCard>

      {/* ── Pro upsell for free users ────────────────────────── */}
      {!isPro && attempt.mode === "exam" && (
        <UpsellBanner>
          <UpsellText>
            <UpsellTitle>
              {passed ? "Pass with even more confidence" : "Improve your score with Pro"}
            </UpsellTitle>
            <UpsellSub>
              {passed
                ? "Unlock 2 more full exam simulations, adaptive difficulty, and topic-level insights to solidify your preparation."
                : "Unlock adaptive difficulty that targets your weak areas, 2 additional exam sets, and personalized study recommendations."}
            </UpsellSub>
          </UpsellText>
          <UpsellBtn onClick={startCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? "Redirecting…" : "Upgrade to Study Mode — $29"}
          </UpsellBtn>
        </UpsellBanner>
      )}

      {/* ── No scoring notice ──────────────────────────────── */}
      {!hasScoring && (
        <SectionCard $delay={100}>
          <SectionTitle>Scoring Unavailable</SectionTitle>
          <P>
            This attempt was saved before scoring was enabled. Retake the exam to see a full score breakdown.
          </P>
        </SectionCard>
      )}

      {/* ── Score Stats ─────────────────────────────────────── */}
      {hasScoring && <StatGrid>
        <StatCard $variant="success">
          <StatValue $variant="success">{correctCount}</StatValue>
          <StatLabel>Correct</StatLabel>
        </StatCard>
        <StatCard $variant="error">
          <StatValue $variant="error">{incorrectCount}</StatValue>
          <StatLabel>Incorrect</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalPoints}/{maxPoints}</StatValue>
          <StatLabel>Total Points</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{questionCount}</StatValue>
          <StatLabel>Questions</StatLabel>
        </StatCard>
      </StatGrid>}

      {/* ── Domain Breakdown ────────────────────────────────── */}
      {result && (
        <SectionCard $delay={160}>
          <SectionToggleBtn onClick={() => setShowDomains((v) => !v)}>
            Performance by Domain
            <SectionArrow $open={showDomains}>▼</SectionArrow>
          </SectionToggleBtn>
          {showDomains && (
            <BreakdownGrid>
              {(Object.entries(result.byDomain) as [string, { correct: number; total: number }][])
                .filter(([, d]) => d.total > 0)
                .map(([domain, d]) => {
                  const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                  const pass = pct >= passThreshold;
                  return (
                    <BreakdownItem key={domain}>
                      <BreakdownHeader>
                        <BreakdownName>{DOMAIN_LABELS[domain] ?? domain}</BreakdownName>
                        <BreakdownValues>
                          <BreakdownScore>{d.correct}/{d.total}</BreakdownScore>
                          <BreakdownPct $pass={pass}>{pct}%</BreakdownPct>
                        </BreakdownValues>
                      </BreakdownHeader>
                      <BarTrack>
                        <BarFill $pct={pct} $pass={pass} />
                      </BarTrack>
                    </BreakdownItem>
                  );
                })}
            </BreakdownGrid>
          )}
        </SectionCard>
      )}

      {/* ── Topic Breakdown (replaces Question Type) ────────── */}
      {result && (
        isPro ? (
          <SectionCard $delay={220}>
            <SectionToggleBtn onClick={() => setShowTopics((v) => !v)}>
              Performance by Topic
              <SectionArrow $open={showTopics}>▼</SectionArrow>
            </SectionToggleBtn>
            {showTopics && (
              <BreakdownGrid>
                {questionMeta.size === 0 ? (
                  <BreakdownItem>
                    <BreakdownHeader>
                      <BreakdownName>Loading topic data…</BreakdownName>
                    </BreakdownHeader>
                  </BreakdownItem>
                ) : topicEntries.length === 0 ? (
                  <BreakdownItem>
                    <BreakdownHeader>
                      <BreakdownName>No topic data available for this attempt.</BreakdownName>
                    </BreakdownHeader>
                  </BreakdownItem>
                ) : (
                  topicEntries.map((t) => {
                    if (t.isOther) {
                      return (
                        <BreakdownItem key={t.key}>
                          <BreakdownHeader>
                            <BreakdownName>
                              Practice more of the {t.domainLabel} domain
                            </BreakdownName>
                          </BreakdownHeader>
                        </BreakdownItem>
                      );
                    }
                    const pass = t.pct >= passThreshold;
                    return (
                      <BreakdownItem key={t.key}>
                        <BreakdownHeader>
                          <BreakdownName>{t.label}</BreakdownName>
                          <BreakdownValues>
                            <BreakdownScore>{t.correct}/{t.total}</BreakdownScore>
                            <BreakdownPct $pass={pass}>{t.pct}%</BreakdownPct>
                          </BreakdownValues>
                        </BreakdownHeader>
                        <BarTrack>
                          <BarFill $pct={t.pct} $pass={pass} />
                        </BarTrack>
                      </BreakdownItem>
                    );
                  })
                )}
              </BreakdownGrid>
            )}
          </SectionCard>
        ) : (
          <ProGateWrap>
            <ProGateOverlay>
              <ProGateBadge>STUDY MODE</ProGateBadge>
              <ProGateLabel>Unlock per-topic breakdown</ProGateLabel>
              <UpsellBtn onClick={startCheckout} style={{ marginTop: 4 }}>Upgrade</UpsellBtn>
            </ProGateOverlay>
            <ProGateBlur>
              <SectionCard $delay={220}>
                <SectionTitle>Performance by Topic</SectionTitle>
                <BreakdownGrid>
                  {topicEntries.slice(0, 6).map((t) => (
                    <BreakdownItem key={t.key}>
                      <BreakdownHeader>
                        <BreakdownName>{t.label}</BreakdownName>
                      </BreakdownHeader>
                      <BarTrack><BarFill $pct={t.pct} $pass={false} /></BarTrack>
                    </BreakdownItem>
                  ))}
                </BreakdownGrid>
              </SectionCard>
            </ProGateBlur>
          </ProGateWrap>
        )
      )}

      {/* ── Time Analysis ───────────────────────────────────── */}
      {totalTimeMs > 0 && (
        <SectionCard $delay={280}>
          <SectionToggleBtn onClick={() => setShowTime((v) => !v)}>
            Time Analysis
            <SectionArrow $open={showTime}>▼</SectionArrow>
          </SectionToggleBtn>
          {showTime && (
            <TimeGrid>
              <TimeStat>
                <TimeValue>{formatMs(totalTimeMs)}</TimeValue>
                <TimeLabel>Total Time</TimeLabel>
              </TimeStat>
              <TimeStat>
                <TimeValue>{formatMs(avgTimeMs)}</TimeValue>
                <TimeLabel>Avg / Question</TimeLabel>
              </TimeStat>
              <TimeStat>
                <TimeValue>{formatMs(maxTimeMs)}</TimeValue>
                <TimeLabel>Longest Question</TimeLabel>
              </TimeStat>
            </TimeGrid>
          )}
        </SectionCard>
      )}

      {/* ── Question-by-Question ────────────────────────────── */}
      {result && result.scoreResults.length > 0 && (
        <SectionCard $delay={340}>
          <SectionToggleBtn onClick={() => setShowQuestions((v) => !v)}>
            Question Breakdown ({correctCount} of {result.scoreResults.length} correct)
            <SectionArrow $open={showQuestions}>▼</SectionArrow>
          </SectionToggleBtn>
          {showQuestions && (
            <QList>
              {result.scoreResults.map((sr, idx) => {
                const domain = attempt.state?.questionOrder
                  ? (() => {
                      // Try to find domain from the state
                      return "";
                    })()
                  : "";
                return (
                  <QRow key={sr.questionId} $correct={sr.isCorrect}>
                    <QIcon $correct={sr.isCorrect}>
                      {sr.isCorrect ? "\u2713" : "\u2717"}
                    </QIcon>
                    <QNumber>Q{idx + 1}</QNumber>
                    <QDomain>
                      {sr.score}/{sr.maxScore} pts
                      {timeSpent[sr.questionId]
                        ? ` \u00B7 ${formatMs(timeSpent[sr.questionId])}`
                        : ""}
                    </QDomain>
                  </QRow>
                );
              })}
            </QList>
          )}
        </SectionCard>
      )}

      {/* ── Actions ─────────────────────────────────────────── */}
      <ActionRow>
        <PrimaryAction href={`/bank/${attempt.bank_slug}`}>
          Retake Exam
        </PrimaryAction>
        <SecondaryAction href="/dashboard">
          Back to Dashboard
        </SecondaryAction>
      </ActionRow>
    </Wrap>
  );
}
