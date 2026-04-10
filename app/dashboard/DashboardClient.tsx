"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/browser";

/* ── types ──────────────────────────────────────────────────────────────── */

type AttemptSummary = {
  id: string;
  bank_slug: string;
  mode: "practice" | "exam";
  set_id: string | null;
  status: "in_progress" | "submitted" | "abandoned";
  total_score: number | null;
  max_score: number | null;
  score_percent: number | null;
  passed: boolean | null;
  created_at: string;
  submitted_at: string | null;
};

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── styled components ──────────────────────────────────────────────────── */

const Wrap = styled.div`
  max-width: 780px;
  margin: 0 auto;
  animation: ${fadeUp} 400ms ease both;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const H1 = styled.h1`
  margin: 0 0 6px;
  font-size: clamp(22px, 5vw, 30px);
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${(p) => p.theme.text};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.5;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-bottom: 32px;
  animation: ${fadeUp} 400ms 80ms ease both;
`;

const StatCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(p) => p.theme.muted};
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin: 0 0 14px;
  letter-spacing: -0.2px;
`;

const AttemptList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: ${fadeUp} 400ms 140ms ease both;
`;

const AttemptCard = styled(Link)`
  text-decoration: none;
  color: inherit;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: ${(p) => p.theme.shadow};
  transition: border-color 150ms ease, transform 150ms ease;
  cursor: pointer;

  &:hover {
    border-color: ${(p) => p.theme.accent}60;
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
  }
`;

const AttemptInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AttemptTitle = styled.div`
  font-weight: 700;
  font-size: 14px;
  color: ${(p) => p.theme.text};
  margin-bottom: 3px;
`;

const AttemptMeta = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
`;

const ScoreBadge = styled.div<{ $passed: boolean | null }>`
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: ${(p) =>
    p.$passed === null
      ? p.theme.cardBorder
      : p.$passed
        ? p.theme.successSoft
        : p.theme.errorSoft};
  color: ${(p) =>
    p.$passed === null
      ? p.theme.muted
      : p.$passed
        ? p.theme.success
        : p.theme.error};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.6;
`;

const StartLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 22px;
  border-radius: 12px;
  background: ${(p) => p.theme.accent};
  color: white;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  transition: opacity 150ms ease;

  &:hover {
    opacity: 0.9;
  }
`;

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
`;

/* ── helpers ─────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function setLabel(setId: string | null) {
  if (!setId) return "";
  return setId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function DashboardClient() {
  const { user, loading: authLoading } = useAuth();
  const sb = useMemo(() => supabaseBrowser(), []);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    (async () => {
      const { data } = await sb
        .from("attempts")
        .select(
          "id, bank_slug, mode, set_id, status, total_score, max_score, score_percent, passed, created_at, submitted_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setAttempts((data as AttemptSummary[]) ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, sb]);

  if (authLoading || loading) return <P>Loading dashboard...</P>;
  if (!user) return <P>Please sign in to view your dashboard.</P>;

  const submitted = attempts.filter((a) => a.status === "submitted");
  const examAttempts = submitted.filter((a) => a.mode === "exam");
  const practiceAttempts = submitted.filter((a) => a.mode === "practice");
  const passedExams = examAttempts.filter((a) => a.passed);
  const avgScore =
    examAttempts.length > 0
      ? Math.round(
          examAttempts.reduce((sum, a) => sum + (a.score_percent ?? 0), 0) /
            examAttempts.length
        )
      : null;

  return (
    <Wrap>
      <Header>
        <H1>Dashboard</H1>
        <Subtitle>
          Track your progress and review past exam attempts.
        </Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{examAttempts.length}</StatValue>
          <StatLabel>Exams Taken</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{practiceAttempts.length}</StatValue>
          <StatLabel>Practice Sessions</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{avgScore !== null ? `${avgScore}%` : "—"}</StatValue>
          <StatLabel>Avg Exam Score</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{passedExams.length}</StatValue>
          <StatLabel>Exams Passed</StatLabel>
        </StatCard>
      </StatsGrid>

      {submitted.length === 0 ? (
        <EmptyState>
          <div>No completed attempts yet.</div>
          <div>Start a practice session or exam simulation to track your progress here.</div>
          <StartLink href="/bank/pmp">Go to PMP Exam</StartLink>
        </EmptyState>
      ) : (
        <>
          <SectionTitle>Recent Attempts</SectionTitle>
          <AttemptList>
            {submitted.map((a) => (
              <AttemptCard key={a.id} href={`/dashboard/results/${a.id}`}>
                <AttemptInfo>
                  <AttemptTitle>
                    {a.mode === "exam" ? "Exam Simulation" : "Practice Session"}
                    {a.set_id ? ` — ${setLabel(a.set_id)}` : ""}
                  </AttemptTitle>
                  <AttemptMeta>
                    {formatDate(a.submitted_at ?? a.created_at)}
                    {a.score_percent !== null && ` · Score: ${a.score_percent}%`}
                  </AttemptMeta>
                </AttemptInfo>
                <ScoreBadge $passed={a.passed}>
                  {a.score_percent !== null
                    ? `${a.score_percent}%`
                    : a.status === "in_progress"
                      ? "In Progress"
                      : "—"}
                </ScoreBadge>
              </AttemptCard>
            ))}
          </AttemptList>
        </>
      )}
    </Wrap>
  );
}
