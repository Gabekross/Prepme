"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { requireAdminClient } from "@/src/admin/requireAdmin";

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── layout ─────────────────────────────────────────────────────────────── */

const Page = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 20px 64px;
  animation: ${fadeUp} 400ms ease both;
`;

const Header = styled.div`
  margin-bottom: 36px;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin: 0 0 6px;
  letter-spacing: -0.4px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  margin: 0;
`;

/* ── section ─────────────────────────────────────────────────────────────── */

const SectionTitle = styled.h2`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${(p) => p.theme.muted};
  margin: 0 0 14px;
`;

/* ── stat cards ─────────────────────────────────────────────────────────── */

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 40px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const StatCard = styled.div<{ $accent?: string }>`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 20px 18px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: ${(p) => p.$accent ? `${p.$accent}08` : "transparent"};
    pointer-events: none;
  }
`;

const StatValue = styled.div<{ $accent?: string }>`
  font-size: 36px;
  font-weight: 900;
  color: ${(p) => p.$accent ?? p.theme.accent};
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 6px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${(p) => p.theme.muted};
`;

const StatSub = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-top: 4px;
`;

/* ── nav links ──────────────────────────────────────────────────────────── */

const NavGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const NavCard = styled(Link)`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 14px;
  padding: 18px 20px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: border-color 160ms, transform 160ms;

  &:hover {
    border-color: ${(p) => p.theme.accent}80;
    transform: translateY(-2px);
  }
`;

const NavIcon = styled.div`
  font-size: 22px;
  flex-shrink: 0;
`;

const NavLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
`;

const NavDesc = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-top: 2px;
`;

/* ── error ──────────────────────────────────────────────────────────────── */

const ErrorMsg = styled.div`
  color: ${(p) => p.theme.error ?? "#ef4444"};
  font-size: 14px;
  padding: 16px;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 12px;
`;

/* ── component ──────────────────────────────────────────────────────────── */

type Stats = { totalAttempts: number; totalPractice: number; totalExams: number };

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await requireAdminClient();
      if (!result.ok) {
        const msgs: Record<string, string> = {
          not_signed_in: "You must be signed in to view this page.",
          not_admin: "You do not have admin access.",
          role_check_failed: "Could not verify admin role.",
        };
        setError(msgs[result.reason] ?? "Access denied.");
        return;
      }

      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data: Stats = await res.json();
        setStats(data);
      } catch {
        setError("Could not load session stats.");
      }
    })();
  }, []);

  if (error) {
    return (
      <Page>
        <ErrorMsg>{error}</ErrorMsg>
      </Page>
    );
  }

  const fmt = (n: number | undefined) =>
    n != null ? n.toLocaleString() : "—";

  const practicePct =
    stats && stats.totalAttempts > 0
      ? Math.round((stats.totalPractice / stats.totalAttempts) * 100)
      : null;

  const examPct =
    stats && stats.totalAttempts > 0
      ? Math.round((stats.totalExams / stats.totalAttempts) * 100)
      : null;

  return (
    <Page>
      <Header>
        <Title>Admin Dashboard</Title>
        <Subtitle>Platform overview and quick links.</Subtitle>
      </Header>

      {/* ── Session Stats ──────────────────────────────────────────── */}
      <SectionTitle>Sessions Completed</SectionTitle>
      <StatsGrid>
        <StatCard $accent="#6366f1">
          <StatValue $accent="#6366f1">
            {stats ? fmt(stats.totalAttempts) : "…"}
          </StatValue>
          <StatLabel>Total Sessions</StatLabel>
          <StatSub>Practice + Exam</StatSub>
        </StatCard>

        <StatCard $accent="#22c55e">
          <StatValue $accent="#22c55e">
            {stats ? fmt(stats.totalPractice) : "…"}
          </StatValue>
          <StatLabel>Practice Sessions</StatLabel>
          {practicePct != null && <StatSub>{practicePct}% of total</StatSub>}
        </StatCard>

        <StatCard $accent="#3b82f6">
          <StatValue $accent="#3b82f6">
            {stats ? fmt(stats.totalExams) : "…"}
          </StatValue>
          <StatLabel>Exam Sessions</StatLabel>
          {examPct != null && <StatSub>{examPct}% of total</StatSub>}
        </StatCard>
      </StatsGrid>

      {/* ── Quick Links ────────────────────────────────────────────── */}
      <SectionTitle>Quick Links</SectionTitle>
      <NavGrid>
        <NavCard href="/admin/questions">
          <NavIcon>📝</NavIcon>
          <div>
            <NavLabel>Questions</NavLabel>
            <NavDesc>Browse and edit question bank</NavDesc>
          </div>
        </NavCard>
      </NavGrid>
    </Page>
  );
}
