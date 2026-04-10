"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import type { Domain, Difficulty } from "../core/types";
import type { AdaptiveSummary } from "../core/analytics";
import type { MasteryBand } from "../core/adaptiveConfig";

/* ── animations ───────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── layout ───────────────────────────────────────────────────────────────── */

const Section = styled.div`
  animation: ${fadeIn} 300ms ease both;
`;

const SectionTitle = styled.div`
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
  margin-bottom: 10px;
`;

const Divider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.divider};
  margin: 14px 0;
`;

/* ── score overview ───────────────────────────────────────────────────────── */

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const ScoreBox = styled.div<{ $variant?: "success" | "error" | "accent" | "neutral" }>`
  border: 1px solid ${(p) =>
    p.$variant === "success" ? p.theme.successBorder
    : p.$variant === "error" ? p.theme.errorBorder
    : p.$variant === "accent" ? `${p.theme.accent}33`
    : p.theme.cardBorder};
  background: ${(p) =>
    p.$variant === "success" ? p.theme.successSoft
    : p.$variant === "error" ? p.theme.errorSoft
    : p.$variant === "accent" ? p.theme.accentSoft
    : p.theme.name === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc"};
  border-radius: 14px;
  padding: 12px;
  text-align: center;
`;

const ScoreValue = styled.div<{ $variant?: "success" | "error" | "accent" | "neutral" }>`
  font-size: 22px;
  font-weight: 900;
  color: ${(p) =>
    p.$variant === "success" ? p.theme.success
    : p.$variant === "error" ? p.theme.error
    : p.$variant === "accent" ? p.theme.accent
    : p.theme.text};
  letter-spacing: -0.4px;
`;

const ScoreLabel = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
  margin-top: 3px;
`;

/* ── domain mastery cards ─────────────────────────────────────────────────── */

const MasteryGrid = styled.div`
  display: grid;
  gap: 8px;
`;

const MasteryCard = styled.div<{ $band: MasteryBand }>`
  border-radius: 14px;
  padding: 14px;
  border: 1px solid ${(p) =>
    p.$band === "Strong" ? p.theme.successBorder
    : p.$band === "Proficient" ? `${p.theme.accent}33`
    : p.$band === "Developing" ? p.theme.warningBorder
    : p.theme.errorBorder};
  background: ${(p) =>
    p.$band === "Strong" ? p.theme.successSoft
    : p.$band === "Proficient" ? p.theme.accentSoft
    : p.$band === "Developing" ? p.theme.warningSoft
    : p.theme.errorSoft};
`;

const MasteryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
`;

const MasteryDomainName = styled.div`
  font-size: 13.5px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
`;

const MasteryBadge = styled.span<{ $band: MasteryBand }>`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 999px;
  color: ${(p) =>
    p.$band === "Strong" ? p.theme.success
    : p.$band === "Proficient" ? p.theme.accent
    : p.$band === "Developing" ? p.theme.warning
    : p.theme.error};
  background: ${(p) =>
    p.$band === "Strong" ? `${p.theme.success}18`
    : p.$band === "Proficient" ? `${p.theme.accent}18`
    : p.$band === "Developing" ? `${p.theme.warning}18`
    : `${p.theme.error}18`};
`;

const MasteryStats = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
`;

const MasteryTrack = styled.div`
  height: 5px;
  background: ${(p) => p.theme.divider};
  border-radius: 999px;
  overflow: hidden;
  margin-top: 8px;
`;

const MasteryFill = styled.div<{ $pct: number; $band: MasteryBand }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  border-radius: 999px;
  background: ${(p) =>
    p.$band === "Strong" ? p.theme.success
    : p.$band === "Proficient" ? p.theme.accent
    : p.$band === "Developing" ? p.theme.warning
    : p.theme.error};
  transition: width 600ms ease;
`;

/* ── topic pills ──────────────────────────────────────────────────────────── */

const TopicRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

const TopicPill = styled.div<{ $variant: "weak" | "strong" }>`
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.$variant === "weak" ? p.theme.errorBorder : p.theme.successBorder};
  background: ${(p) => p.$variant === "weak" ? p.theme.errorSoft : p.theme.successSoft};
  color: ${(p) => p.$variant === "weak" ? p.theme.error : p.theme.success};
`;

/* ── difficulty breakdown ─────────────────────────────────────────────────── */

const DiffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
`;

const DiffCell = styled.div<{ $active: boolean }>`
  border-radius: 10px;
  padding: 8px 4px;
  text-align: center;
  border: 1px solid ${(p) => p.$active ? p.theme.cardBorder : "transparent"};
  background: ${(p) => p.$active
    ? (p.theme.name === "dark" ? "rgba(255,255,255,0.04)" : "#f8fafc")
    : "transparent"};
`;

const DiffLevel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  text-transform: uppercase;
  letter-spacing: 0.2px;
`;

const DiffPct = styled.div<{ $pct: number }>`
  font-size: 16px;
  font-weight: 900;
  color: ${(p) =>
    p.$pct >= 75 ? p.theme.success
    : p.$pct >= 50 ? p.theme.warning
    : p.$pct > 0 ? p.theme.error
    : p.theme.muted};
  margin-top: 2px;
`;

const DiffCount = styled.div`
  font-size: 10px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
`;

/* ── feedback ─────────────────────────────────────────────────────────────── */

const FeedbackList = styled.div`
  display: grid;
  gap: 6px;
`;

const FeedbackItem = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.text};
  line-height: 1.5;
  padding: 8px 12px;
  border-radius: 10px;
  background: ${(p) => p.theme.name === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc"};
  border: 1px solid ${(p) => p.theme.cardBorder};
`;

const InsightText = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.55;
  margin-top: 4px;
`;

/* ── helpers ──────────────────────────────────────────────────────────────── */

const DOMAIN_LABELS: Record<Domain, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Environment",
};

function topicLabel(tag: string): string {
  return tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const DIFF_LABELS: Record<Difficulty, string> = {
  1: "D1",
  2: "D2",
  3: "D3",
  4: "D4",
  5: "D5",
};

/* ── component ────────────────────────────────────────────────────────────── */

interface AdaptiveResultsProps {
  summary: AdaptiveSummary;
  passThreshold?: number;
}

export function AdaptiveResults({ summary, passThreshold = 70 }: AdaptiveResultsProps) {
  const { weighted, topicInsights, domainMastery, feedback } = summary;

  return (
    <>
      {/* Score Overview */}
      <Section>
        <SectionTitle>Performance Overview</SectionTitle>
        <ScoreGrid>
          <ScoreBox $variant="neutral">
            <ScoreValue>{weighted.rawPercent}%</ScoreValue>
            <ScoreLabel>Raw Accuracy</ScoreLabel>
          </ScoreBox>
          <ScoreBox $variant="accent">
            <ScoreValue $variant="accent">{weighted.weightedPercent}%</ScoreValue>
            <ScoreLabel>Weighted Score</ScoreLabel>
          </ScoreBox>
          <ScoreBox $variant={weighted.rawPercent >= passThreshold ? "success" : "error"}>
            <ScoreValue $variant={weighted.rawPercent >= passThreshold ? "success" : "error"}>
              {weighted.scoreResults.filter((r) => r.isCorrect).length}/{weighted.scoreResults.length}
            </ScoreValue>
            <ScoreLabel>Correct</ScoreLabel>
          </ScoreBox>
        </ScoreGrid>
        <InsightText>
          Avg difficulty: {weighted.avgDifficulty} · Weighted score accounts for question difficulty
        </InsightText>
      </Section>

      <Divider />

      {/* Domain Mastery */}
      <Section>
        <SectionTitle>Domain Mastery</SectionTitle>
        <MasteryGrid>
          {(["people", "process", "business_environment"] as Domain[])
            .filter((d) => weighted.byDomain[d].total > 0)
            .map((d) => {
              const stats = weighted.byDomain[d];
              const band = domainMastery[d];
              return (
                <MasteryCard key={d} $band={band}>
                  <MasteryHeader>
                    <MasteryDomainName>{DOMAIN_LABELS[d]}</MasteryDomainName>
                    <MasteryBadge $band={band}>{band}</MasteryBadge>
                  </MasteryHeader>
                  <MasteryStats>
                    <span>{stats.correct}/{stats.total} correct</span>
                    <span>Raw {stats.rawPercent}%</span>
                    <span>Weighted {stats.weightedPercent}%</span>
                    <span>Avg diff {stats.avgDifficulty}</span>
                  </MasteryStats>
                  <MasteryTrack>
                    <MasteryFill $pct={stats.weightedPercent} $band={band} />
                  </MasteryTrack>
                </MasteryCard>
              );
            })}
        </MasteryGrid>
      </Section>

      <Divider />

      {/* Difficulty Breakdown */}
      <Section>
        <SectionTitle>Difficulty Performance</SectionTitle>
        <DiffGrid>
          {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => {
            const perf = weighted.difficultyPerformance[d];
            const active = perf.total > 0;
            return (
              <DiffCell key={d} $active={active}>
                <DiffLevel>{DIFF_LABELS[d]}</DiffLevel>
                <DiffPct $pct={active ? perf.weightedPercent : 0}>
                  {active ? `${perf.weightedPercent}%` : "—"}
                </DiffPct>
                <DiffCount>{perf.total > 0 ? `${perf.correct}/${perf.total}` : ""}</DiffCount>
              </DiffCell>
            );
          })}
        </DiffGrid>
        <InsightText>{feedback.difficultyInsight}</InsightText>
      </Section>

      <Divider />

      {/* Topic Strengths & Weaknesses */}
      {(topicInsights.strongest.length > 0 || topicInsights.weakest.length > 0) && (
        <Section>
          {topicInsights.strongest.length > 0 && (
            <>
              <SectionTitle>Strongest Topics</SectionTitle>
              <TopicRow>
                {topicInsights.strongest.map((t) => (
                  <TopicPill key={t.tag} $variant="strong">
                    {topicLabel(t.tag)} ({t.weightedAccuracy}%)
                  </TopicPill>
                ))}
              </TopicRow>
            </>
          )}
          {topicInsights.weakest.length > 0 && (
            <>
              <SectionTitle style={{ marginTop: topicInsights.strongest.length > 0 ? 14 : 0 }}>
                Weakest Topics
              </SectionTitle>
              <TopicRow>
                {topicInsights.weakest.map((t) => (
                  <TopicPill key={t.tag} $variant="weak">
                    {topicLabel(t.tag)} ({t.weightedAccuracy}%)
                  </TopicPill>
                ))}
              </TopicRow>
            </>
          )}
          <Divider />
        </Section>
      )}

      {/* Personalized Feedback */}
      <Section>
        <SectionTitle>Recommended Focus</SectionTitle>
        <FeedbackList>
          {feedback.recommendedFocus.map((rec, i) => (
            <FeedbackItem key={i}>{rec}</FeedbackItem>
          ))}
        </FeedbackList>
        {feedback.summaryLines.length > 0 && (
          <InsightText style={{ marginTop: 10 }}>
            {feedback.summaryLines.join(" ")}
          </InsightText>
        )}
      </Section>
    </>
  );
}
