"use client";

import React, { useState } from "react";
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

/* Collapsible section — default closed. Uses native <details> for zero-JS
   accessibility. The arrow is flipped via the [open] attribute selector. */
const CollapseSection = styled.details`
  margin: 0;

  & > summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: ${(p) => p.theme.muted};
  }
  & > summary::-webkit-details-marker { display: none; }
  & > summary::before {
    content: "▸";
    display: inline-block;
    transition: transform 150ms ease;
    font-size: 10px;
  }
  &[open] > summary::before { transform: rotate(90deg); }

  & > summary:hover { color: ${(p) => p.theme.text}; }
`;

const CollapseBody = styled.div`
  margin-top: 10px;
`;

/* ── score overview ───────────────────────────────────────────────────────── */

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ScoreSubLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  margin-top: 2px;
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

const MasteryCard = styled.button<{ $band: MasteryBand }>`
  width: 100%;
  text-align: left;
  font: inherit;
  cursor: pointer;
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

  &:hover { filter: brightness(1.06); }
  &:focus-visible { outline: 2px solid ${(p) => p.theme.accent}; outline-offset: 2px; }
`;

const MasteryStatsExpanded = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
  margin-top: 6px;
`;

const MasteryChevron = styled.span<{ $open: boolean }>`
  display: inline-block;
  margin-left: 6px;
  font-size: 10px;
  color: ${(p) => p.theme.muted};
  transition: transform 150ms ease;
  transform: rotate(${(p) => (p.$open ? 90 : 0)}deg);
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

/** Same threshold as feedbackEngine — hide topic pills that don't have
 *  enough attempts for the accuracy % to be meaningful. */
const TOPIC_MIN_ATTEMPTS = 3;

export function AdaptiveResults({ summary, passThreshold = 70 }: AdaptiveResultsProps) {
  const { weighted, topicInsights, domainMastery, feedback } = summary;
  const meaningfulStrong = topicInsights.strongest.filter((t) => t.attempted >= TOPIC_MIN_ATTEMPTS);
  const meaningfulWeak = topicInsights.weakest.filter((t) => t.attempted >= TOPIC_MIN_ATTEMPTS);

  // Per-domain expanded state for Mastery cards. Default compact (one line)
  // so mobile isn't dominated by the four-metric stats row; tap to expand.
  const [expandedDomains, setExpandedDomains] = useState<Set<Domain>>(new Set());
  const toggleDomain = (d: Domain) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  return (
    <>
      {/* Score Overview — two headline tiles.
          Raw Accuracy is folded into the Correct tile as a subtitle so the
          three-across grid collapses to a cleaner two-across on every
          viewport. */}
      <Section>
        <SectionTitle>Performance Overview</SectionTitle>
        <ScoreGrid>
          {(() => {
            const correct = weighted.scoreResults.filter((r) => r.isCorrect).length;
            const total = weighted.scoreResults.length;
            const variant = weighted.rawPercent >= passThreshold ? "success" : "error";
            return (
              <ScoreBox $variant={variant}>
                <ScoreValue $variant={variant}>
                  {correct}/{total}
                </ScoreValue>
                <ScoreSubLabel>{weighted.rawPercent}% accuracy</ScoreSubLabel>
                <ScoreLabel>Correct</ScoreLabel>
              </ScoreBox>
            );
          })()}
          <ScoreBox $variant="accent">
            <ScoreValue $variant="accent">{weighted.weightedPercent}%</ScoreValue>
            <ScoreSubLabel>avg difficulty {weighted.avgDifficulty}</ScoreSubLabel>
            <ScoreLabel>Weighted Score</ScoreLabel>
          </ScoreBox>
        </ScoreGrid>
        <InsightText>Weighted score accounts for question difficulty.</InsightText>
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
              const open = expandedDomains.has(d);
              return (
                <MasteryCard
                  key={d}
                  $band={band}
                  type="button"
                  onClick={() => toggleDomain(d)}
                  aria-expanded={open}
                >
                  <MasteryHeader>
                    <MasteryDomainName>
                      {DOMAIN_LABELS[d]}
                      <MasteryChevron $open={open} aria-hidden>▸</MasteryChevron>
                    </MasteryDomainName>
                    <MasteryBadge $band={band}>{band}</MasteryBadge>
                  </MasteryHeader>
                  {/* Compact line — always visible. */}
                  <MasteryStats>
                    <span>{stats.correct}/{stats.total}</span>
                    <span>{stats.weightedPercent}% weighted</span>
                  </MasteryStats>
                  {/* Expanded metrics — revealed on tap. */}
                  {open && (
                    <MasteryStatsExpanded>
                      <span>Raw {stats.rawPercent}%</span>
                      <span>Avg diff {stats.avgDifficulty}</span>
                    </MasteryStatsExpanded>
                  )}
                  <MasteryTrack>
                    <MasteryFill $pct={stats.weightedPercent} $band={band} />
                  </MasteryTrack>
                </MasteryCard>
              );
            })}
        </MasteryGrid>
      </Section>

      <Divider />

      {/* Difficulty Breakdown — collapsed by default */}
      <CollapseSection>
        <summary>Difficulty Performance</summary>
        <CollapseBody>
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
        </CollapseBody>
      </CollapseSection>

      {/* Topic Strengths & Weaknesses — collapsed by default.
          Hidden entirely when no topic has ≥ TOPIC_MIN_ATTEMPTS attempts,
          since a topic with 1–2 data points produces noisy percentages. */}
      {(meaningfulStrong.length > 0 || meaningfulWeak.length > 0) && (
        <>
          <Divider />
          <CollapseSection>
            <summary>Topics</summary>
            <CollapseBody>
              {meaningfulStrong.length > 0 && (
                <>
                  <SectionTitle>Strongest</SectionTitle>
                  <TopicRow>
                    {meaningfulStrong.map((t) => (
                      <TopicPill key={t.tag} $variant="strong">
                        {topicLabel(t.tag)} ({t.weightedAccuracy}%)
                      </TopicPill>
                    ))}
                  </TopicRow>
                </>
              )}
              {meaningfulWeak.length > 0 && (
                <>
                  <SectionTitle style={{ marginTop: meaningfulStrong.length > 0 ? 14 : 0 }}>
                    Weakest
                  </SectionTitle>
                  <TopicRow>
                    {meaningfulWeak.map((t) => (
                      <TopicPill key={t.tag} $variant="weak">
                        {topicLabel(t.tag)} ({t.weightedAccuracy}%)
                      </TopicPill>
                    ))}
                  </TopicRow>
                </>
              )}
            </CollapseBody>
          </CollapseSection>
        </>
      )}

      <Divider />

      {/* Personalized Feedback — collapsed by default */}
      <CollapseSection>
        <summary>Recommended Focus</summary>
        <CollapseBody>
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
        </CollapseBody>
      </CollapseSection>
    </>
  );
}
