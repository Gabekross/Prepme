"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { css, keyframes } from "styled-components";
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

/** PMP exam: 180 questions in 230 minutes → ~76.7 seconds per question */
const PMP_SECS_PER_Q = Math.round((230 * 60) / 180);

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const growWidth = keyframes`
  from { width: 0%; }
`;

const popIn = keyframes`
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const confettiFall = keyframes`
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); }
  50%      { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
`;

/* ── styled components ──────────────────────────────────────────────────── */

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

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

const HeroResultIcon = styled.div<{ $pass: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  font-size: 28px;
  background: ${(p) => p.$pass ? p.theme.successSoft : p.theme.errorSoft};
  color: ${(p) => p.$pass ? p.theme.success : p.theme.error};
  animation: ${popIn} 500ms 200ms ease both;
  ${(p) => !p.$pass && css`
    animation: ${popIn} 500ms 200ms ease both, ${pulseGlow} 2s 800ms ease infinite;
  `}
`;

const ConfettiWrap = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
`;

const ConfettiPiece = styled.div<{ $left: number; $delay: number; $color: string }>`
  position: absolute;
  top: -10px;
  left: ${(p) => p.$left}%;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${(p) => p.$color};
  animation: ${confettiFall} 1.5s ${(p) => p.$delay}ms ease forwards;
`;

const HeroCardInner = styled.div<{ $pass: boolean }>`
  position: relative;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.$pass ? p.theme.successBorder : p.theme.errorBorder};
  border-radius: 24px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: ${(p) => p.theme.shadow};
  margin-bottom: 20px;
  animation: ${fadeUp} 400ms 60ms ease both;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: 24px 16px;
  }
`;

const ScoreDelta = styled.div<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  margin-top: 8px;
  background: ${(p) => p.$positive ? p.theme.successSoft : p.theme.errorSoft};
  color: ${(p) => p.$positive ? p.theme.success : p.theme.error};
  animation: ${fadeUp} 500ms 400ms ease both;
`;

const EncouragementText = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.accent};
  margin-top: 12px;
  line-height: 1.5;
  animation: ${fadeUp} 600ms 600ms ease both;
`;

const CONFETTI_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

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

const QList = styled.div`
  display: grid;
  gap: 6px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
  margin-top: 12px;
`;

const QRow = styled(Link)<{ $correct: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${(p) => p.$correct ? p.theme.successSoft : p.theme.errorSoft};
  border: 1px solid ${(p) => p.$correct ? p.theme.successBorder : p.theme.errorBorder};
  font-size: 13px;
  text-decoration: none;
  transition: opacity 150ms ease, transform 100ms ease;
  cursor: pointer;
  &:hover { opacity: 0.8; transform: translateX(2px); }
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

const QDomainGroup = styled.div`
  margin-top: 10px;
  &:first-child { margin-top: 0; }
`;

const QDomainGroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${(p) => p.theme.muted};
  border-bottom: 1px solid ${(p) => p.theme.divider};
  margin-bottom: 6px;
`;

const QFilterRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 12px;
  margin-bottom: 6px;
`;

const QFilterBtn = styled.button<{ $active: boolean }>`
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid ${(p) => p.$active ? p.theme.accent : p.theme.cardBorder};
  background: ${(p) => p.$active ? p.theme.accentSoft : "transparent"};
  color: ${(p) => p.$active ? p.theme.accent : p.theme.muted};
  cursor: pointer;
  transition: all 150ms ease;
  &:hover { opacity: 0.8; }
`;

/* ── time analysis ──────────────────────────────────────────────────────── */

const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 12px;
`;

const TimeStat = styled.div<{ $highlight?: boolean }>`
  text-align: center;
  padding: 12px 8px;
  border-radius: 14px;
  background: ${(p) =>
    p.$highlight
      ? p.theme.warningSoft
      : p.theme.name === "dark"
        ? "rgba(255,255,255,0.03)"
        : "#f8fafc"};
  border: 1px solid ${(p) =>
    p.$highlight ? p.theme.warningBorder : p.theme.cardBorder};
`;

const TimeValue = styled.div<{ $color?: string }>`
  font-size: 20px;
  font-weight: 900;
  color: ${(p) => p.$color ?? p.theme.text};
  letter-spacing: -0.3px;
`;

const TimeLabel = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
  margin-top: 2px;
`;

const PacingNote = styled.div<{ $status: "good" | "slow" | "fast" }>`
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.5;
  background: ${(p) =>
    p.$status === "good"
      ? p.theme.successSoft
      : p.$status === "slow"
        ? p.theme.errorSoft
        : p.theme.warningSoft};
  color: ${(p) =>
    p.$status === "good"
      ? p.theme.success
      : p.$status === "slow"
        ? p.theme.error
        : p.theme.warning};
  border: 1px solid ${(p) =>
    p.$status === "good"
      ? p.theme.successBorder
      : p.$status === "slow"
        ? p.theme.errorBorder
        : p.theme.warningBorder};
`;

const HalfCompare = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
`;

const HalfCard = styled.div`
  background: ${(p) =>
    p.theme.name === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc"};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 12px;
  padding: 10px 12px;
  text-align: center;
`;

const HalfLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 4px;
`;

const HalfValue = styled.div`
  font-size: 17px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
`;

const HalfNote = styled.div`
  font-size: 10.5px;
  color: ${(p) => p.theme.muted};
  margin-top: 2px;
`;

/* ── what to do next ────────────────────────────────────────────────────── */

const NextStepCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.accentSoft};
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: ${(p) => p.theme.shadow};
  animation: ${fadeUp} 400ms 200ms ease both;
`;

const NextStepTitle = styled.h2`
  font-size: 15px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin: 0 0 8px;
  letter-spacing: -0.2px;
`;

const NextStepDesc = styled.p`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.6;
  margin: 0 0 14px;
`;

const NextStepBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 800;
  text-decoration: none;
  background: ${(p) => p.theme.accent};
  color: white;
  transition: opacity 150ms ease;
  &:hover { opacity: 0.85; }
`;

/* ── footer actions ─────────────────────────────────────────────────────── */

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

const ShareBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 150ms ease;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg};
  color: ${(p) => p.theme.text};
  cursor: pointer;

  &:hover { opacity: 0.85; }
`;

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
`;

const EmptyCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 40px 24px;
  text-align: center;
  box-shadow: ${(p) => p.theme.shadow};
  margin-bottom: 20px;
  animation: ${fadeUp} 400ms 60ms ease both;

  @media (max-width: 480px) {
    padding: 32px 16px;
  }
`;

const EmptyTitle = styled.div`
  font-size: 20px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin-bottom: 10px;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  line-height: 1.6;
  max-width: 440px;
  margin: 0 auto 6px;
`;

const CompletionBanner = styled.div`
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  background: ${(p) => p.theme.warningSoft};
  color: ${(p) => p.theme.warning};
  border: 1px solid ${(p) => p.theme.warningBorder};
  animation: ${fadeUp} 400ms 80ms ease both;
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

const UpsellText = styled.div`flex: 1;`;

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
  background: ${(p) => p.theme.accent};
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
  color: ${(p) => p.theme.name === "dark" ? "#94a3b8" : "#64748b"};
  background: ${(p) => p.theme.name === "dark" ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.08)"};
  border: 1px solid ${(p) => p.theme.name === "dark" ? "rgba(148,163,184,0.2)" : "rgba(100,116,139,0.18)"};
  padding: 4px 12px;
  border-radius: 8px;
`;

const ProGateLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
`;

/* ── share modal ────────────────────────────────────────────────────────── */

const ShareOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9000;
  display: grid;
  place-items: center;
  padding: 20px;
  animation: ${fadeUp} 200ms ease both;
`;

const ShareCard = styled.div`
  background: ${(p) => p.theme.name === "dark" ? "#111827" : p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 28px;
  max-width: 400px;
  width: 100%;
  box-shadow: ${(p) => p.theme.shadowLg};
`;

const ShareCardTitle = styled.h3`
  font-size: 16px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin: 0 0 6px;
`;

const ShareCardSub = styled.p`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  margin: 0 0 18px;
  line-height: 1.5;
`;

const SharePreview = styled.pre`
  background: ${(p) =>
    p.theme.name === "dark" ? "rgba(255,255,255,0.04)" : "#f3f5f9"};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 14px;
  padding: 14px 16px;
  font-family: ui-monospace, "Cascadia Code", monospace;
  font-size: 12px;
  line-height: 1.65;
  color: ${(p) => p.theme.text};
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0 0 14px;
  max-height: 220px;
  overflow-y: auto;
`;

const CopyBtn = styled.button`
  width: 100%;
  padding: 11px 20px;
  border-radius: 12px;
  border: none;
  background: ${(p) => p.theme.accent};
  color: white;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 150ms ease;
  margin-bottom: 8px;

  &:hover { opacity: 0.88; }
`;

const ShareCloseBtn = styled.button`
  width: 100%;
  background: none;
  border: none;
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 6px;

  &:hover { color: ${(p) => p.theme.text}; }
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
  const [showTime, setShowTime] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);
  const [qFilter, setQFilter] = useState<"all" | "incorrect" | "unanswered">("incorrect");
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [questionMeta, setQuestionMeta] = useState<Map<string, { domain: Domain; tags: string[] }>>(
    new Map()
  );
  const [prevScore, setPrevScore] = useState<number | null>(null);

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

  useEffect(() => {
    if (!attempt || !user) return;
    (async () => {
      try {
        const { data } = await sb
          .from("attempts")
          .select("score_percent")
          .eq("user_id", user.id)
          .eq("bank_slug", attempt.bank_slug)
          .eq("mode", attempt.mode)
          .eq("status", "submitted")
          .neq("id", attempt.id)
          .not("score_percent", "is", null)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.score_percent != null) setPrevScore(data.score_percent);
      } catch { /* non-critical */ }
    })();
  }, [attempt, user, sb]);

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
    return () => { cancelled = true; };
  }, [attempt?.bank_slug]);

  const topicEntries = useMemo(() => {
    const sr = attempt?.result?.scoreResults;
    if (!sr || sr.length === 0 || questionMeta.size === 0) return [];

    const topicIndex = buildTopicIndex();
    const buckets: Record<
      string,
      { domain: Domain; label: string; correct: number; total: number }
    > = {};

    for (const s of sr) {
      // Skip unanswered questions (maxScore === 0)
      if (s.maxScore === 0) continue;
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
        const dd = (domOrder[a.domain] ?? 9) - (domOrder[b.domain] ?? 9);
        if (dd !== 0) return dd;
        if (a.isOther !== b.isOther) return a.isOther ? 1 : -1;
        return b.total - a.total;
      });
  }, [attempt, questionMeta]);

  if (authLoading || loading) return <P>Loading results...</P>;
  if (error) return <P>{error}</P>;
  if (!attempt) return <P>Attempt not found.</P>;

  const rawResult = attempt.result;
  const result = rawResult && Array.isArray(rawResult.scoreResults) ? rawResult : null;
  const hasScoring = result !== null && attempt.total_score !== null;
  const passed = attempt.passed ?? false;
  const scorePercent = attempt.score_percent ?? 0;
  const modeLabel = attempt.mode === "exam" ? "Exam Simulation" : "Practice Session";

  const questionCount = attempt.state?.questionOrder?.length ?? 0;
  const totalPoints = result ? result.totalScore : (attempt.total_score ?? 0);
  const maxPoints = result ? result.maxScore : (attempt.max_score ?? 0);

  // Only count attempted questions (maxScore > 0) for correct/incorrect
  const correctCount = result
    ? result.scoreResults.filter((sr: any) => sr.maxScore > 0 && sr.isCorrect).length
    : 0;
  const incorrectCount = result
    ? result.scoreResults.filter((sr: any) => sr.maxScore > 0 && !sr.isCorrect).length
    : 0;

  // Answered vs unanswered tracking
  // New results have explicit answeredCount; legacy results fall back to
  // counting scoreResults with maxScore > 0 (attempted questions).
  const answeredCount: number =
    result && typeof (result as any).answeredCount === "number"
      ? (result as any).answeredCount
      : result
        ? result.scoreResults.filter((sr: any) => sr.maxScore > 0).length
        : 0;
  const unansweredCount: number =
    result && typeof (result as any).unansweredCount === "number"
      ? (result as any).unansweredCount
      : questionCount - answeredCount;
  const isEmptyAttempt = answeredCount === 0;
  const completionPct = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0;
  const isPartialAttempt = answeredCount > 0 && completionPct < 80;

  // Time stats
  const timeSpent: Record<string, number> = attempt.state?.timeSpentMsByQuestionId ?? {};
  const totalTimeMs = Object.values(timeSpent).reduce((a: number, b: number) => a + b, 0);
  const avgTimeMs = questionCount > 0 ? totalTimeMs / questionCount : 0;
  const maxTimeMs = Object.values(timeSpent).length
    ? Math.max(...Object.values(timeSpent).map(Number))
    : 0;

  // Pacing: compare against PMP standard
  const avgSecsPerQ = avgTimeMs / 1000;
  const pacingRatio = PMP_SECS_PER_Q > 0 ? avgSecsPerQ / PMP_SECS_PER_Q : 1;
  const pacingStatus: "good" | "slow" | "fast" =
    pacingRatio > 1.3 ? "slow" : pacingRatio < 0.5 ? "fast" : "good";
  const pacingMsg =
    pacingStatus === "slow"
      ? `Your avg of ${formatMs(avgTimeMs)}/question is above the PMP target of ${formatMs(PMP_SECS_PER_Q * 1000)}. You need to increase your pace or you'll run out of time on exam day.`
      : pacingStatus === "fast"
        ? `You're answering much faster than the PMP target (${formatMs(PMP_SECS_PER_Q * 1000)}/q). Fast can mean efficient — but make sure you're not rushing through careful scenarios.`
        : `Good pace. Your avg of ${formatMs(avgTimeMs)}/question is within the PMP target of ${formatMs(PMP_SECS_PER_Q * 1000)}/question.`;

  // First-half vs. second-half timing
  const questionOrder: string[] = attempt.state?.questionOrder ?? [];
  const halfIdx = Math.floor(questionOrder.length / 2);
  const firstHalfIds = questionOrder.slice(0, halfIdx);
  const secondHalfIds = questionOrder.slice(halfIdx);
  const firstHalfMs = firstHalfIds.reduce((s: number, id: string) => s + (timeSpent[id] ?? 0), 0);
  const secondHalfMs = secondHalfIds.reduce((s: number, id: string) => s + (timeSpent[id] ?? 0), 0);
  const firstHalfAvg = firstHalfIds.length > 0 ? firstHalfMs / firstHalfIds.length : 0;
  const secondHalfAvg = secondHalfIds.length > 0 ? secondHalfMs / secondHalfIds.length : 0;
  const paceShift =
    firstHalfAvg > 0 && secondHalfAvg > 0
      ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
      : null;

  const passThreshold = attempt.state?.blueprint?.passThreshold ?? 70;

  // Share summary text
  const domainLines =
    result
      ? (
          Object.entries(result.byDomain) as [string, { correct: number; total: number }][]
        )
          .filter(([, d]) => d.total > 0)
          .map(([domain, d]) => {
            const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
            return `  ${DOMAIN_LABELS[domain] ?? domain}: ${pct}% (${d.correct}/${d.total})`;
          })
          .join("\n")
      : "";

  const shareText = [
    "🎯 PMP Mastery Lab Results",
    "━".repeat(28),
    `Result: ${passed ? "PASSED ✓" : "NOT PASSED ✗"} (${scorePercent}%)`,
    `${modeLabel}${setLabel(attempt.set_id)}`,
    attempt.submitted_at
      ? `Date: ${new Date(attempt.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : "",
    "",
    ...(domainLines ? ["Domain Scores:", domainLines] : []),
    "",
    "Prepare with me at pmpmasterylab.com",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text
    }
  }

  return (
    <Wrap>
      <Breadcrumb>
        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <span>Results</span>
      </Breadcrumb>

      {/* ── Missing scoring data — attempt submitted before scoring fix ── */}
      {!hasScoring && attempt.submitted_at && (
        <>
          <SectionCard $delay={100}>
            <SectionTitle>Scoring Unavailable</SectionTitle>
            <P>
              This attempt was submitted before a recent update and does not have
              detailed scoring data. Retake the exam to see a full score breakdown.
            </P>
          </SectionCard>
          <ActionRow>
            <PrimaryAction href={`/bank/${attempt.bank_slug}`}>
              Retake Exam
            </PrimaryAction>
            <SecondaryAction href="/dashboard">
              Back to Dashboard
            </SecondaryAction>
          </ActionRow>
        </>
      )}

      {/* ── Empty attempt state ──────────────────────────────── */}
      {isEmptyAttempt && hasScoring && (
        <>
          <EmptyCard>
            <EmptyTitle>No Questions Answered</EmptyTitle>
            <EmptySubtext>
              Your exam was submitted without any responses, so no performance
              analysis is available. This can happen if the timer expired before
              you started or if you submitted immediately.
            </EmptySubtext>
            {attempt.submitted_at && (
              <HeroMeta>{formatDate(attempt.submitted_at)}</HeroMeta>
            )}
          </EmptyCard>

          <ActionRow>
            <PrimaryAction href={`/bank/${attempt.bank_slug}`}>
              Retake Exam
            </PrimaryAction>
            <SecondaryAction href="/dashboard">
              Back to Dashboard
            </SecondaryAction>
            <SecondaryAction href={`/bank/${attempt.bank_slug}/practice/intro`}>
              Start Practice
            </SecondaryAction>
          </ActionRow>
        </>
      )}

      {/* ── Normal results (answered at least 1 question) ─────── */}
      {!isEmptyAttempt && (
        <>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <HeroCardInner $pass={passed}>
        {passed && (
          <ConfettiWrap>
            {Array.from({ length: 24 }).map((_, i) => (
              <ConfettiPiece
                key={i}
                $left={4 + Math.round((i / 24) * 92)}
                $delay={i * 60}
                $color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
              />
            ))}
          </ConfettiWrap>
        )}
        <HeroResultIcon $pass={passed}>
          {passed ? "🎉" : "💪"}
        </HeroResultIcon>
        <HeroLabel $pass={passed}>
          {passed ? "Passed" : "Not Passed"}
        </HeroLabel>
        <HeroScore>{scorePercent}%</HeroScore>
        {prevScore !== null && (() => {
          const delta = scorePercent - prevScore;
          if (delta === 0) return null;
          return (
            <ScoreDelta $positive={delta > 0}>
              {delta > 0 ? `+${delta}%` : `${delta}%`} from last attempt
            </ScoreDelta>
          );
        })()}
        <HeroSubtext>
          {modeLabel}{setLabel(attempt.set_id)}
          {passed
            ? ` — Congratulations! You passed with ${scorePercent}%.`
            : ` — You need ${passThreshold}% to pass.`}
        </HeroSubtext>
        {!passed && (
          <EncouragementText>
            {scorePercent >= 60
              ? `You're close! Focus on your weakest domain and you'll get there.`
              : `Every PMP candidate starts somewhere. Review your results below and target the gaps.`}
          </EncouragementText>
        )}
        {attempt.submitted_at && (
          <HeroMeta>{formatDate(attempt.submitted_at)}</HeroMeta>
        )}
      </HeroCardInner>

      {/* ── Completion warning for partial attempts ────────────── */}
      {isPartialAttempt && (
        <CompletionBanner>
          You answered {answeredCount} of {questionCount} questions ({completionPct}% completion).
          {unansweredCount > 0
            ? ` The ${unansweredCount} unanswered question${unansweredCount === 1 ? " is" : "s are"} scored as incorrect.`
            : ""}
        </CompletionBanner>
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
      {hasScoring && (
        <StatGrid>
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
        </StatGrid>
      )}

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

      {/* ── Pro upsell for free users ────────────────────────── */}
      {!isPro && attempt.mode === "exam" && (() => {
        const gap = passThreshold - scorePercent;
        let title: string;
        let sub: string;
        if (!passed) {
          title = `You're ${gap} point${gap === 1 ? "" : "s"} away from passing`;
          sub = `Topic-level breakdown shows exactly which topics are costing you marks. Unlock it, fix the gaps, and run Set B to confirm you're ready.`;
        } else if (scorePercent < 75) {
          title = "You passed Set A — but are you ready for the real thing?";
          sub = `Sets B & C use different question patterns. See your topic-level weak spots now so they don't surprise you on exam day.`;
        } else {
          title = "Strong result. Make sure it wasn't luck.";
          sub = `Verify your readiness across 2 more full simulations and get a topic-level mastery report before you book your exam date.`;
        }
        return (
          <UpsellBanner>
            <UpsellText>
              <UpsellTitle>{title}</UpsellTitle>
              <UpsellSub>{sub}</UpsellSub>
            </UpsellText>
            <UpsellBtn onClick={startCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Redirecting…" : "Unlock Premium — $59.99/year"}
            </UpsellBtn>
          </UpsellBanner>
        );
      })()}

      {/* ── What To Do Next ──────────────────────────────────── */}
      {result && (() => {
        const domainScores = (Object.entries(result.byDomain) as [string, { correct: number; total: number }][])
          .filter(([, d]) => d.total > 0)
          .map(([domain, d]) => ({
            domain,
            label: DOMAIN_LABELS[domain] ?? domain,
            pct: Math.round((d.correct / d.total) * 100),
          }))
          .sort((a, b) => a.pct - b.pct);
        const weakest = domainScores[0];
        if (!weakest) return null;

        const action = passed
          ? {
              title: "Solidify Your Strengths",
              desc: `Great result! Your weakest area was ${weakest.label} at ${weakest.pct}%. A targeted practice session will help lock in your knowledge before exam day.`,
            }
          : {
              title: "Your Next Step",
              desc: `Focus on ${weakest.label} — your weakest domain at ${weakest.pct}%. A targeted practice session here will have the biggest impact on your score.`,
            };

        return (
          <NextStepCard>
            <NextStepTitle>{action.title}</NextStepTitle>
            <NextStepDesc>{action.desc}</NextStepDesc>
            <NextStepBtn href={`/bank/${attempt.bank_slug}/practice?count=25&domain=${weakest.domain}`}>
              Practice {weakest.label} Questions
            </NextStepBtn>
          </NextStepCard>
        );
      })()}

      {/* ── Topic Breakdown ─────────────────────────────────── */}
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
              <ProGateBadge>&#x1f512; Locked</ProGateBadge>
              <ProGateLabel>Unlock per-topic breakdown</ProGateLabel>
              <UpsellBtn onClick={startCheckout} style={{ marginTop: 4 }}>Unlock Access</UpsellBtn>
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

      {/* ── Time Analysis (enhanced with pacing) ─────────────── */}
      {totalTimeMs > 0 && (
        <SectionCard $delay={280}>
          <SectionToggleBtn onClick={() => setShowTime((v) => !v)}>
            Time Analysis
            <SectionArrow $open={showTime}>▼</SectionArrow>
          </SectionToggleBtn>
          {showTime && (
            <>
              <TimeGrid>
                <TimeStat>
                  <TimeValue>{formatMs(totalTimeMs)}</TimeValue>
                  <TimeLabel>Total Time</TimeLabel>
                </TimeStat>
                <TimeStat $highlight={pacingStatus === "slow"}>
                  <TimeValue $color={pacingStatus === "slow" ? undefined : undefined}>
                    {formatMs(avgTimeMs)}
                  </TimeValue>
                  <TimeLabel>Avg / Question</TimeLabel>
                </TimeStat>
                <TimeStat>
                  <TimeValue>{formatMs(PMP_SECS_PER_Q * 1000)}</TimeValue>
                  <TimeLabel>PMP Target / Q</TimeLabel>
                </TimeStat>
                <TimeStat>
                  <TimeValue>{formatMs(maxTimeMs)}</TimeValue>
                  <TimeLabel>Longest Question</TimeLabel>
                </TimeStat>
              </TimeGrid>

              {/* Pacing assessment */}
              <PacingNote $status={pacingStatus}>{pacingMsg}</PacingNote>

              {/* First-half vs second-half comparison */}
              {paceShift !== null && questionOrder.length >= 10 && (
                <>
                  <HalfCompare>
                    <HalfCard>
                      <HalfLabel>First Half</HalfLabel>
                      <HalfValue>{formatMs(firstHalfAvg)}</HalfValue>
                      <HalfNote>avg / question</HalfNote>
                    </HalfCard>
                    <HalfCard>
                      <HalfLabel>Second Half</HalfLabel>
                      <HalfValue>{formatMs(secondHalfAvg)}</HalfValue>
                      <HalfNote>avg / question</HalfNote>
                    </HalfCard>
                  </HalfCompare>
                  {Math.abs(paceShift) >= 15 && (
                    <PacingNote $status={paceShift > 0 ? "slow" : "fast"} style={{ marginTop: 8 }}>
                      {paceShift > 0
                        ? `You slowed down ${paceShift}% in the second half — possible fatigue or harder questions.`
                        : `You sped up ${Math.abs(paceShift)}% in the second half. Make sure you weren't rushing near the end.`}
                    </PacingNote>
                  )}
                </>
              )}
            </>
          )}
        </SectionCard>
      )}

      {/* ── Question-by-Question ────────────────────────────── */}
      {result && answeredCount > 0 && (
        <SectionCard $delay={340}>
          <SectionToggleBtn onClick={() => setShowQuestions((v) => !v)}>
            Question Breakdown ({correctCount} of {answeredCount} correct)
            <SectionArrow $open={showQuestions}>▼</SectionArrow>
          </SectionToggleBtn>
          {showQuestions && (
            <>
              <QFilterRow>
                <QFilterBtn $active={qFilter === "incorrect"} onClick={() => setQFilter("incorrect")}>
                  Incorrect ({incorrectCount})
                </QFilterBtn>
                <QFilterBtn $active={qFilter === "all"} onClick={() => setQFilter("all")}>
                  All ({answeredCount})
                </QFilterBtn>
                {unansweredCount > 0 && (
                  <QFilterBtn $active={qFilter === "unanswered"} onClick={() => setQFilter("unanswered")}>
                    Unanswered ({unansweredCount})
                  </QFilterBtn>
                )}
              </QFilterRow>
              <QList>
                {(() => {
                  const indexed = result.scoreResults.map((sr, idx) => ({ sr, idx }));
                  const filtered = indexed.filter(({ sr }) => {
                    if (qFilter === "incorrect") return sr.maxScore > 0 && !sr.isCorrect;
                    if (qFilter === "unanswered") return sr.maxScore === 0;
                    return sr.maxScore > 0;
                  });

                  const domOrder: Record<string, number> = { people: 0, process: 1, business_environment: 2 };
                  const groups: Record<string, { label: string; order: number; items: typeof filtered }> = {};

                  for (const item of filtered) {
                    const meta = questionMeta.get(item.sr.questionId);
                    const domain = meta?.domain ?? "unknown";
                    const label = DOMAIN_LABELS[domain] ?? "Other";
                    if (!groups[domain]) {
                      groups[domain] = { label, order: domOrder[domain] ?? 9, items: [] };
                    }
                    groups[domain].items.push(item);
                  }

                  const sorted = Object.values(groups).sort((a, b) => a.order - b.order);

                  if (sorted.length === 0) {
                    return <QDomain style={{ padding: "12px 0", textAlign: "center" }}>No questions match this filter.</QDomain>;
                  }

                  return sorted.map((g) => (
                    <QDomainGroup key={g.label}>
                      <QDomainGroupHeader>
                        <span>{g.label}</span>
                        <span>{g.items.filter(i => i.sr.isCorrect).length}/{g.items.length}</span>
                      </QDomainGroupHeader>
                      {g.items.map(({ sr, idx }) => (
                        <QRow
                          key={sr.questionId}
                          $correct={sr.isCorrect}
                          href={`/dashboard/results/${attemptId}/review?q=${idx}`}
                        >
                          <QIcon $correct={sr.isCorrect}>
                            {sr.isCorrect ? "✓" : "✗"}
                          </QIcon>
                          <QNumber>Q{idx + 1}</QNumber>
                          <QDomain>
                            {sr.score}/{sr.maxScore} pts
                            {timeSpent[sr.questionId]
                              ? ` · ${formatMs(timeSpent[sr.questionId])}`
                              : ""}
                          </QDomain>
                        </QRow>
                      ))}
                    </QDomainGroup>
                  ));
                })()}
              </QList>
            </>
          )}
        </SectionCard>
      )}

      {/* ── Review & Actions ──────────────────────────────── */}
      <ActionRow>
        <PrimaryAction href={`/dashboard/results/${attemptId}/review`}>
          Review All Questions
        </PrimaryAction>
        {incorrectCount > 0 && (
          <SecondaryAction href={`/dashboard/results/${attemptId}/review?filter=incorrect`}>
            Review Incorrect ({incorrectCount})
          </SecondaryAction>
        )}
        {unansweredCount > 0 && (
          <SecondaryAction href={`/dashboard/results/${attemptId}/review?filter=unanswered`}>
            Review Unanswered ({unansweredCount})
          </SecondaryAction>
        )}
      </ActionRow>

      <ActionRow>
        <SecondaryAction href={`/bank/${attempt.bank_slug}`}>
          Retake Exam
        </SecondaryAction>
        <SecondaryAction href="/dashboard">
          Back to Dashboard
        </SecondaryAction>
        <ShareBtn onClick={() => setShowShare(true)}>
          Share Results
        </ShareBtn>
      </ActionRow>

      </>
      )}
      {/* end of !isEmptyAttempt wrapper */}

      {/* ── Share Modal ─────────────────────────────────────── */}
      {showShare && (
        <ShareOverlay onClick={() => setShowShare(false)}>
          <ShareCard onClick={(e) => e.stopPropagation()}>
            <ShareCardTitle>Share Your Results</ShareCardTitle>
            <ShareCardSub>
              Copy this summary and share it anywhere — study groups, LinkedIn, or your notes.
            </ShareCardSub>
            <SharePreview>{shareText}</SharePreview>
            <CopyBtn onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </CopyBtn>
            <ShareCloseBtn onClick={() => setShowShare(false)}>
              Close
            </ShareCloseBtn>
          </ShareCard>
        </ShareOverlay>
      )}
    </Wrap>
  );
}
