"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { requireAdminServer } from "@/src/admin/requireAdmin";
import { supabaseBrowser } from "@/lib/supabase/browser";

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

/* ── layout ─────────────────────────────────────────────────────────────── */

const Page = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 64px;
  animation: ${fadeUp} 400ms ease both;
`;

const Header = styled.div`
  margin-bottom: 36px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const HeaderLeft = styled.div``;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin: 0 0 4px;
  letter-spacing: -0.4px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  margin: 0;
`;

const RefreshBtn = styled.button`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
  cursor: pointer;
  transition: border-color 160ms, color 160ms;

  &:hover {
    border-color: ${(p) => p.theme.accent}80;
    color: ${(p) => p.theme.text};
  }
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

const Section = styled.div`
  margin-bottom: 40px;
`;

/* ── stat cards ─────────────────────────────────────────────────────────── */

const StatsGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols ?? 4}, 1fr);
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
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
    background: ${(p) =>
      p.$accent ? `${p.$accent}08` : "transparent"};
    pointer-events: none;
  }
`;

const StatValue = styled.div<{ $accent?: string; $small?: boolean }>`
  font-size: ${(p) => (p.$small ? "28px" : "36px")};
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

/* ── loading skeleton ──────────────────────────────────────────────────── */

const SkeletonCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 20px 18px;
  min-height: 90px;
`;

const SkeletonLine = styled.div<{ $w?: string }>`
  height: 14px;
  width: ${(p) => p.$w ?? "60%"};
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    ${(p) => p.theme.cardBorder} 25%,
    ${(p) => p.theme.cardBg} 50%,
    ${(p) => p.theme.cardBorder} 75%
  );
  background-size: 800px 14px;
  animation: ${shimmer} 1.5s infinite linear;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

/* ── chart (pure CSS bar chart) ─────────────────────────────────────────── */

const ChartWrap = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 20px 18px 14px;
`;

const ChartTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  margin-bottom: 16px;
`;

const ChartBars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 100px;
`;

const Bar = styled.div<{ $h: number; $accent: string }>`
  flex: 1;
  min-width: 4px;
  height: ${(p) => Math.max(p.$h, 2)}%;
  background: ${(p) => p.$accent};
  border-radius: 3px 3px 0 0;
  transition: height 400ms ease;
  position: relative;

  &:hover {
    opacity: 0.8;
  }
`;

const ChartLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
`;

const ChartLabel = styled.span`
  font-size: 10px;
  color: ${(p) => p.theme.muted};
`;

/* ── table ──────────────────────────────────────────────────────────────── */

const Table = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  overflow: hidden;
`;

const TableRow = styled.div<{ $header?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 12px 18px;
  font-size: 13px;
  font-weight: ${(p) => (p.$header ? 700 : 400)};
  color: ${(p) => (p.$header ? p.theme.muted : p.theme.text)};
  text-transform: ${(p) => (p.$header ? "uppercase" : "none")};
  letter-spacing: ${(p) => (p.$header ? "0.06em" : "0")};
  border-bottom: 1px solid ${(p) => p.theme.cardBorder};

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.div<{ $accent?: string }>`
  color: ${(p) => p.$accent ?? "inherit"};
  font-weight: ${(p) => (p.$accent ? 700 : "inherit")};
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

/* ── badge ──────────────────────────────────────────────────────────────── */

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
`;

/* ── types ──────────────────────────────────────────────────────────────── */

type DashboardData = {
  users: {
    total: number;
    new7d: number;
    new30d: number;
    active7d: number;
    active30d: number;
  };
  revenue: {
    totalPro: number;
    conversionRate: number;
    inactiveProUsers: number;
    churnRiskPct: number;
  };
  engagement: {
    totalSubmitted: number;
    totalAbandoned: number;
    totalInProgress: number;
    practiceSubmitted: number;
    examSubmitted: number;
    completionRate: number;
    avgScore: number;
    passRate: number;
    avgSessionsPerUser: number;
  };
  trends: {
    dailyActivity: { date: string; sessions: number; uniqueUsers: number }[];
    recentPractice30d: number;
    recentExam30d: number;
  };
  setBreakdown: {
    setId: string;
    totalSessions: number;
    passRate: number;
    avgScore: number;
  }[];
};

/* ── helpers ─────────────────────────────────────────────────────────────── */

const fmt = (n: number | undefined) =>
  n != null ? n.toLocaleString() : "—";

const pct = (n: number | undefined) =>
  n != null ? `${n}%` : "—";

const setLabel = (id: string) => {
  const labels: Record<string, string> = {
    free: "Free Set",
    set_a: "Set A",
    set_b: "Set B",
    set_c: "Set C",
  };
  return labels[id] ?? id;
};

/* ── component ──────────────────────────────────────────────────────────── */

export default function AdminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    const result = await requireAdminServer();
    if (!result.ok) {
      const msgs: Record<string, string> = {
        not_signed_in: "You must be signed in to view this page.",
        not_admin: "You do not have admin access.",
        verification_failed: "Could not verify admin role.",
      };
      setError(msgs[result.reason] ?? "Access denied.");
      setLoading(false);
      return;
    }

    try {
      const sb = supabaseBrowser();
      const { data: sessionData } = await sb.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json: DashboardData = await res.json();
      setData(json);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (error) {
    return (
      <Page>
        <ErrorMsg>{error}</ErrorMsg>
      </Page>
    );
  }

  // Chart helpers
  const chartData = data?.trends.dailyActivity ?? [];
  const maxSessions = Math.max(...chartData.map((d) => d.sessions), 1);

  return (
    <Page>
      <Header>
        <HeaderLeft>
          <Title>Admin Dashboard</Title>
          <Subtitle>Business metrics and platform health.</Subtitle>
        </HeaderLeft>
        <RefreshBtn onClick={loadDashboard} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </RefreshBtn>
      </Header>

      {/* ── Users & Growth ──────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Users &amp; Growth</SectionTitle>
        {!data ? (
          <StatsGrid>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i}>
                <SkeletonLine $w="40%" />
                <SkeletonLine $w="70%" />
              </SkeletonCard>
            ))}
          </StatsGrid>
        ) : (
          <StatsGrid>
            <StatCard $accent="#6366f1">
              <StatValue $accent="#6366f1">{fmt(data.users.total)}</StatValue>
              <StatLabel>Total Users</StatLabel>
              <StatSub>All registered accounts</StatSub>
            </StatCard>

            <StatCard $accent="#22c55e">
              <StatValue $accent="#22c55e">{fmt(data.users.new7d)}</StatValue>
              <StatLabel>New (7 days)</StatLabel>
              <StatSub>{fmt(data.users.new30d)} in last 30d</StatSub>
            </StatCard>

            <StatCard $accent="#3b82f6">
              <StatValue $accent="#3b82f6">
                {fmt(data.users.active7d)}
              </StatValue>
              <StatLabel>Active (7 days)</StatLabel>
              <StatSub>{fmt(data.users.active30d)} in last 30d</StatSub>
            </StatCard>

            <StatCard $accent="#f59e0b">
              <StatValue $accent="#f59e0b" $small>
                {data.users.total > 0
                  ? Math.round(
                      (data.users.active7d / data.users.total) * 100
                    )
                  : 0}
                %
              </StatValue>
              <StatLabel>Engagement Rate</StatLabel>
              <StatSub>Active / Total (7d)</StatSub>
            </StatCard>
          </StatsGrid>
        )}
      </Section>

      {/* ── Revenue & Subscriptions ─────────────────────────────────── */}
      <Section>
        <SectionTitle>Revenue &amp; Subscriptions</SectionTitle>
        {!data ? (
          <StatsGrid>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i}>
                <SkeletonLine $w="40%" />
                <SkeletonLine $w="70%" />
              </SkeletonCard>
            ))}
          </StatsGrid>
        ) : (
          <StatsGrid>
            <StatCard $accent="#8b5cf6">
              <StatValue $accent="#8b5cf6">{fmt(data.revenue.totalPro)}</StatValue>
              <StatLabel>Pro Subscribers</StatLabel>
              <StatSub>Active paid accounts</StatSub>
            </StatCard>

            <StatCard $accent="#22c55e">
              <StatValue $accent="#22c55e" $small>
                {pct(data.revenue.conversionRate)}
              </StatValue>
              <StatLabel>Conversion Rate</StatLabel>
              <StatSub>Free to Pro</StatSub>
            </StatCard>

            <StatCard $accent="#ef4444">
              <StatValue $accent="#ef4444">
                {fmt(data.revenue.inactiveProUsers)}
              </StatValue>
              <StatLabel>Churn Risk</StatLabel>
              <StatSub>Pro users inactive 30d+</StatSub>
            </StatCard>

            <StatCard $accent="#f59e0b">
              <StatValue $accent="#f59e0b" $small>
                {pct(data.revenue.churnRiskPct)}
              </StatValue>
              <StatLabel>Churn Rate</StatLabel>
              <StatSub>Inactive / Total Pro</StatSub>
            </StatCard>
          </StatsGrid>
        )}
      </Section>

      {/* ── Engagement ──────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Engagement &amp; Usage</SectionTitle>
        {!data ? (
          <StatsGrid $cols={3}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i}>
                <SkeletonLine $w="40%" />
                <SkeletonLine $w="70%" />
              </SkeletonCard>
            ))}
          </StatsGrid>
        ) : (
          <>
            <StatsGrid>
              <StatCard $accent="#6366f1">
                <StatValue $accent="#6366f1">
                  {fmt(data.engagement.totalSubmitted)}
                </StatValue>
                <StatLabel>Completed Sessions</StatLabel>
                <StatSub>
                  {fmt(data.engagement.practiceSubmitted)} practice
                  {" / "}
                  {fmt(data.engagement.examSubmitted)} exam
                </StatSub>
              </StatCard>

              <StatCard $accent="#22c55e">
                <StatValue $accent="#22c55e" $small>
                  {pct(data.engagement.completionRate)}
                </StatValue>
                <StatLabel>Completion Rate</StatLabel>
                <StatSub>
                  {fmt(data.engagement.totalAbandoned)} abandoned
                </StatSub>
              </StatCard>

              <StatCard $accent="#3b82f6">
                <StatValue $accent="#3b82f6" $small>
                  {pct(data.engagement.avgScore)}
                </StatValue>
                <StatLabel>Avg Score</StatLabel>
                <StatSub>Across all submitted</StatSub>
              </StatCard>

              <StatCard $accent="#f59e0b">
                <StatValue $accent="#f59e0b" $small>
                  {pct(data.engagement.passRate)}
                </StatValue>
                <StatLabel>Pass Rate</StatLabel>
                <StatSub>
                  ~{data.engagement.avgSessionsPerUser} sessions/user
                </StatSub>
              </StatCard>
            </StatsGrid>

            {/* ── Mode split badges ──────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <Badge $color="#22c55e">
                Practice (30d): {fmt(data.trends.recentPractice30d)}
              </Badge>
              <Badge $color="#3b82f6">
                Exam (30d): {fmt(data.trends.recentExam30d)}
              </Badge>
              <Badge $color="#6366f1">
                In Progress: {fmt(data.engagement.totalInProgress)}
              </Badge>
            </div>
          </>
        )}
      </Section>

      {/* ── 30-Day Activity Chart ───────────────────────────────────── */}
      <Section>
        <SectionTitle>Activity (Last 30 Days)</SectionTitle>
        {!data ? (
          <SkeletonCard style={{ minHeight: 160 }}>
            <SkeletonLine $w="30%" />
            <SkeletonLine $w="100%" />
            <SkeletonLine $w="100%" />
          </SkeletonCard>
        ) : (
          <ChartWrap>
            <ChartTitle>
              Daily Sessions
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  color: "inherit",
                  opacity: 0.5,
                  marginLeft: 8,
                }}
              >
                (hover for detail)
              </span>
            </ChartTitle>
            <ChartBars>
              {chartData.map((d) => (
                <Bar
                  key={d.date}
                  $h={(d.sessions / maxSessions) * 100}
                  $accent="#6366f1"
                  title={`${d.date}\n${d.sessions} sessions\n${d.uniqueUsers} users`}
                />
              ))}
            </ChartBars>
            <ChartLabels>
              <ChartLabel>
                {chartData.length > 0
                  ? chartData[0].date.slice(5)
                  : ""}
              </ChartLabel>
              <ChartLabel>
                {chartData.length > 0
                  ? chartData[chartData.length - 1].date.slice(5)
                  : ""}
              </ChartLabel>
            </ChartLabels>
          </ChartWrap>
        )}
      </Section>

      {/* ── Question Set Breakdown ──────────────────────────────────── */}
      {data && data.setBreakdown.length > 0 && (
        <Section>
          <SectionTitle>Performance by Question Set</SectionTitle>
          <Table>
            <TableRow $header>
              <TableCell>Set</TableCell>
              <TableCell>Sessions</TableCell>
              <TableCell>Avg Score</TableCell>
              <TableCell>Pass Rate</TableCell>
            </TableRow>
            {data.setBreakdown
              .sort((a, b) => b.totalSessions - a.totalSessions)
              .map((s) => (
                <TableRow key={s.setId}>
                  <TableCell>{setLabel(s.setId)}</TableCell>
                  <TableCell>{fmt(s.totalSessions)}</TableCell>
                  <TableCell $accent="#3b82f6">
                    {pct(s.avgScore)}
                  </TableCell>
                  <TableCell
                    $accent={s.passRate >= 70 ? "#22c55e" : "#ef4444"}
                  >
                    {pct(s.passRate)}
                  </TableCell>
                </TableRow>
              ))}
          </Table>
        </Section>
      )}

      {/* ── Quick Links ────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Quick Links</SectionTitle>
        <NavGrid>
          <NavCard href="/admin/questions">
            <NavIcon>📝</NavIcon>
            <div>
              <NavLabel>Questions</NavLabel>
              <NavDesc>Browse and edit question bank</NavDesc>
            </div>
          </NavCard>
          <NavCard href="/admin/users">
            <NavIcon>👥</NavIcon>
            <div>
              <NavLabel>Users</NavLabel>
              <NavDesc>Search users and manage roles</NavDesc>
            </div>
          </NavCard>
        </NavGrid>
      </Section>
    </Page>
  );
}
