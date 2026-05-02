"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { keyframes, useTheme } from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUpgrade } from "@/lib/useUpgrade";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { loadBankBySlug, loadQuestions } from "@/src/exam-engine/data/loadFromSupabase";
import { TOPICS_BY_DOMAIN, buildTopicIndex } from "@/src/exam-engine/core/topicLabels";
import type { AppTheme } from "@/ui/theme";

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

type DomainKey = "people" | "process" | "business_environment";

type BucketStats = {
  score: number;
  maxScore: number;
  correct: number;
  total: number;
};

type ScoreResultLite = { questionId: string; isCorrect: boolean };

type AttemptResult = {
  byDomain: Partial<Record<DomainKey, BucketStats>>;
  scoreResults?: ScoreResultLite[];
};

type AttemptWithResult = {
  id: string;
  mode: "practice" | "exam";
  set_id: string | null;
  bank_slug: string;
  result: AttemptResult | null;
};

type QuestionMeta = { domain: DomainKey; tags: string[] };

const DOMAIN_LABELS: Record<DomainKey, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Environment",
};

/** PMI PMP exam blueprint weights per domain */
const PMI_BLUEPRINT: Record<DomainKey, number> = {
  people: 42,
  process: 50,
  business_environment: 8,
};

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── existing styled components ─────────────────────────────────────────── */

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
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
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
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 3px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(p) => p.theme.muted};
`;

const StatSub = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  opacity: 0.65;
  margin-top: 3px;
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

const AttemptCard = styled.div`
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

const DeleteBtn = styled.button`
  border: none;
  background: none;
  color: ${(p) => p.theme.muted};
  font-size: 16px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  flex-shrink: 0;
  transition: color 150ms ease, background 150ms ease;
  line-height: 1;

  &:hover {
    color: ${(p) => p.theme.error};
    background: ${(p) => p.theme.errorSoft};
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

const HistoryGate = styled.div`
  margin-top: 10px;
  padding: 14px 20px;
  border-radius: 14px;
  border: 1px dashed ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.accentSoft};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const HistoryGateText = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.text};
  font-weight: 600;
  flex: 1;

  span {
    color: ${(p) => p.theme.muted};
    font-weight: 400;
  }
`;

const HistoryGateBtn = styled.button`
  border: none;
  background: ${(p) => p.theme.accent};
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 150ms ease;

  &:hover { opacity: 0.88; }
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

/* ── analytics styled components ───────────────────────────────────────── */

const AnalyticsSection = styled.div`
  margin-bottom: 32px;
  animation: ${fadeUp} 400ms 100ms ease both;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AnalyticsCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px;
`;

const AnalyticsCardTitle = styled.h3`
  font-size: 14px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin: 0 0 14px;
  letter-spacing: -0.2px;
`;

const BarRow = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BarLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.text};
  margin-bottom: 5px;
`;

const BarLabelRight = styled.span`
  color: ${(p) => p.theme.muted};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BarTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: ${(p) => p.theme.cardBorder};
  overflow: hidden;
`;

const BarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${(p) => Math.max(p.$pct, 2)}%;
  border-radius: 4px;
  background: ${(p) => p.$color};
  transition: width 600ms ease;
`;

const TopicEmpty = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  padding: 6px 0;
`;

const FocusCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px;
`;

const FocusItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FocusIcon = styled.span`
  font-size: 16px;
  line-height: 1.3;
  flex-shrink: 0;
`;

const FocusText = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.text};
  line-height: 1.4;
`;

const FocusPercent = styled.span<{ $color: string }>`
  font-weight: 700;
  color: ${(p) => p.$color};
`;

const ProGateCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const ProGateBlur = styled.div`
  filter: blur(6px);
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

const ProGateLabel = styled.div`
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

const ProGateText = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  max-width: 260px;
`;

const ProGateBtn = styled.button`
  display: inline-block;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.accent};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover { text-decoration: underline; }
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

const UpgradeModalCard = styled.div`
  background: ${(p) =>
    p.theme.name === "dark" ? "#111827" : p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: ${(p) => p.theme.shadowLg};
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

const UpgradeModalBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: none;
  background: ${(p) => p.theme.accent};
  color: white;
  padding: 13px 20px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;
  margin-bottom: 10px;

  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

const UpgradeConsentNote = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  text-align: center;
  line-height: 1.5;
  margin-top: 8px;
  opacity: 0.7;
`;

const UpgradeConsentLink = styled(Link)`
  color: ${(p) => p.theme.muted};
  text-decoration: underline;
  &:hover { color: ${(p) => p.theme.text}; }
`;

const UpgradeCloseBtn = styled.button`
  background: none; border: none;
  color: ${(p) => p.theme.muted};
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  padding: 8px 16px;

  &:hover { color: ${(p) => p.theme.text}; }
`;

const TabRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.$active ? p.theme.accent : p.theme.cardBorder};
  background: ${(p) => p.$active ? p.theme.accentSoft : p.theme.buttonBg};
  color: ${(p) => p.$active ? p.theme.accent : p.theme.muted};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    border-color: ${(p) => p.theme.accent};
    color: ${(p) => p.theme.accent};
  }
`;

const SetBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  margin-left: 6px;
  vertical-align: middle;
`;

const NoData = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  padding: 16px 0;
  text-align: center;
`;

/* ── NEW: score trend chart ─────────────────────────────────────────────── */

const TrendWrap = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 14px;
`;

const TrendHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
`;

const TrendLegend = styled.div`
  display: flex;
  gap: 14px;
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
`;

const LegendItem = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const LegendLine = styled.span<{ $dashed?: boolean; $color: string }>`
  display: inline-block;
  width: 18px;
  height: 0;
  border-bottom: ${(p) =>
    p.$dashed
      ? `2px dashed ${p.$color}`
      : `2.5px solid ${p.$color}`};
  vertical-align: middle;
`;

/* ── NEW: readiness banner ──────────────────────────────────────────────── */

const ReadinessBanner = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  animation: ${fadeUp} 400ms 90ms ease both;
  box-shadow: ${(p) => p.theme.shadow};

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const ReadinessGauge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 76px;

  @media (max-width: 480px) {
    flex-direction: row;
    align-items: baseline;
    gap: 10px;
    width: auto;
  }
`;

const ReadinessNum = styled.div`
  font-size: 34px;
  font-weight: 900;
  letter-spacing: -1.5px;
  line-height: 1;
`;

const ReadinessTag = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
  opacity: 0.8;

  @media (max-width: 480px) {
    margin-top: 0;
  }
`;

const ReadinessInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ReadinessTitle = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
`;

const ReadinessDesc = styled.div`
  font-size: 12.5px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
`;

/* ── NEW: next recommended session ─────────────────────────────────────── */

const NextSessionCard = styled.div`
  background: ${(p) => p.theme.accentSoft};
  border: 1px solid ${(p) => p.theme.accent}28;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
  animation: ${fadeUp} 400ms 100ms ease both;
  flex-wrap: wrap;
`;

const NextSessionText = styled.div`
  flex: 1;
  min-width: 0;
`;

const NextSessionTitle = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const NextSessionSub = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.45;
`;

const NextSessionBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  background: ${(p) => p.theme.accent};
  color: white;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 150ms ease;
  flex-shrink: 0;

  &:hover { opacity: 0.88; }
`;

/* ── NEW: blueprint gap note ────────────────────────────────────────────── */

const BlueprintNote = styled.span`
  font-size: 10px;
  color: ${(p) => p.theme.muted};
  font-weight: 500;
  margin-left: 4px;
  opacity: 0.65;
`;

/* ── NEW: persistent wrong-answer memory ───────────────────────────────── */

const WrongMemoryCard = styled.div`
  background: ${(p) => p.theme.errorSoft};
  border: 1px solid ${(p) => p.theme.errorBorder};
  border-radius: 16px;
  padding: 16px 20px;
  margin-top: 14px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const WrongMemoryIcon = styled.div`
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1.5;
`;

const WrongMemoryInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const WrongMemoryTitle = styled.div`
  font-size: 14px;
  font-weight: 800;
  color: ${(p) => p.theme.error};
  margin-bottom: 4px;
`;

const WrongMemoryDesc = styled.div`
  font-size: 12.5px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
  margin-bottom: 10px;
`;

const WrongMemoryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 9px;
  background: ${(p) => p.theme.error};
  color: white;
  font-size: 12.5px;
  font-weight: 800;
  text-decoration: none;
  transition: opacity 150ms ease;

  &:hover { opacity: 0.85; }
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

function pctColor(pct: number, theme: { success: string; warning: string; error: string }) {
  if (pct >= 70) return theme.success;
  if (pct >= 50) return theme.warning;
  return theme.error;
}

type AggBucket = { correct: number; total: number };

function aggregateResults(results: AttemptResult[]) {
  const byDomain: Record<string, AggBucket> = {};

  for (const r of results) {
    if (r.byDomain) {
      for (const [k, v] of Object.entries(r.byDomain)) {
        if (!v) continue;
        if (!byDomain[k]) byDomain[k] = { correct: 0, total: 0 };
        byDomain[k].correct += v.correct;
        byDomain[k].total += v.total;
      }
    }
  }

  return { byDomain };
}

/* ── Score Trend Chart ──────────────────────────────────────────────────── */

type TrendPoint = {
  date: string;
  score: number;
  mode: "practice" | "exam";
  passed: boolean | null;
};

function ScoreTrendLine({ points }: { points: TrendPoint[] }) {
  const theme = useTheme() as AppTheme;
  if (points.length < 2) return null;

  const W = 540, H = 112, PL = 30, PR = 10, PT = 20, PB = 26;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const n = points.length;

  const xOf = (i: number) =>
    PL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yOf = (s: number) =>
    PT + (1 - Math.min(Math.max(s, 0), 100) / 100) * plotH;

  const examPts = points
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.mode === "exam");
  const practicePts = points
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.mode === "practice");

  const toPolyline = (pts: (TrendPoint & { i: number })[]) =>
    pts.map((p) => `${xOf(p.i).toFixed(1)},${yOf(p.score).toFixed(1)}`).join(" ");

  const thY = yOf(70);
  const accentColor = theme.accent;
  const mutedColor = theme.muted;
  const successColor = theme.success;
  const errorColor = theme.error;

  // Which x-axis indices to label
  const labelIdxSet = new Set<number>([0, n - 1]);
  if (n <= 6) {
    for (let i = 1; i < n - 1; i++) labelIdxSet.add(i);
  } else {
    const step = Math.ceil(n / 4);
    for (let i = step; i < n - 1; i += step) labelIdxSet.add(i);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      aria-label="Score trend over time"
    >
      {/* Horizontal grid lines */}
      {[0, 25, 50, 75, 100].map((v) => (
        <line
          key={v}
          x1={PL} y1={yOf(v)} x2={W - PR} y2={yOf(v)}
          stroke={mutedColor} strokeOpacity="0.12" strokeWidth="1"
        />
      ))}

      {/* 70% pass threshold */}
      <line
        x1={PL} y1={thY} x2={W - PR} y2={thY}
        stroke={successColor} strokeWidth="1.5"
        strokeDasharray="5 3" strokeOpacity="0.5"
      />
      <text
        x={W - PR} y={thY - 4} fontSize="8.5"
        fill={successColor} opacity="0.6" textAnchor="end"
      >
        70% pass
      </text>

      {/* Practice polyline (dashed, muted) */}
      {practicePts.length >= 2 && (
        <polyline
          points={toPolyline(practicePts)}
          fill="none"
          stroke={mutedColor}
          strokeWidth="1.5"
          strokeDasharray="4 2"
          strokeOpacity="0.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Exam polyline (solid, accent) */}
      {examPts.length >= 2 && (
        <polyline
          points={toPolyline(examPts)}
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Data dots */}
      {points.map((p, i) => {
        const cx = xOf(i);
        const cy = yOf(p.score);
        const dotColor =
          p.mode === "exam"
            ? p.passed
              ? successColor
              : errorColor
            : mutedColor;
        const r = p.mode === "exam" ? 4.5 : 3;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={dotColor} />
            {p.mode === "exam" && (
              <text
                x={cx} y={cy - 8} fontSize="9"
                textAnchor="middle"
                fill={dotColor}
                fontWeight="700"
                opacity="0.9"
              >
                {p.score}%
              </text>
            )}
          </g>
        );
      })}

      {/* X axis date labels */}
      {points.map((p, i) => {
        if (!labelIdxSet.has(i)) return null;
        const lbl = new Date(p.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return (
          <text
            key={i}
            x={xOf(i)} y={H - 3}
            fontSize="8.5"
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            fill={mutedColor}
            opacity="0.65"
          >
            {lbl}
          </text>
        );
      })}

      {/* Y axis labels */}
      {[0, 50, 100].map((v) => (
        <text
          key={v}
          x={PL - 4} y={yOf(v) + 3}
          fontSize="8.5"
          textAnchor="end"
          fill={mutedColor}
          opacity="0.55"
        >
          {v}%
        </text>
      ))}
    </svg>
  );
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function DashboardClient() {
  const { user, loading: authLoading, isPro } = useAuth();
  const { startCheckout, loading: checkoutLoading } = useUpgrade();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const router = useRouter();
  const theme = useTheme() as AppTheme;
  const sb = useMemo(() => supabaseBrowser(), []);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [allResults, setAllResults] = useState<AttemptWithResult[]>([]);
  const [questionMeta, setQuestionMeta] = useState<Map<string, QuestionMeta>>(new Map());
  const [loadedBankSlugs, setLoadedBankSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [analyticsTab, setAnalyticsTab] = useState<"practice" | "exam">("practice");

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await sb
        .from("attempts")
        .select(
          "id, bank_slug, mode, set_id, status, total_score, max_score, score_percent, passed, created_at, submitted_at, result"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data as (AttemptSummary & { result: AttemptResult | null })[]) ?? [];

      setAttempts(rows.map(({ result: _r, ...rest }) => rest));

      setAllResults(
        rows
          .filter((r) => r.status === "submitted" && r.result !== null)
          .map((r) => ({
            id: r.id,
            mode: r.mode,
            set_id: r.set_id,
            bank_slug: r.bank_slug,
            result: r.result,
          }))
      );
    } catch (err) {
      console.error("[Dashboard] Failed to load data:", err);
    }
  }, [user, sb]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      await loadData();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, loadData]);

  useEffect(() => {
    if (!user || allResults.length === 0) return;
    const slugs = Array.from(new Set(allResults.map((r) => r.bank_slug).filter(Boolean)));
    const missing = slugs.filter((s) => !loadedBankSlugs.has(s));
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const merged = new Map(questionMeta);
        await Promise.all(
          missing.map(async (slug) => {
            const bank = await loadBankBySlug(slug);
            const qs = await loadQuestions(bank.id);
            for (const q of qs) {
              merged.set(q.id, { domain: q.domain as DomainKey, tags: q.tags ?? [] });
            }
          })
        );
        if (cancelled) return;
        setQuestionMeta(merged);
        setLoadedBankSlugs((prev) => {
          const next = new Set(prev);
          for (const s of missing) next.add(s);
          return next;
        });
      } catch (err) {
        console.error("[Dashboard] Failed to load question bank(s) for topic analytics:", err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allResults, loadedBankSlugs]);

  /* ── derived data ────────────────────────────────────────────────────── */

  const submitted = useMemo(() => attempts.filter((a) => a.status === "submitted"), [attempts]);
  const examAttempts = useMemo(() => submitted.filter((a) => a.mode === "exam"), [submitted]);
  const practiceAttempts = useMemo(() => submitted.filter((a) => a.mode === "practice"), [submitted]);
  const passedExams = useMemo(() => examAttempts.filter((a) => a.passed), [examAttempts]);
  const avgScore = useMemo(
    () =>
      examAttempts.length > 0
        ? Math.round(
            examAttempts.reduce((sum, a) => sum + (a.score_percent ?? 0), 0) /
              examAttempts.length
          )
        : null,
    [examAttempts]
  );

  const practiceResults = useMemo(
    () => allResults.filter((r) => r.mode === "practice").map((r) => r.result as AttemptResult),
    [allResults]
  );
  const examResults = useMemo(
    () => allResults.filter((r) => r.mode === "exam").map((r) => r.result as AttemptResult),
    [allResults]
  );

  const activeResults = analyticsTab === "practice" ? practiceResults : examResults;
  const agg = useMemo(() => aggregateResults(activeResults), [activeResults]);

  const domainEntries = useMemo(() => {
    return (Object.keys(DOMAIN_LABELS) as DomainKey[])
      .filter((k) => agg.byDomain[k] && agg.byDomain[k].total > 0)
      .map((k) => {
        const b = agg.byDomain[k];
        const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
        return { key: k, label: DOMAIN_LABELS[k], pct, correct: b.correct, total: b.total };
      });
  }, [agg]);

  const OTHER_TOPIC_ID = "__other__";
  const topicEntriesByDomain = useMemo(() => {
    const out: Record<DomainKey, { id: string; label: string; correct: number; total: number; pct: number }[]> = {
      people: [],
      process: [],
      business_environment: [],
    };

    const modeResults = analyticsTab === "practice"
      ? allResults.filter((r) => r.mode === "practice")
      : allResults.filter((r) => r.mode === "exam");
    if (modeResults.length === 0 || questionMeta.size === 0) return out;

    const topicIndex = buildTopicIndex();
    const buckets: Record<DomainKey, Record<string, { correct: number; total: number }>> = {
      people: {},
      process: {},
      business_environment: {},
    };

    for (const row of modeResults) {
      const sr = row.result?.scoreResults;
      if (!sr || sr.length === 0) continue;
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
        if (matched.size === 0) matched.add(OTHER_TOPIC_ID);

        for (const topicId of matched) {
          const b = (buckets[meta.domain][topicId] ||= { correct: 0, total: 0 });
          b.total += 1;
          if (s.isCorrect) b.correct += 1;
        }
      }
    }

    (Object.keys(out) as DomainKey[]).forEach((d) => {
      const ordered = TOPICS_BY_DOMAIN[d];
      const curated = ordered
        .map((t) => {
          const b = buckets[d][t.id];
          if (!b || b.total === 0) return null;
          const pct = Math.round((b.correct / b.total) * 100);
          return { id: t.id, label: t.label, correct: b.correct, total: b.total, pct };
        })
        .filter((x): x is { id: string; label: string; correct: number; total: number; pct: number } => x !== null);

      const otherBucket = buckets[d][OTHER_TOPIC_ID];
      const other = otherBucket && otherBucket.total > 0
        ? [{
            id: OTHER_TOPIC_ID,
            label: "Other",
            correct: otherBucket.correct,
            total: otherBucket.total,
            pct: Math.round((otherBucket.correct / otherBucket.total) * 100),
          }]
        : [];

      out[d] = [...curated, ...other];
    });
    return out;
  }, [allResults, analyticsTab, questionMeta]);

  const topicsReady = questionMeta.size > 0;

  const topicEntriesFlat = useMemo(() => {
    const domOrder: Record<string, number> = { people: 0, process: 1, business_environment: 2 };
    const flat = (Object.keys(topicEntriesByDomain) as DomainKey[]).flatMap((d) =>
      topicEntriesByDomain[d].map((t) => ({
        key: `${d}:${t.id}`,
        label: t.label,
        domain: d,
        domainLabel: DOMAIN_LABELS[d],
        correct: t.correct,
        total: t.total,
        pct: t.pct,
      }))
    );
    flat.sort((a, b) => {
      const dd = (domOrder[a.domain] ?? 9) - (domOrder[b.domain] ?? 9);
      if (dd !== 0) return dd;
      return b.total - a.total;
    });
    return flat;
  }, [topicEntriesByDomain]);

  const weakAreas = useMemo(() => {
    const modeAttempts = analyticsTab === "practice" ? practiceAttempts : examAttempts;
    if (modeAttempts.length < 2) return [];

    if (isPro && topicEntriesFlat.length > 0) {
      const candidates = topicEntriesFlat.filter((t) => t.total >= 2);
      const pool = candidates.length > 0 ? candidates : topicEntriesFlat;
      return [...pool]
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 3)
        .map((t) => ({
          label: t.label,
          pct: t.pct,
          kind: "topic" as const,
          domainLabel: t.domainLabel,
          isOther: t.key.endsWith(`:${OTHER_TOPIC_ID}`),
        }));
    }

    return [...domainEntries]
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map((d) => ({
        label: d.label,
        pct: d.pct,
        kind: "domain" as const,
        domainLabel: undefined,
        isOther: false,
      }));
  }, [
    isPro,
    topicEntriesFlat,
    domainEntries,
    practiceAttempts,
    examAttempts,
    analyticsTab,
  ]);

  const examSetBreakdown = useMemo(() => {
    if (analyticsTab !== "exam") return [];
    const setMap: Record<string, AttemptResult[]> = {};
    for (const r of allResults) {
      if (r.mode !== "exam" || !r.result) continue;
      const key = r.set_id ?? "other";
      if (!setMap[key]) setMap[key] = [];
      setMap[key].push(r.result as AttemptResult);
    }
    return Object.entries(setMap).map(([setId, results]) => {
      const agg = aggregateResults(results);
      const totalCorrect = Object.values(agg.byDomain).reduce((s, b) => s + b.correct, 0);
      const totalQ = Object.values(agg.byDomain).reduce((s, b) => s + b.total, 0);
      const pct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
      const label = setId === "other" ? "Other" : setId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return { setId, label, pct, correct: totalCorrect, total: totalQ, attempts: results.length };
    });
  }, [allResults, analyticsTab]);

  /* ── NEW derived data ────────────────────────────────────────────────── */

  /** All submitted attempts sorted oldest → newest for the trend chart */
  const trendData = useMemo((): TrendPoint[] => {
    return [...submitted]
      .filter((a) => a.score_percent !== null)
      .sort(
        (a, b) =>
          new Date(a.submitted_at ?? a.created_at).getTime() -
          new Date(b.submitted_at ?? b.created_at).getTime()
      )
      .map((a) => ({
        date: a.submitted_at ?? a.created_at,
        score: a.score_percent!,
        mode: a.mode,
        passed: a.passed,
      }));
  }, [submitted]);

  /** Readiness score: recency-weighted average of last 3 exam (or practice) attempts */
  const readiness = useMemo(() => {
    const recentExams = [...examAttempts]
      .sort(
        (a, b) =>
          new Date(b.submitted_at ?? b.created_at).getTime() -
          new Date(a.submitted_at ?? a.created_at).getTime()
      )
      .slice(0, 3);
    const recentPractice = [...practiceAttempts]
      .sort(
        (a, b) =>
          new Date(b.submitted_at ?? b.created_at).getTime() -
          new Date(a.submitted_at ?? a.created_at).getTime()
      )
      .slice(0, 3);

    const pool = recentExams.length >= 1 ? recentExams : recentPractice;
    if (pool.length === 0) return null;

    const weights = [3, 2, 1];
    const total = pool.reduce((s, a, i) => s + (a.score_percent ?? 0) * (weights[i] ?? 1), 0);
    const wSum = pool.reduce((s, _, i) => s + (weights[i] ?? 1), 0);
    const score = Math.round(total / wSum);

    if (score >= 80)
      return {
        score,
        band: "Ready to Test",
        desc: "Strong readiness. Consider booking your PMP exam date.",
        level: "success" as const,
      };
    if (score >= 70)
      return {
        score,
        band: "Almost There",
        desc: "You're at the passing threshold. One more solid session should confirm readiness.",
        level: "warning" as const,
      };
    if (score >= 55)
      return {
        score,
        band: "Building Up",
        desc: "Keep going. Target your weakest domain to close the gap to 70%.",
        level: "warning" as const,
      };
    return {
      score,
      band: "Needs Work",
      desc: "Consistent daily practice is the path forward. Focus on fundamentals.",
      level: "error" as const,
    };
  }, [examAttempts, practiceAttempts]);

  /** Consecutive days studied */
  const streak = useMemo(() => {
    if (submitted.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set(
        submitted.map((a) =>
          new Date(a.submitted_at ?? a.created_at).toDateString()
        )
      )
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let s = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diffMs =
        new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime();
      if (Math.round(diffMs / 86_400_000) <= 1) s++;
      else break;
    }
    return s;
  }, [submitted]);

  /** Sessions completed this calendar week (Sun–Sat) */
  const weekSessions = useMemo(() => {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return submitted.filter(
      (a) => new Date(a.submitted_at ?? a.created_at) >= weekStart
    ).length;
  }, [submitted]);

  /** Weakest domain → recommended next session link */
  const nextSession = useMemo(() => {
    if (submitted.length === 0) return null;
    const allResultsData = allResults
      .map((r) => r.result)
      .filter((r): r is AttemptResult => r !== null);
    const allAgg = aggregateResults(allResultsData);
    const scored = (Object.keys(DOMAIN_LABELS) as DomainKey[])
      .map((k) => ({
        domain: k,
        label: DOMAIN_LABELS[k],
        pct:
          allAgg.byDomain[k]?.total
            ? Math.round(
                (allAgg.byDomain[k].correct / allAgg.byDomain[k].total) * 100
              )
            : 101,
      }))
      .filter((d) => (allAgg.byDomain[d.domain]?.total ?? 0) > 0);
    if (scored.length === 0) return null;
    const weakest = [...scored].sort((a, b) => a.pct - b.pct)[0];
    const count = isPro ? 25 : 20;
    return {
      weakDomain: weakest.label,
      weakPct: weakest.pct,
      count,
      href: `/bank/pmp/practice?count=${count}`,
    };
  }, [submitted, allResults, isPro]);

  /** Questions answered incorrectly in 2+ separate sessions (Pro only) */
  const persistentWrongIds = useMemo(() => {
    if (!isPro) return [];
    const wrongCounts: Record<string, number> = {};
    for (const r of allResults) {
      if (!r.result?.scoreResults) continue;
      for (const s of r.result.scoreResults) {
        if (!s.isCorrect) {
          wrongCounts[s.questionId] = (wrongCounts[s.questionId] ?? 0) + 1;
        }
      }
    }
    return Object.entries(wrongCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);
  }, [allResults, isPro]);

  /* ── deleteAttempt ─────────────────────────────────────────────────── */

  const deleteAttempt = useCallback(async (attemptId: string) => {
    if (!user) return;
    const ok = window.confirm("Delete this attempt? This cannot be undone.");
    if (!ok) return;
    try {
      const { error } = await sb
        .from("attempts")
        .delete()
        .eq("id", attemptId)
        .eq("user_id", user.id);
      if (error) throw error;

      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
      setAllResults((prev) => prev.filter((r) => r.id !== attemptId));
      await loadData();
    } catch (err) {
      console.error("[Dashboard] Failed to delete attempt:", err);
    }
  }, [user, sb, loadData]);

  /* ── early returns (after all hooks) ─────────────────────────────── */

  if (authLoading || loading) return <P>Loading dashboard...</P>;
  if (!user) return <P>Please sign in to view your dashboard.</P>;

  // Readiness color from theme
  const rColor =
    readiness?.level === "success"
      ? theme.success
      : readiness?.level === "error"
        ? theme.error
        : theme.warning;

  return (
    <Wrap>
      <Header>
        <H1>Dashboard</H1>
        <Subtitle>Track your progress and review past exam attempts.</Subtitle>
      </Header>

      {/* ── Summary Stats ─────────────────────────────────────── */}
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
        <StatCard>
          <StatValue>
            {streak > 0 ? streak : 0}
            {streak > 1 && (
              <span style={{ fontSize: "18px", lineHeight: 1 }}>🔥</span>
            )}
          </StatValue>
          <StatLabel>Day Streak</StatLabel>
          {weekSessions > 0 && (
            <StatSub>{weekSessions} session{weekSessions !== 1 ? "s" : ""} this week</StatSub>
          )}
        </StatCard>
      </StatsGrid>

      {/* ── Readiness Score ────────────────────────────────────── */}
      {readiness && submitted.length >= 1 && (
        <ReadinessBanner>
          <ReadinessGauge>
            <ReadinessNum style={{ color: rColor }}>
              {readiness.score}%
            </ReadinessNum>
            <ReadinessTag style={{ color: rColor }}>Readiness</ReadinessTag>
          </ReadinessGauge>
          <ReadinessInfo>
            <ReadinessTitle>{readiness.band}</ReadinessTitle>
            <ReadinessDesc>{readiness.desc}</ReadinessDesc>
          </ReadinessInfo>
        </ReadinessBanner>
      )}

      {/* ── Next Recommended Session ────────────────────────────── */}
      {nextSession && (
        <NextSessionCard>
          <NextSessionText>
            <NextSessionTitle>Recommended Next Session</NextSessionTitle>
            <NextSessionSub>
              {nextSession.weakPct <= 100
                ? `Focus on ${nextSession.weakDomain} — your weakest domain at ${nextSession.weakPct}%`
                : "Start your first session to begin tracking progress"}
            </NextSessionSub>
          </NextSessionText>
          <NextSessionBtn href={nextSession.href}>
            Start {nextSession.count} Questions
          </NextSessionBtn>
        </NextSessionCard>
      )}

      {/* ── Performance Analytics ─────────────────────────────── */}
      {allResults.length > 0 && (
        <AnalyticsSection>
          <SectionTitle>Performance Analytics</SectionTitle>

          {/* Score Trend Chart */}
          {trendData.length >= 2 && (
            <TrendWrap>
              <TrendHeader>
                <AnalyticsCardTitle style={{ margin: 0 }}>Score Trend</AnalyticsCardTitle>
                <TrendLegend>
                  <LegendItem>
                    <LegendLine $color={theme.accent} />
                    Exam
                  </LegendItem>
                  <LegendItem>
                    <LegendLine $dashed $color={theme.muted} />
                    Practice
                  </LegendItem>
                </TrendLegend>
              </TrendHeader>
              <ScoreTrendLine points={trendData} />
            </TrendWrap>
          )}

          <TabRow>
            <Tab $active={analyticsTab === "practice"} onClick={() => setAnalyticsTab("practice")}>
              Practice ({practiceResults.length})
            </Tab>
            <Tab $active={analyticsTab === "exam"} onClick={() => setAnalyticsTab("exam")}>
              Exam Simulations ({examResults.length})
            </Tab>
          </TabRow>

          {activeResults.length === 0 ? (
            <NoData>
              No {analyticsTab === "practice" ? "practice" : "exam"} results yet.
            </NoData>
          ) : (
            <>
              {/* Exam set breakdown */}
              {analyticsTab === "exam" && examSetBreakdown.length > 0 && (
                <AnalyticsCard style={{ marginBottom: 14 }}>
                  <AnalyticsCardTitle>Performance by Exam Set</AnalyticsCardTitle>
                  {examSetBreakdown.map((s) => (
                    <BarRow key={s.setId}>
                      <BarLabel>
                        <span>
                          {s.label}{" "}
                          <SetBadge>{s.attempts} attempt{s.attempts !== 1 ? "s" : ""}</SetBadge>
                        </span>
                        <BarLabelRight>
                          {s.pct}% ({s.correct}/{s.total})
                        </BarLabelRight>
                      </BarLabel>
                      <BarTrack>
                        <BarFill $pct={s.pct} $color={pctColor(s.pct, theme)} />
                      </BarTrack>
                    </BarRow>
                  ))}
                </AnalyticsCard>
              )}

              <AnalyticsGrid>
                {domainEntries.length > 0 && (
                  <AnalyticsCard>
                    <AnalyticsCardTitle>
                      Domain Performance
                      <SetBadge style={{ marginLeft: 6 }}>vs PMP blueprint</SetBadge>
                    </AnalyticsCardTitle>
                    {domainEntries.map((d) => (
                      <BarRow key={d.key}>
                        <BarLabel>
                          <span>
                            {d.label}
                            <BlueprintNote>
                              · {PMI_BLUEPRINT[d.key]}% of exam
                            </BlueprintNote>
                          </span>
                          <BarLabelRight>
                            {d.pct}% ({d.correct}/{d.total})
                            {d.pct < 70 && PMI_BLUEPRINT[d.key] >= 40 && (
                              <span
                                title="Below pass threshold in a high-weight domain"
                                style={{ color: theme.error, fontSize: 12 }}
                              >
                                ⚠
                              </span>
                            )}
                          </BarLabelRight>
                        </BarLabel>
                        <BarTrack>
                          <BarFill $pct={d.pct} $color={pctColor(d.pct, theme)} />
                        </BarTrack>
                      </BarRow>
                    ))}
                  </AnalyticsCard>
                )}
                {domainEntries.length > 0 && (
                  isPro ? (
                    <AnalyticsCard>
                      <AnalyticsCardTitle>Topic Performance</AnalyticsCardTitle>
                      {!topicsReady ? (
                        <TopicEmpty>Loading topic data…</TopicEmpty>
                      ) : topicEntriesFlat.length === 0 ? (
                        <TopicEmpty>No topic data available yet.</TopicEmpty>
                      ) : (
                        topicEntriesFlat.map((t) => (
                          <BarRow key={t.key}>
                            <BarLabel>
                              <span>
                                {t.label}{" "}
                                <SetBadge>{t.domainLabel}</SetBadge>
                              </span>
                              <BarLabelRight>
                                {t.pct}% ({t.correct}/{t.total})
                              </BarLabelRight>
                            </BarLabel>
                            <BarTrack>
                              <BarFill $pct={t.pct} $color={pctColor(t.pct, theme)} />
                            </BarTrack>
                          </BarRow>
                        ))
                      )}
                    </AnalyticsCard>
                  ) : (
                    <ProGateCard>
                      <ProGateOverlay>
                        <ProGateLabel>STUDY MODE</ProGateLabel>
                        <ProGateText>Unlock per-topic performance breakdown</ProGateText>
                        <ProGateBtn onClick={() => setShowUpgrade(true)}>Upgrade to Study Mode</ProGateBtn>
                      </ProGateOverlay>
                      <ProGateBlur>
                        {(topicsReady ? topicEntriesFlat.slice(0, 6) : []).map((t) => (
                          <BarRow key={t.key}>
                            <BarLabel><span>{t.label}</span></BarLabel>
                            <BarTrack><BarFill $pct={t.pct} $color="#666" /></BarTrack>
                          </BarRow>
                        ))}
                      </ProGateBlur>
                    </ProGateCard>
                  )
                )}
              </AnalyticsGrid>

              {weakAreas.length > 0 && (
                isPro ? (
                  <FocusCard>
                    <AnalyticsCardTitle>
                      Focus Areas
                      <SetBadge>{analyticsTab === "practice" ? "Practice" : "Exam"}</SetBadge>
                    </AnalyticsCardTitle>
                    {weakAreas.map((w) => (
                      <FocusItem key={`${w.kind}:${w.domainLabel ?? ""}:${w.label}`}>
                        <FocusIcon>{w.pct < 50 ? "⚠" : "○"}</FocusIcon>
                        <FocusText>
                          {w.isOther && w.domainLabel ? (
                            <>Practice more of the {w.domainLabel} domain</>
                          ) : (
                            <>
                              <FocusPercent $color={pctColor(w.pct, theme)}>
                                {w.pct}%
                              </FocusPercent>{" "}
                              accuracy in {w.label}
                              {w.kind === "topic" && w.domainLabel ? ` (${w.domainLabel})` : ""}
                              {" "}&mdash; Practice more{" "}
                              {w.kind === "domain"
                                ? `${w.label} domain questions`
                                : `${w.label} questions`}
                            </>
                          )}
                        </FocusText>
                      </FocusItem>
                    ))}
                  </FocusCard>
                ) : (
                  <ProGateCard>
                    <ProGateOverlay>
                      <ProGateLabel>STUDY MODE</ProGateLabel>
                      <ProGateText>Unlock personalized focus areas & study recommendations</ProGateText>
                      <ProGateBtn onClick={() => setShowUpgrade(true)}>Upgrade to Study Mode</ProGateBtn>
                    </ProGateOverlay>
                    <ProGateBlur>
                      <FocusItem>
                        <FocusIcon>&#x26A0;</FocusIcon>
                        <FocusText>Focus area insights appear here</FocusText>
                      </FocusItem>
                      <FocusItem>
                        <FocusIcon>&#x25CB;</FocusIcon>
                        <FocusText>Personalized recommendations appear here</FocusText>
                      </FocusItem>
                    </ProGateBlur>
                  </ProGateCard>
                )
              )}

              {/* Persistent Wrong-Answer Memory (Pro) */}
              {isPro && persistentWrongIds.length > 0 && (
                <WrongMemoryCard>
                  <WrongMemoryIcon>⚠</WrongMemoryIcon>
                  <WrongMemoryInfo>
                    <WrongMemoryTitle>
                      Persistent Gaps — {persistentWrongIds.length} question{persistentWrongIds.length !== 1 ? "s" : ""}
                    </WrongMemoryTitle>
                    <WrongMemoryDesc>
                      {persistentWrongIds.length} question{persistentWrongIds.length !== 1 ? "s have" : " has"} been answered
                      incorrectly across 2 or more sessions. These are your highest-priority items to review.
                    </WrongMemoryDesc>
                    <WrongMemoryBtn href={`/bank/pmp/practice?count=${Math.min(persistentWrongIds.length, 25)}`}>
                      Retry {Math.min(persistentWrongIds.length, 25)} Questions
                    </WrongMemoryBtn>
                  </WrongMemoryInfo>
                </WrongMemoryCard>
              )}
            </>
          )}
        </AnalyticsSection>
      )}

      {/* ── Recent Attempts ────────────────────────────────────── */}
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
            {(isPro ? submitted : submitted.slice(0, 3)).map((a) => (
              <AttemptCard
                key={a.id}
                onClick={() => router.push(`/dashboard/results/${a.id}`)}
              >
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
                  {a.score_percent !== null ? `${a.score_percent}%` : "—"}
                </ScoreBadge>
                <DeleteBtn
                  onClick={(e) => { e.stopPropagation(); deleteAttempt(a.id); }}
                  title="Delete attempt"
                >
                  ✕
                </DeleteBtn>
              </AttemptCard>
            ))}
          </AttemptList>
          {!isPro && submitted.length > 3 && (
            <HistoryGate>
              <HistoryGateText>
                {submitted.length - 3} older attempt{submitted.length - 3 === 1 ? "" : "s"} hidden.{" "}
                <span>Study Mode unlocks your full attempt history.</span>
              </HistoryGateText>
              <HistoryGateBtn onClick={() => setShowUpgrade(true)}>
                Unlock History
              </HistoryGateBtn>
            </HistoryGate>
          )}
        </>
      )}

      {/* ── Upgrade Modal ──────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradeOverlay onClick={() => setShowUpgrade(false)}>
          <UpgradeModalCard onClick={(e) => e.stopPropagation()}>
            <UpgradeTitle>Upgrade to Study Mode</UpgradeTitle>
            <UpgradeText>
              Most PMP candidates fail because they don&apos;t know where they&apos;re losing marks. Study Mode shows you exactly that.
            </UpgradeText>
            <UpgradeFeature>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Topic-level breakdown — see exactly where you&apos;re losing marks
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                2 more full simulations — Sets B &amp; C (fresh questions)
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Personalized focus areas — top 3 weak spots to fix first
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Full attempt history — track improvement over time
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Extended practice sessions (50 &amp; 90 questions)
              </UpgradeFeatureItem>
            </UpgradeFeature>
            <UpgradePrice>$29</UpgradePrice>
            <UpgradePriceNote>One-time payment · Lifetime access · Less than a practice exam book</UpgradePriceNote>
            <UpgradeModalBtn onClick={startCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Redirecting…" : "Unlock Study Mode"}
            </UpgradeModalBtn>
            <UpgradeConsentNote>
              By purchasing you agree to our{" "}
              <UpgradeConsentLink href="/terms">Terms</UpgradeConsentLink>
              {" "}&amp;{" "}
              <UpgradeConsentLink href="/privacy">Privacy Policy</UpgradeConsentLink>.
              Individual results vary.
            </UpgradeConsentNote>
            <UpgradeCloseBtn onClick={() => setShowUpgrade(false)}>
              Maybe later
            </UpgradeCloseBtn>
          </UpgradeModalCard>
        </UpgradeOverlay>
      )}
    </Wrap>
  );
}
