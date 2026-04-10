"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { Blueprint, Domain, Question, Scenario, Response } from "../core/types";
import { useExamSession } from "../hooks/useExamSession";
import { QuestionRenderer } from "./QuestionRenderer";
import { scoreAttempt, scoreQuestion } from "../core/scoring";
import { LocalAttemptStorage } from "../core/storage";
import { computeAdaptiveSummary, type AdaptiveSummary } from "../core/analytics";
import { AdaptiveResults } from "./AdaptiveResults";

/* ── animations ─────────────────────────────────────────────────────────── */

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── layout ─────────────────────────────────────────────────────────────── */

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  align-items: start;

  @media (min-width: 980px) {
    grid-template-columns: 280px 1fr;
    gap: 20px;
  }
`;

const RightCol = styled.div`
  display: grid;
  gap: 16px;
`;

/* ── shared card ─────────────────────────────────────────────────────────── */

const Card = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 18px;
  box-shadow: ${(p) => p.theme.shadow};
  position: relative;
  overflow: hidden;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;

  @media (min-width: 480px) {
    padding: 20px;
  }

  &::before {
    content: "";
    position: absolute;
    top: -60px;
    right: -60px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle at center, ${(p) => p.theme.accentSoft}, transparent 70%);
    pointer-events: none;
  }
`;

/* ── sidebar ─────────────────────────────────────────────────────────────── */

const SideTitle = styled.h1`
  font-size: 15px;
  font-weight: 800;
  margin: 0 0 4px;
  letter-spacing: -0.2px;
  color: ${(p) => p.theme.text};
  line-height: 1.35;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const SideSubtitle = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 12.5px;
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const ModeBadge = styled.div<{ $mode: "practice" | "exam" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  margin-top: 12px;
  background: ${(p) =>
    p.$mode === "practice" ? p.theme.successSoft : p.theme.accentSoft};
  color: ${(p) =>
    p.$mode === "practice" ? p.theme.success : p.theme.accent};
  border: 1px solid ${(p) =>
    p.$mode === "practice" ? p.theme.successBorder : `${p.theme.accent}33`};
`;

/* ── progress ────────────────────────────────────────────────────────────── */

const ProgressSection = styled.div`
  margin-top: 16px;
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ProgressLabel = styled.div`
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
`;

const ProgressCounter = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
`;

const ProgressTrack = styled.div`
  height: 6px;
  background: ${(p) => p.theme.divider};
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number; $mode: "practice" | "exam" }>`
  height: 100%;
  border-radius: 999px;
  width: ${(p) => p.$pct}%;
  background: ${(p) =>
    p.$mode === "practice"
      ? `linear-gradient(90deg, ${p.theme.success}, #06b6d4)`
      : `linear-gradient(90deg, ${p.theme.accent}, #7c3aed)`};
  transition: width 300ms ease;
`;

/* ── stats ───────────────────────────────────────────────────────────────── */

const Divider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.divider};
  margin: 14px 0;
`;

const SectionTitle = styled.div`
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
  margin-bottom: 10px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  min-width: 0;
`;

const StatBox = styled.div<{ $variant?: "success" | "error" | "neutral" }>`
  border: 1px solid ${(p) =>
    p.$variant === "success"
      ? p.theme.successBorder
      : p.$variant === "error"
      ? p.theme.errorBorder
      : p.theme.cardBorder};
  background: ${(p) =>
    p.$variant === "success"
      ? p.theme.successSoft
      : p.$variant === "error"
      ? p.theme.errorSoft
      : p.theme.name === "dark"
      ? "rgba(255,255,255,0.03)"
      : "#f8fafc"};
  border-radius: 14px;
  padding: 10px 12px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
`;

const StatValue = styled.div<{ $variant?: "success" | "error" | "neutral" }>`
  margin-top: 4px;
  font-size: 20px;
  font-weight: 900;
  color: ${(p) =>
    p.$variant === "success"
      ? p.theme.success
      : p.$variant === "error"
      ? p.theme.error
      : p.theme.text};
  letter-spacing: -0.3px;
`;

/* ── filter ──────────────────────────────────────────────────────────────── */

const FilterLabel = styled.div`
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 9px 36px 9px 12px;
  font-size: 13.5px;
  outline: none;
  font-weight: 600;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: border-color 150ms ease;

  &:focus {
    border-color: ${(p) => p.theme.accent};
  }
`;

/* ── navigation buttons ──────────────────────────────────────────────────── */

const NavRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const NavBtn = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  border-radius: 12px;
  border: 1px solid ${(p) =>
    p.$primary
      ? "transparent"
      : p.$danger
      ? p.theme.errorBorder
      : p.theme.buttonBorder};
  background: ${(p) =>
    p.$primary
      ? p.theme.accent
      : p.$danger
      ? p.theme.errorSoft
      : p.theme.buttonBg};
  color: ${(p) =>
    p.$primary
      ? p.theme.accentText
      : p.$danger
      ? p.theme.error
      : p.theme.text};
  padding: 10px 16px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease, transform 100ms ease, opacity 150ms ease;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$primary
        ? p.theme.accentHover
        : p.$danger
        ? p.theme.errorBorder
        : p.theme.buttonHover};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PrimaryBtn = styled.button<{ $mode: "practice" | "exam" }>`
  flex: 1;
  min-width: 120px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: ${(p) =>
    p.$mode === "practice"
      ? p.theme.success
      : p.theme.accent};
  color: ${(p) => p.theme.accentText};
  padding: 10px 20px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease, opacity 150ms ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$mode === "practice"
        ? "#15803d"
        : p.theme.accentHover};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const LearnMoreBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 6px;
  text-align: center;
  transition: background 150ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

/* ── flag button ─────────────────────────────────────────────────────────── */

const FlagBtn = styled.button<{ $flagged?: boolean }>`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(p) => p.$flagged ? p.theme.warningBorder : p.theme.buttonBorder};
  background: ${(p) => p.$flagged ? p.theme.warningSoft : p.theme.buttonBg};
  color: ${(p) => p.$flagged ? p.theme.warning : p.theme.mutedStrong};
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 6px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;

  &:hover {
    background: ${(p) => p.$flagged ? p.theme.warningBorder : p.theme.buttonHover};
  }
`;

/* ── question jump grid ──────────────────────────────────────────────────── */

const QGridWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const QGridBtn = styled.button<{ $state: "current" | "answered" | "flagged" | "unanswered" | "correct" | "incorrect" }>`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 120ms ease, transform 80ms ease;
  flex-shrink: 0;
  border: 1.5px solid ${(p) =>
    p.$state === "current"   ? p.theme.accent
    : p.$state === "correct"   ? p.theme.successBorder
    : p.$state === "answered"  ? p.theme.successBorder
    : p.$state === "incorrect" ? p.theme.errorBorder
    : p.$state === "flagged"   ? p.theme.warningBorder
    : p.theme.buttonBorder};
  background: ${(p) =>
    p.$state === "current"   ? p.theme.accent
    : p.$state === "correct"   ? p.theme.successSoft
    : p.$state === "answered"  ? p.theme.successSoft
    : p.$state === "incorrect" ? p.theme.errorSoft
    : p.$state === "flagged"   ? p.theme.warningSoft
    : p.theme.buttonBg};
  color: ${(p) =>
    p.$state === "current"   ? p.theme.accentText
    : p.$state === "correct"   ? p.theme.success
    : p.$state === "answered"  ? p.theme.success
    : p.$state === "incorrect" ? p.theme.error
    : p.$state === "flagged"   ? p.theme.warning
    : p.theme.muted};

  &:hover {
    transform: scale(1.12);
  }
`;

/* ── mobile bottom nav ───────────────────────────────────────────────────── */

const MobileNavBar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (min-width: 980px) {
    display: none;
  }
`;

/* ── timer ───────────────────────────────────────────────────────────────── */

const TimerBlock = styled.div<{ $warning: "none" | "low" | "critical" }>`
  border-radius: 14px;
  border: 1px solid ${(p) =>
    p.$warning === "critical"
      ? p.theme.errorBorder
      : p.$warning === "low"
      ? p.theme.warningBorder
      : p.theme.cardBorder};
  background: ${(p) =>
    p.$warning === "critical"
      ? p.theme.errorSoft
      : p.$warning === "low"
      ? p.theme.warningSoft
      : p.theme.name === "dark"
      ? "rgba(255,255,255,0.04)"
      : "#f8fafc"};
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
  transition: background 400ms ease, border-color 400ms ease;
`;

const TimerLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
`;

const TimerValue = styled.div<{ $warning: "none" | "low" | "critical" }>`
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  color: ${(p) =>
    p.$warning === "critical"
      ? p.theme.error
      : p.$warning === "low"
      ? p.theme.warning
      : p.theme.text};
`;

/* ── unanswered badge ─────────────────────────────────────────────────────── */

const UnansweredRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
`;

const UnansweredBadge = styled.div<{ $urgent: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  background: ${(p) => p.$urgent ? p.theme.errorSoft : p.theme.name === "dark" ? "rgba(255,255,255,0.06)" : "#f1f5f9"};
  color: ${(p) => p.$urgent ? p.theme.error : p.theme.muted};
  border: 1px solid ${(p) => p.$urgent ? p.theme.errorBorder : p.theme.cardBorder};
`;

/* ── grid legend ─────────────────────────────────────────────────────────── */

const GridLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 8px;
`;

const GridLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
`;

const GridLegendDot = styled.div<{ $color: string; $border: string }>`
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: ${(p) => p.$color};
  border: 1.5px solid ${(p) => p.$border};
  flex-shrink: 0;
`;

/* ── submit confirm dialog ───────────────────────────────────────────────── */

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  animation: ${slideIn} 180ms ease both;
`;

const ConfirmCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 28px 24px 24px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
  width: 100%;
  max-width: 420px;
`;

const ConfirmTitle = styled.div`
  font-size: 18px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.3px;
  margin-bottom: 6px;
`;

const ConfirmSubtitle = styled.div`
  font-size: 13.5px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 20px;
  line-height: 1.5;
`;

const ConfirmStatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
`;

const ConfirmStat = styled.div<{ $variant?: "success" | "error" | "warning" | "neutral" }>`
  border-radius: 14px;
  padding: 12px 10px;
  text-align: center;
  background: ${(p) =>
    p.$variant === "success" ? p.theme.successSoft
    : p.$variant === "error" ? p.theme.errorSoft
    : p.$variant === "warning" ? p.theme.warningSoft
    : p.theme.name === "dark" ? "rgba(255,255,255,0.04)" : "#f8fafc"};
  border: 1px solid ${(p) =>
    p.$variant === "success" ? p.theme.successBorder
    : p.$variant === "error" ? p.theme.errorBorder
    : p.$variant === "warning" ? p.theme.warningBorder
    : p.theme.cardBorder};
`;

const ConfirmStatValue = styled.div<{ $variant?: "success" | "error" | "warning" | "neutral" }>`
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.4px;
  color: ${(p) =>
    p.$variant === "success" ? p.theme.success
    : p.$variant === "error" ? p.theme.error
    : p.$variant === "warning" ? p.theme.warning
    : p.theme.text};
`;

const ConfirmStatLabel = styled.div`
  font-size: 10.5px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
  margin-top: 3px;
  letter-spacing: 0.2px;
`;

const ConfirmActions = styled.div`
  display: grid;
  gap: 8px;
`;

const ConfirmSubmitBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid transparent;
  background: ${(p) => p.theme.accent};
  color: ${(p) => p.theme.accentText};
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;

  &:hover {
    background: ${(p) => p.theme.accentHover};
    transform: translateY(-1px);
  }
`;

const ConfirmCancelBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const ConfirmReviewBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.warningBorder};
  background: ${(p) => p.theme.warningSoft};
  color: ${(p) => p.theme.warning};
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: ${(p) => p.theme.warningBorder};
  }
`;

/* ── explanation card ────────────────────────────────────────────────────── */

const ExplanationCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 20px;
  box-shadow: ${(p) => p.theme.shadow};
  animation: ${slideIn} 280ms ease both;
`;

const ExplanationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const ExplanationIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  display: grid;
  place-items: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const ExplanationTitle = styled.div`
  font-weight: 800;
  font-size: 14px;
  color: ${(p) => p.theme.text};
`;

const ExplanationSubtitle = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
`;

const ExplanationBody = styled.div`
  color: ${(p) => p.theme.text};
  font-size: 14px;
  line-height: 1.70;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  border-top: 1px solid ${(p) => p.theme.divider};
  padding-top: 12px;
  overflow: auto;
  max-height: 480px;
`;

/* ── exam results ────────────────────────────────────────────────────────── */

const ResultsHero = styled.div<{ $pass: boolean }>`
  text-align: center;
  padding: 24px 16px;
  border-bottom: 1px solid ${(p) => p.theme.divider};
  margin-bottom: 16px;
`;

const ResultsIcon = styled.div<{ $pass: boolean }>`
  font-size: 40px;
  margin-bottom: 10px;
`;

const ResultsScore = styled.div`
  font-size: 40px;
  font-weight: 900;
  letter-spacing: -1px;
  color: ${(p) => p.theme.text};
`;

const ResultsSubtext = styled.div`
  font-size: 13.5px;
  color: ${(p) => p.theme.muted};
  margin-top: 6px;
`;

const ResultsStatRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const ResultsStatBox = styled.div<{ $variant?: "success" | "error" | "neutral" }>`
  border: 1px solid ${(p) =>
    p.$variant === "success"
      ? p.theme.successBorder
      : p.$variant === "error"
      ? p.theme.errorBorder
      : p.theme.cardBorder};
  background: ${(p) =>
    p.$variant === "success"
      ? p.theme.successSoft
      : p.$variant === "error"
      ? p.theme.errorSoft
      : p.theme.name === "dark"
      ? "rgba(255,255,255,0.03)"
      : "#f8fafc"};
  border-radius: 14px;
  padding: 12px;
  text-align: center;
`;

const ResultsStatValue = styled.div<{ $variant?: "success" | "error" | "neutral" }>`
  font-size: 22px;
  font-weight: 900;
  color: ${(p) =>
    p.$variant === "success"
      ? p.theme.success
      : p.$variant === "error"
      ? p.theme.error
      : p.theme.text};
  letter-spacing: -0.4px;
`;

const ResultsStatLabel = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
  margin-top: 3px;
`;

const DomainTable = styled.div`
  display: grid;
  gap: 6px;
  margin-top: 4px;
`;

const DomainRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 48px 52px;
  gap: 8px;
  align-items: center;
  font-size: 12.5px;
`;

const DomainName = styled.div`
  color: ${(p) => p.theme.text};
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DomainScore = styled.div`
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const DomainPct = styled.div<{ $pass: boolean }>`
  font-weight: 800;
  color: ${(p) => p.$pass ? p.theme.success : p.theme.error};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const DomainTrack = styled.div`
  grid-column: 1 / -1;
  height: 4px;
  background: ${(p) => p.theme.divider};
  border-radius: 999px;
  overflow: hidden;
  margin-top: -4px;
  margin-bottom: 2px;
`;

const DomainFill = styled.div<{ $pct: number; $pass: boolean }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  border-radius: 999px;
  background: ${(p) => p.$pass ? p.theme.success : p.theme.error};
  transition: width 600ms ease;
`;

const SubmittedAt = styled.div`
  font-size: 11.5px;
  color: ${(p) => p.theme.muted};
  margin-top: 4px;
  font-weight: 500;
`;

const FilterToggleRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const FilterToggle = styled.label<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: ${(p) => p.$active ? p.theme.accent : p.theme.text};
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.$active ? p.theme.accent : p.theme.buttonBorder};
  background: ${(p) => p.$active ? p.theme.accentSoft : p.theme.buttonBg};
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
`;

const FilterToggleBox = styled.input`
  width: 14px;
  height: 14px;
  accent-color: ${(p) => p.theme.accent};
  cursor: pointer;
`;

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: ${(p) => p.theme.text};
  font-weight: 700;
  cursor: pointer;
  user-select: none;
`;

const ToggleBox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${(p) => p.theme.accent};
  cursor: pointer;
`;

const ReviewList = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 12px;
`;

const ReviewItem = styled.button<{ $ok: boolean }>`
  width: 100%;
  text-align: left;
  border-radius: 14px;
  border: 1px solid ${(p) =>
    p.$ok ? p.theme.successBorder : p.theme.errorBorder};
  background: ${(p) =>
    p.$ok ? p.theme.successSoft : p.theme.errorSoft};
  color: ${(p) => p.theme.text};
  padding: 11px 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
  transition: background 150ms ease, transform 100ms ease;

  &:hover {
    transform: translateX(2px);
    background: ${(p) =>
      p.$ok ? `${p.theme.success}20` : `${p.theme.error}20`};
  }
`;

const ReviewItemMeta = styled.div`
  font-size: 11.5px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
  flex: 1;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const ReviewItemPrompt = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  font-weight: 400;
  opacity: 0.82;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 340px;
`;

const ReviewFlagBadge = styled.span`
  font-size: 13px;
  flex-shrink: 0;
  opacity: 0.9;
`;

const ReviewStatusDot = styled.span<{ $ok: boolean }>`
  font-size: 14px;
  flex-shrink: 0;
`;

const BackBtn = styled.button`
  margin-top: 14px;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 10px 16px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const RetakeBtn = styled.button`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.accent}40;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  padding: 10px 18px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: ${(p) => p.theme.accent};
    color: white;
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

/* ── practice complete banner ────────────────────────────────────────────── */

const CompleteCard = styled.div`
  background: ${(p) => p.theme.successSoft};
  border: 1px solid ${(p) => p.theme.successBorder};
  border-radius: 20px;
  padding: 20px 20px 18px;
  text-align: center;
  animation: ${slideIn} 300ms ease both;
`;

const CompleteEmoji = styled.div`
  font-size: 36px;
  margin-bottom: 8px;
`;

const CompleteTitle = styled.div`
  font-size: 18px;
  font-weight: 900;
  color: ${(p) => p.theme.success};
  margin-bottom: 4px;
  letter-spacing: -0.3px;
`;

const CompleteSubtitle = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.success};
  opacity: 0.82;
  margin-bottom: 14px;
`;

const CompleteActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const CompletePrimaryBtn = styled.button`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.success}55;
  background: ${(p) => p.theme.success};
  color: white;
  padding: 10px 20px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;
  &:hover { background: ${(p) => p.theme.success}cc; transform: translateY(-1px); }
`;

const CompleteSecondaryBtn = styled.button`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.successBorder};
  background: transparent;
  color: ${(p) => p.theme.success};
  padding: 10px 18px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease;
  &:hover { background: ${(p) => p.theme.success}18; }
`;

/* ── "loading" state ─────────────────────────────────────────────────────── */

const Subtle = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.5;
`;

/* ── utility ─────────────────────────────────────────────────────────────── */

function isAnswered(question: Question | null, response: Response): boolean {
  if (!question) return false;
  switch (question.type) {
    case "mcq_single":
      return response?.type === "mcq_single" && !!response.choiceId;
    case "mcq_multi":
      return response?.type === "mcq_multi" && Array.isArray(response.choiceIds) && response.choiceIds.length > 0;
    case "dnd_match":
      return response?.type === "dnd_match" && response.mapping && Object.values(response.mapping).some((v) => !!v);
    case "dnd_order":
      return response?.type === "dnd_order" && Array.isArray(response.orderedIds) && response.orderedIds.length > 0;
    case "hotspot":
      return response?.type === "hotspot" && !!response.selectedRegionId;
    case "fill_blank":
      return (
        response?.type === "fill_blank" &&
        response.values &&
        Object.values(response.values).some((v) => String(v ?? "").trim().length > 0)
      );
    default:
      return false;
  }
}

/* ── utilities ───────────────────────────────────────────────────────────── */

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatSubmittedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    return `${time} · ${date}`;
  } catch {
    return iso;
  }
}

const DOMAIN_LABELS: Record<string, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Env.",
};

/* ── component ───────────────────────────────────────────────────────────── */

export function EngineRunner(props: {
  title: string;
  subtitle: string;
  questions: Question[];
  scenarios: Scenario[];
  blueprint: Blueprint;
  mode: "practice" | "exam";
  allowDomainFilter?: boolean;
  storageNamespace: string;
  durationMinutes?: number;
  passThreshold?: number;
}) {
  const { title, subtitle, questions, scenarios, blueprint, mode, storageNamespace,
          durationMinutes, passThreshold = 70 } = props;
  const engine = useExamSession();

  const [initialized, setInitialized] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [submittedQ, setSubmittedQ] = useState<Record<string, boolean>>({});
  const [showExplain, setShowExplain] = useState<Record<string, boolean>>({});
  const [examView, setExamView] = useState<"take" | "review_list" | "review_question">("take");
  const [incorrectOnly, setIncorrectOnly] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerWarning, setTimerWarning] = useState<"none" | "low" | "critical">("none");

  const questionEntryRef = useRef<{ qid: string; enteredAt: number } | null>(null);

  /**
   * Ref that always points to the latest attempt.
   * Used inside effect cleanup closures where the Zustand state would be stale.
   */
  const latestAttemptRef = useRef(engine.attempt);
  useEffect(() => {
    latestAttemptRef.current = engine.attempt;
  }, [engine.attempt]);

  useEffect(() => {
    const ns = storageNamespace;

    /**
     * SESSION GUARD
     * ─────────────────────────────────────────────────────────────────────────
     * React useEffect cleanup runs on SPA navigation (component unmounts) but
     * NOT on a browser hard refresh (browser destroys the JS context first).
     * `beforeunload` fires on refresh/close/address-bar-nav but NOT on SPA nav.
     *
     * Combining both lets us:
     *   • SPA nav away  → cleanup runs, no beforeunload  → clear in-progress localStorage → fresh start on return ✅
     *   • Hard refresh  → beforeunload fires, cleanup may not run → localStorage kept → restore on reload ✅
     *   • Tab close     → beforeunload fires, cleanup may or may not run → flag is set but nobody reads it ✅ (no harm)
     */
    const REFRESH_FLAG = `exam_refresh__${ns}`;

    function onBeforeUnload() {
      try { sessionStorage.setItem(REFRESH_FLAG, "1"); } catch { /* ignore private-mode quota errors */ }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", onBeforeUnload);
    }

    // Reset all local UI state, then load / create the attempt
    setInitialized(false);
    setRevealed({});
    setSubmittedQ({});
    setShowExplain({});
    setIncorrectOnly(false);
    setFlaggedOnly(false);
    setShowSubmitConfirm(false);
    setExamView("take");
    setTimeRemaining(null);

    engine.initIfNeeded({ bank: questions, defaultBlueprint: blueprint, mode, storageNamespace })
      .then(() => setInitialized(true));

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", onBeforeUnload);

        // Check whether the beforeunload event fired (= page refresh / hard nav)
        const isRefresh = sessionStorage.getItem(REFRESH_FLAG) === "1";
        // Always remove the flag — it's only meaningful for this single transition
        sessionStorage.removeItem(REFRESH_FLAG);

        if (isRefresh) {
          // Page refresh: keep localStorage so the exam can be restored on reload
          return;
        }
      }

      // ── SPA navigation away ──────────────────────────────────────────────
      // Clear the active in-progress attempt so the user starts fresh next time.
      // IMPORTANT: do NOT clear submitted attempts — the results review relies on them.
      const att = latestAttemptRef.current;
      if (att && !att.submittedAt) {
        // Fire-and-forget (localStorage ops are synchronous internally)
        new LocalAttemptStorage(ns).clearLatest();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, questions, storageNamespace]);

  const current = useMemo(() => {
    if (!engine.attempt) return null;
    const order = engine.attempt.questionOrder ?? [];
    if (!order.length) return questions[0] ?? null;
    const qid = order[engine.attempt.currentIndex];
    return questions.find((q) => q.id === qid) ?? questions[0] ?? null;
  }, [engine.attempt, questions]);

  const currentId = current?.id ?? null;

  useEffect(() => {
    if (!currentId) return;
    setShowExplain((prev) => ({ ...prev, [currentId]: false }));
  }, [currentId]);

  // ── Timer countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!durationMinutes || mode !== "exam" || !engine.attempt || engine.attempt.submittedAt) {
      setTimeRemaining(null);
      setTimerWarning("none");
      return;
    }

    const endMs = new Date(engine.attempt.createdAt).getTime() + durationMinutes * 60 * 1000;

    function tick() {
      const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 600) setTimerWarning("critical");
      else if (remaining <= 1800) setTimerWarning("low");
      else setTimerWarning("none");
      if (remaining === 0) engine.submitAttempt();
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes, mode, engine.attempt?.id, engine.attempt?.submittedAt]);

  // ── Per-question time tracking ────────────────────────────────────────────
  useEffect(() => {
    if (!currentId || !engine.attempt) {
      questionEntryRef.current = null;
      return;
    }
    const prev = questionEntryRef.current;
    if (prev && prev.qid !== currentId) {
      const elapsed = Date.now() - prev.enteredAt;
      if (elapsed > 0) engine.recordTimeOnQuestion(prev.qid, elapsed);
    }
    questionEntryRef.current = { qid: currentId, enteredAt: Date.now() };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  useEffect(() => {
    if (mode !== "practice") return;
    async function handler(e: any) {
      const evtSlug = e?.detail?.bankSlug as string | undefined;
      if (!evtSlug) return;
      if (!storageNamespace.startsWith(`${evtSlug}__practice`)) return;
      setRevealed({});
      setSubmittedQ({});
      setShowExplain({});
      const s = new LocalAttemptStorage(storageNamespace);
      if (s.clearLatest) await s.clearLatest();
      if ((engine as any).hardRestart) {
        await (engine as any).hardRestart({ bank: questions, blueprint, mode, reshuffleQuestions: true, storageNamespace });
      } else {
        await engine.startNewAttempt({ reshuffleQuestions: true });
      }
    }
    window.addEventListener("practice:restart", handler as any);
    return () => window.removeEventListener("practice:restart", handler as any);
  }, [mode, storageNamespace, questions, blueprint, engine]);

  const total = engine.attempt?.questionOrder?.length ?? questions.length;
  const index = engine.attempt ? engine.attempt.currentIndex : 0;
  const x = total ? Math.min(total, index + 1) : 0;
  const progressPct = total ? Math.round((x / total) * 100) : 0;
  // Compute canNext/canPrev directly from functions to avoid stale Zustand getter issue
  const isLast = !engine.canNext();
  const canPrevNav = engine.canPrev();
  const practiceSubmitted = mode === "practice" && !!engine.attempt?.submittedAt;
  const domain = engine.filters.domain as Domain | "all";

  const result = useMemo(() => {
    if (!engine.attempt || !engine.bank) return null;
    if (!engine.attempt.submittedAt) return null;
    const qs = engine.bank.filter((q) => engine.attempt!.questionOrder.includes(q.id));
    return scoreAttempt(engine.attempt, qs);
  }, [engine.attempt, engine.bank]);

  const adaptiveSummary: AdaptiveSummary | null = useMemo(() => {
    try {
      if (!engine.attempt || !engine.bank) return null;
      if (!engine.attempt.submittedAt) return null;
      const qs = engine.bank.filter((q) => engine.attempt!.questionOrder.includes(q.id));
      return computeAdaptiveSummary(engine.attempt, qs);
    } catch (e) {
      console.warn("[Adaptive] Summary computation failed:", e);
      return null;
    }
  }, [engine.attempt, engine.bank]);

  useEffect(() => {
    if (mode !== "exam") return;
    if (engine.attempt?.submittedAt) setExamView("review_list");
  }, [mode, engine.attempt?.submittedAt]);

  const examPercent = useMemo(() => {
    if (!result || result.maxScore === 0) return 0;
    return Math.round((result.totalScore / result.maxScore) * 100);
  }, [result]);

  const examPassed = examPercent >= passThreshold;

  const scoreById = useMemo(() => {
    if (!result) return new Map<string, boolean>();
    return new Map(result.scoreResults.map((r) => [r.questionId, r.isCorrect]));
  }, [result]);

  const allQsMap = useMemo(() => {
    const all = [...(engine.bank ?? []), ...(engine.questions ?? [])];
    return new Map(all.map((q) => [q.id, q]));
  }, [engine.bank, engine.questions]);

  const answeredCount = useMemo(() => {
    if (!engine.attempt) return 0;
    return engine.attempt.questionOrder.filter((qid) => {
      const resp = engine.attempt!.responsesByQuestionId[qid];
      const q = allQsMap.get(qid);
      return q ? isAnswered(q, resp) : false;
    }).length;
  }, [engine.attempt, allQsMap]);

  const flaggedCount = useMemo(() => {
    if (!engine.attempt) return 0;
    return Object.values(engine.attempt.flagged).filter(Boolean).length;
  }, [engine.attempt]);

  const reviewRows = useMemo(() => {
    if (mode !== "exam") return [];
    if (!result || !engine.attempt) return [];
    const rows = engine.attempt.questionOrder.map((qid, idx) => ({
      idx,
      qid,
      isCorrect: !!scoreById.get(qid),
      isFlagged: !!engine.attempt!.flagged[qid],
      promptPreview: (allQsMap.get(qid)?.prompt ?? "").slice(0, 72),
    }));
    if (flaggedOnly) return rows.filter((r) => r.isFlagged);
    if (incorrectOnly) return rows.filter((r) => !r.isCorrect);
    return rows;
  }, [mode, result, engine.attempt, scoreById, allQsMap, incorrectOnly, flaggedOnly]);

  const currentResponse = current ? engine.getResponse(current.id) : (null as any);
  const answered = isAnswered(current, currentResponse);

  const showCorrect =
    mode === "exam"
      ? !!engine.attempt?.submittedAt
      : !!engine.attempt?.submittedAt || (currentId ? !!revealed[currentId] : false);

  const primaryLabel = useMemo(() => {
    if (!engine.attempt) return "Loading…";
    // After practice is fully submitted, navigate freely
    if (practiceSubmitted) return isLast ? "← First Question" : "Next Question →";
    if (mode === "practice") {
      const isRevealed = !!(currentId && revealed[currentId]);
      if (!isRevealed && answered) return "Submit Answer";
      if (isRevealed && isLast) return "Finish Practice ✓";
      if (isRevealed) return "Next Question →";
      return isLast ? "Skip & Finish" : "Skip Question";
    }
    return isLast ? "Finish Exam" : "Next Question →";
  }, [engine.attempt, mode, answered, currentId, revealed, isLast, practiceSubmitted]);

  const primaryDisabled = useMemo(() => {
    if (!engine.attempt) return true;
    return false;
  }, [engine.attempt]);

  function initiateSubmit() {
    setShowSubmitConfirm(true);
  }

  function confirmSubmit() {
    setShowSubmitConfirm(false);
    engine.submitAttempt();
  }

  function onPrimary() {
    if (!engine.attempt) return;

    // After practice is submitted: free navigation (wrap around to start)
    if (practiceSubmitted) {
      if (isLast) { engine.goToIndex(0); }
      else engine.next();
      return;
    }

    if (mode === "practice") {
      const isRevealed = !!(currentId && revealed[currentId]);
      if (!isRevealed) {
        if (!currentId) return;
        setRevealed((prev) => ({ ...prev, [currentId]: true }));
        setSubmittedQ((prev) => ({ ...prev, [currentId]: true }));
        setShowExplain((prev) => ({ ...prev, [currentId]: false }));
        // Record adaptive result for streak/weakness tracking
        try {
          if (current) {
            const sr = scoreQuestion(current, engine.getResponse(currentId));
            engine.recordAdaptiveResult(currentId, sr.isCorrect);
          }
        } catch { /* never block the main flow */ }
        if (isLast) engine.submitAttempt();
        return;
      }
      if (isLast) {
        engine.submitAttempt();
        return;
      }
      engine.next();
      return;
    }
    // Exam mode — show confirm dialog before submitting
    if (isLast) { initiateSubmit(); return; }
    engine.next();
  }

  async function retakePractice() {
    setRevealed({});
    setSubmittedQ({});
    setShowExplain({});
    const s = new LocalAttemptStorage(storageNamespace);
    if (s.clearLatest) await s.clearLatest();
    await engine.hardRestart({ bank: questions, blueprint, mode, reshuffleQuestions: true, storageNamespace });
  }

  async function retryIncorrect() {
    setRevealed({});
    setSubmittedQ({});
    setShowExplain({});
    await engine.retryIncorrectOnly();
  }

  function openReviewQuestion(idx: number) {
    engine.goToIndex(idx);
    setExamView("review_question");
  }

  async function retakeExam() {
    setIncorrectOnly(false);
    setFlaggedOnly(false);
    setShowSubmitConfirm(false);
    const s = new LocalAttemptStorage(storageNamespace);
    if (s.clearLatest) await s.clearLatest();
    await engine.hardRestart({ bank: questions, blueprint, mode, reshuffleQuestions: true, storageNamespace });
    setExamView("take");
  }

  const correctCount = result ? result.scoreResults.filter((r) => r.isCorrect).length : 0;
  const incorrectCount = result ? result.incorrectQuestionIds.length : 0;

  return (
    <Grid>
      {/* ── LEFT SIDEBAR ───────────────────────────────────────── */}
      <Card>
        <SideTitle>{title}</SideTitle>
        <SideSubtitle>{subtitle}</SideSubtitle>

        <ModeBadge $mode={mode}>
          {mode === "practice" ? "✏️ Practice Mode" : "🎓 Exam Simulation"}
        </ModeBadge>

        <ProgressSection>
          <ProgressHeader>
            <ProgressLabel>Progress</ProgressLabel>
            <ProgressCounter>{x} / {total}</ProgressCounter>
          </ProgressHeader>
          <ProgressTrack>
            <ProgressFill $pct={progressPct} $mode={mode} />
          </ProgressTrack>
        </ProgressSection>

        {/* ── Timer (exam mode only) ──────────────────────── */}
        {mode === "exam" && !engine.attempt?.submittedAt && timeRemaining !== null && (
          <TimerBlock $warning={timerWarning}>
            <TimerLabel>⏱ Time Remaining</TimerLabel>
            <TimerValue $warning={timerWarning}>{formatTime(timeRemaining)}</TimerValue>
          </TimerBlock>
        )}

        {/* ── Unanswered counter (exam mode only) ────────── */}
        {mode === "exam" && !engine.attempt?.submittedAt && engine.attempt && (
          <UnansweredRow>
            <UnansweredBadge $urgent={(total - answeredCount) > 0}>
              {total - answeredCount === 0 ? "✓ All answered" : `${total - answeredCount} unanswered`}
            </UnansweredBadge>
            {flaggedCount > 0 && (
              <UnansweredBadge $urgent={false}>
                🚩 {flaggedCount} flagged
              </UnansweredBadge>
            )}
          </UnansweredRow>
        )}

        <Divider />

        {props.allowDomainFilter && (
          <>
            <FilterLabel>Filter by Domain</FilterLabel>
            <Select value={domain} onChange={(e) => engine.setDomainFilter(e.target.value as any)}>
              <option value="all">All domains</option>
              <option value="people">People</option>
              <option value="process">Process</option>
              <option value="business_environment">Business Environment</option>
            </Select>
            <Divider />
          </>
        )}

        <SectionTitle>Navigation</SectionTitle>
        <NavRow>
          <NavBtn
            onClick={() => engine.prev()}
            disabled={!canPrevNav}
            aria-label="Previous question"
          >
            ← Prev
          </NavBtn>

          <PrimaryBtn $mode={mode} onClick={onPrimary} disabled={primaryDisabled}>
            {primaryLabel}
          </PrimaryBtn>

          {mode === "exam" && !engine.attempt?.submittedAt && (
            <NavBtn
              $danger
              onClick={initiateSubmit}
              disabled={!engine.attempt}
              aria-label="Submit exam now"
            >
              Submit
            </NavBtn>
          )}
        </NavRow>

        {/* Flag for review button */}
        {engine.attempt && !engine.attempt.submittedAt && currentId && (
          <FlagBtn
            $flagged={!!engine.attempt.flagged[currentId]}
            onClick={() => engine.toggleFlagCurrent()}
          >
            {engine.attempt.flagged[currentId] ? "🚩 Flagged for Review" : "🏳 Flag for Review"}
          </FlagBtn>
        )}

        {mode === "practice" && currentId && submittedQ[currentId] && (
          <LearnMoreBtn onClick={() => setShowExplain((prev) => ({ ...prev, [currentId]: !prev[currentId] }))}>
            {showExplain[currentId] ? "▲ Hide Explanation" : "▼ Show Explanation"}
          </LearnMoreBtn>
        )}

        {/* Question jump grid */}
        {engine.attempt && (
          <>
            <Divider />
            <SectionTitle>Questions</SectionTitle>
            <QGridWrap>
              {engine.attempt.questionOrder.map((qid, idx) => {
                const isCurrent = idx === engine.attempt!.currentIndex;
                const isFlagged = !!engine.attempt!.flagged[qid];
                const resp = engine.attempt!.responsesByQuestionId[qid];
                const isAns = resp ? (() => {
                  if (resp.type === "mcq_single") return !!resp.choiceId;
                  if (resp.type === "mcq_multi") return resp.choiceIds.length > 0;
                  if (resp.type === "dnd_match") return Object.values(resp.mapping).some(Boolean);
                  if (resp.type === "dnd_order") return resp.orderedIds.length > 0;
                  if (resp.type === "hotspot") return !!resp.selectedRegionId;
                  if (resp.type === "fill_blank") return Object.values(resp.values).some(v => String(v ?? "").trim().length > 0);
                  return false;
                })() : false;
                // In review mode, reflect correct/incorrect; else answered/flagged/unanswered
                const isSubmitted = !!engine.attempt!.submittedAt;
                const gridState = isCurrent ? "current"
                  : isSubmitted ? (
                      scoreById.get(qid) === true ? "correct"
                      : scoreById.get(qid) === false ? "incorrect"
                      : isFlagged ? "flagged"
                      : "unanswered"
                    )
                  : isFlagged ? "flagged"
                  : isAns ? "answered"
                  : "unanswered";
                return (
                  <QGridBtn
                    key={qid}
                    $state={gridState}
                    onClick={() => {
                      engine.goToIndex(idx);
                      if (isSubmitted) setExamView("review_question");
                    }}
                    title={`Q${idx + 1}${isFlagged ? " · flagged" : ""}${isAns && !isSubmitted ? " · answered" : ""}${isSubmitted ? (scoreById.get(qid) ? " · correct" : " · incorrect") : ""}`}
                  >
                    {idx + 1}
                  </QGridBtn>
                );
              })}
            </QGridWrap>

            {/* Grid legend */}
            {!engine.attempt.submittedAt ? (
              <GridLegend>
                <GridLegendItem>
                  <GridLegendDot $color="var(--accent, #6366f1)" $border="var(--accent, #6366f1)" />
                  Current
                </GridLegendItem>
                <GridLegendItem>
                  <GridLegendDot $color="#dcfce7" $border="#86efac" />
                  Answered
                </GridLegendItem>
                <GridLegendItem>
                  <GridLegendDot $color="#fef9c3" $border="#fde047" />
                  Flagged
                </GridLegendItem>
                <GridLegendItem>
                  <GridLegendDot $color="transparent" $border="#d1d5db" />
                  Unanswered
                </GridLegendItem>
              </GridLegend>
            ) : (
              <GridLegend>
                <GridLegendItem>
                  <GridLegendDot $color="var(--accent, #6366f1)" $border="var(--accent, #6366f1)" />
                  Current
                </GridLegendItem>
                <GridLegendItem>
                  <GridLegendDot $color="#dcfce7" $border="#86efac" />
                  Correct
                </GridLegendItem>
                <GridLegendItem>
                  <GridLegendDot $color="#fee2e2" $border="#fca5a5" />
                  Incorrect
                </GridLegendItem>
              </GridLegend>
            )}
          </>
        )}

        {result && mode === "practice" && (
          <>
            <Divider />
            <SectionTitle>Session Results</SectionTitle>
            <StatGrid>
              <StatBox $variant="success">
                <StatLabel>Correct</StatLabel>
                <StatValue $variant="success">{correctCount}</StatValue>
              </StatBox>
              <StatBox $variant="error">
                <StatLabel>Incorrect</StatLabel>
                <StatValue $variant="error">{incorrectCount}</StatValue>
              </StatBox>
              <StatBox>
                <StatLabel>Score</StatLabel>
                <StatValue>{result.totalScore}/{result.maxScore}</StatValue>
              </StatBox>
              <StatBox>
                <StatLabel>Accuracy</StatLabel>
                <StatValue>{result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0}%</StatValue>
              </StatBox>
            </StatGrid>
            {adaptiveSummary && (
              <StatGrid style={{ marginTop: 8 }}>
                <StatBox $variant="neutral">
                  <StatLabel>Weighted</StatLabel>
                  <StatValue>{adaptiveSummary.weighted.weightedPercent}%</StatValue>
                </StatBox>
                <StatBox $variant="neutral">
                  <StatLabel>Avg Diff</StatLabel>
                  <StatValue>{adaptiveSummary.weighted.avgDifficulty}</StatValue>
                </StatBox>
              </StatGrid>
            )}
            <Divider />
            <ActionRow>
              <RetakeBtn onClick={retakePractice} style={{ flex: 1 }}>↺ New Session</RetakeBtn>
              {incorrectCount > 0 && (
                <RetakeBtn onClick={retryIncorrect} style={{ flex: 1 }}>⚡ Retry Wrong</RetakeBtn>
              )}
            </ActionRow>
          </>
        )}
      </Card>

      {/* ── RIGHT COLUMN ───────────────────────────────────────── */}
      <RightCol>
        {/* EXAM: submitted → review list */}
        {mode === "exam" && engine.attempt?.submittedAt && examView === "review_list" && (
          <Card>
            <ResultsHero $pass={examPassed}>
              <ResultsIcon $pass={examPassed}>
                {examPassed ? "🎉" : "📚"}
              </ResultsIcon>
              <ResultsScore>{examPercent}%</ResultsScore>
              <ResultsSubtext>
                {examPassed
                  ? `Congratulations — you passed! (threshold: ${passThreshold}%)`
                  : `Keep studying — you've got this! (threshold: ${passThreshold}%)`}
              </ResultsSubtext>
              {engine.attempt.submittedAt && (
                <SubmittedAt>Submitted {formatSubmittedAt(engine.attempt.submittedAt)}</SubmittedAt>
              )}
            </ResultsHero>

            {result && (
              <ResultsStatRow>
                <ResultsStatBox $variant="success">
                  <ResultsStatValue $variant="success">{correctCount}</ResultsStatValue>
                  <ResultsStatLabel>Correct</ResultsStatLabel>
                </ResultsStatBox>
                <ResultsStatBox $variant="error">
                  <ResultsStatValue $variant="error">{incorrectCount}</ResultsStatValue>
                  <ResultsStatLabel>Incorrect</ResultsStatLabel>
                </ResultsStatBox>
                <ResultsStatBox>
                  <ResultsStatValue>{result.totalScore}/{result.maxScore}</ResultsStatValue>
                  <ResultsStatLabel>Points</ResultsStatLabel>
                </ResultsStatBox>
              </ResultsStatRow>
            )}

            {/* Domain breakdown */}
            {result && (
              <>
                <Divider />
                <SectionTitle style={{ marginBottom: 10 }}>Score by Domain</SectionTitle>
                <DomainTable>
                  {(Object.entries(result.byDomain) as [string, { correct: number; total: number }][])
                    .filter(([, d]) => d.total > 0)
                    .map(([domain, d]) => {
                      const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                      const pass = pct >= passThreshold;
                      return (
                        <React.Fragment key={domain}>
                          <DomainRow>
                            <DomainName>{DOMAIN_LABELS[domain] ?? domain}</DomainName>
                            <DomainScore>{d.correct}/{d.total}</DomainScore>
                            <DomainPct $pass={pass}>{pct}%</DomainPct>
                          </DomainRow>
                          <DomainTrack>
                            <DomainFill $pct={pct} $pass={pass} />
                          </DomainTrack>
                        </React.Fragment>
                      );
                    })}
                </DomainTable>
              </>
            )}

            {/* Adaptive insights for exam results */}
            {adaptiveSummary && (
              <>
                <Divider />
                <AdaptiveResults summary={adaptiveSummary} passThreshold={passThreshold} />
              </>
            )}

            <Divider />

            <ActionRow>
              <RetakeBtn onClick={retakeExam}>↺ Retake Exam</RetakeBtn>
            </ActionRow>

            <Divider />

            <FilterToggleRow>
              <FilterToggle $active={!incorrectOnly && !flaggedOnly}>
                <FilterToggleBox
                  type="radio"
                  name="reviewFilter"
                  checked={!incorrectOnly && !flaggedOnly}
                  onChange={() => { setIncorrectOnly(false); setFlaggedOnly(false); }}
                />
                All ({engine.attempt.questionOrder.length})
              </FilterToggle>
              <FilterToggle $active={incorrectOnly}>
                <FilterToggleBox
                  type="radio"
                  name="reviewFilter"
                  checked={incorrectOnly}
                  onChange={() => { setIncorrectOnly(true); setFlaggedOnly(false); }}
                />
                Incorrect ({incorrectCount})
              </FilterToggle>
              {flaggedCount > 0 && (
                <FilterToggle $active={flaggedOnly}>
                  <FilterToggleBox
                    type="radio"
                    name="reviewFilter"
                    checked={flaggedOnly}
                    onChange={() => { setFlaggedOnly(true); setIncorrectOnly(false); }}
                  />
                  🚩 Flagged ({flaggedCount})
                </FilterToggle>
              )}
            </FilterToggleRow>

            <ReviewList>
              {reviewRows.map((r) => (
                <ReviewItem key={r.qid} $ok={r.isCorrect} onClick={() => openReviewQuestion(r.idx)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ReviewItemMeta>
                      Q{r.idx + 1} · {r.isCorrect ? "Correct" : "Incorrect"}
                      {r.isFlagged && <ReviewFlagBadge> 🚩</ReviewFlagBadge>}
                    </ReviewItemMeta>
                    {r.promptPreview && <ReviewItemPrompt>{r.promptPreview}{r.promptPreview.length >= 72 ? "…" : ""}</ReviewItemPrompt>}
                  </div>
                  <ReviewStatusDot $ok={r.isCorrect}>
                    {r.isCorrect ? "✅" : "❌"}
                  </ReviewStatusDot>
                </ReviewItem>
              ))}
            </ReviewList>
          </Card>
        )}

        {/* EXAM: submitted → review a specific question */}
        {mode === "exam" && engine.attempt?.submittedAt && examView === "review_question" && (
          <>
            <Card>
              {current ? (
                <QuestionRenderer
                  question={current}
                  scenario={current.scenarioId ? scenarios.find((s) => s.id === current.scenarioId) : undefined}
                  response={engine.getResponse(current.id)}
                  optionOrder={engine.getOptionOrder(current.id)}
                  onChange={() => {}}
                  showCorrect={true}
                />
              ) : (
                <Subtle>Loading…</Subtle>
              )}
              <BackBtn onClick={() => setExamView("review_list")}>← Back to Results</BackBtn>
            </Card>

            <ExplanationCard>
              <ExplanationHeader>
                <ExplanationIcon>💡</ExplanationIcon>
                <div>
                  <ExplanationTitle>Explanation</ExplanationTitle>
                  <ExplanationSubtitle>Why this answer is correct</ExplanationSubtitle>
                </div>
              </ExplanationHeader>
              <ExplanationBody>
                {current?.explanation?.trim()
                  ? current.explanation
                  : "No explanation has been provided for this question yet."}
              </ExplanationBody>
            </ExplanationCard>
          </>
        )}

        {/* PRACTICE COMPLETE banner */}
        {practiceSubmitted && result && (
          <CompleteCard>
            <CompleteEmoji>{(result.totalScore / result.maxScore) >= 0.8 ? "🎉" : (result.totalScore / result.maxScore) >= 0.6 ? "📈" : "📚"}</CompleteEmoji>
            <CompleteTitle>
              {(result.totalScore / result.maxScore) >= 0.8
                ? "Excellent Work!"
                : (result.totalScore / result.maxScore) >= 0.6
                ? "Good Progress!"
                : "Keep Studying!"}
            </CompleteTitle>
            <CompleteSubtitle>
              {correctCount} / {total} correct — {result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0}% accuracy
            </CompleteSubtitle>
            <CompleteActions>
              <CompletePrimaryBtn onClick={retakePractice}>↺ New Session</CompletePrimaryBtn>
              {incorrectCount > 0 && (
                <CompleteSecondaryBtn onClick={retryIncorrect}>⚡ Retry {incorrectCount} Wrong</CompleteSecondaryBtn>
              )}
            </CompleteActions>
          </CompleteCard>
        )}

        {/* ADAPTIVE RESULTS — practice complete */}
        {practiceSubmitted && adaptiveSummary && (
          <Card>
            <AdaptiveResults summary={adaptiveSummary} passThreshold={passThreshold} />
          </Card>
        )}

        {/* NORMAL mode: practice or pre-submit exam */}
        {initialized && !(mode === "exam" && engine.attempt?.submittedAt) && (
          <>
            <Card>
              {current ? (
                <QuestionRenderer
                  question={current}
                  scenario={current.scenarioId ? scenarios.find((s) => s.id === current.scenarioId) : undefined}
                  response={engine.getResponse(current.id)}
                  optionOrder={engine.getOptionOrder(current.id)}
                  onChange={(r) => engine.setResponse(current.id, r)}
                  showCorrect={showCorrect}
                />
              ) : (
                <Subtle>Loading…</Subtle>
              )}
            </Card>

            {/* Mobile bottom navigation */}
            <MobileNavBar>
              <NavBtn
                onClick={() => engine.prev()}
                disabled={!canPrevNav}
                style={{ flex: "0 0 auto" }}
              >
                ← Prev
              </NavBtn>
              <PrimaryBtn $mode={mode} onClick={onPrimary} disabled={primaryDisabled} style={{ flex: 1 }}>
                {primaryLabel}
              </PrimaryBtn>
              {engine.attempt && !engine.attempt.submittedAt && currentId && (
                <NavBtn
                  onClick={() => engine.toggleFlagCurrent()}
                  style={{ flex: "0 0 auto" }}
                  aria-label="Flag question"
                  title={engine.attempt.flagged[currentId] ? "Unflag" : "Flag for review"}
                >
                  {engine.attempt.flagged[currentId] ? "🚩" : "🏳"}
                </NavBtn>
              )}
              {mode === "exam" && !engine.attempt?.submittedAt && (
                <NavBtn
                  $danger
                  onClick={initiateSubmit}
                  disabled={!engine.attempt}
                  style={{ flex: "0 0 auto" }}
                >
                  Submit
                </NavBtn>
              )}
            </MobileNavBar>

            {mode === "practice" && current && currentId && showExplain[currentId] && (
              <ExplanationCard>
                <ExplanationHeader>
                  <ExplanationIcon>💡</ExplanationIcon>
                  <div>
                    <ExplanationTitle>Explanation</ExplanationTitle>
                    <ExplanationSubtitle>Why this answer is correct</ExplanationSubtitle>
                  </div>
                </ExplanationHeader>
                <ExplanationBody>
                  {current.explanation?.trim()
                    ? current.explanation
                    : "No explanation has been provided for this question yet."}
                </ExplanationBody>
              </ExplanationCard>
            )}
          </>
        )}
      </RightCol>

      {/* ── Pre-submission confirm dialog ─────────────────── */}
      {showSubmitConfirm && (
        <ConfirmOverlay onClick={() => setShowSubmitConfirm(false)}>
          <ConfirmCard onClick={(e) => e.stopPropagation()}>
            <ConfirmTitle>Submit Exam?</ConfirmTitle>
            <ConfirmSubtitle>
              Once submitted you cannot change your answers. Please review your progress below.
            </ConfirmSubtitle>

            <ConfirmStatGrid>
              <ConfirmStat $variant="success">
                <ConfirmStatValue $variant="success">{answeredCount}</ConfirmStatValue>
                <ConfirmStatLabel>Answered</ConfirmStatLabel>
              </ConfirmStat>
              <ConfirmStat $variant={total - answeredCount > 0 ? "error" : "neutral"}>
                <ConfirmStatValue $variant={total - answeredCount > 0 ? "error" : "neutral"}>
                  {total - answeredCount}
                </ConfirmStatValue>
                <ConfirmStatLabel>Unanswered</ConfirmStatLabel>
              </ConfirmStat>
              <ConfirmStat $variant={flaggedCount > 0 ? "warning" : "neutral"}>
                <ConfirmStatValue $variant={flaggedCount > 0 ? "warning" : "neutral"}>
                  {flaggedCount}
                </ConfirmStatValue>
                <ConfirmStatLabel>Flagged</ConfirmStatLabel>
              </ConfirmStat>
            </ConfirmStatGrid>

            <ConfirmActions>
              {flaggedCount > 0 && (
                <ConfirmReviewBtn onClick={() => {
                  setShowSubmitConfirm(false);
                  // Jump to first flagged question
                  const firstFlagged = engine.attempt?.questionOrder.findIndex(
                    (qid) => engine.attempt!.flagged[qid]
                  ) ?? -1;
                  if (firstFlagged >= 0) engine.goToIndex(firstFlagged);
                }}>
                  🚩 Review {flaggedCount} Flagged Question{flaggedCount !== 1 ? "s" : ""}
                </ConfirmReviewBtn>
              )}
              <ConfirmSubmitBtn onClick={confirmSubmit}>
                Submit Exam →
              </ConfirmSubmitBtn>
              <ConfirmCancelBtn onClick={() => setShowSubmitConfirm(false)}>
                Cancel — Keep Reviewing
              </ConfirmCancelBtn>
            </ConfirmActions>
          </ConfirmCard>
        </ConfirmOverlay>
      )}
    </Grid>
  );
}
