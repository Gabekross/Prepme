"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import type { Blueprint, Domain, Question, Scenario, Response } from "../core/types";
import { useExamSession } from "../hooks/useExamSession";
import { QuestionRenderer } from "./QuestionRenderer";
import { scoreAttempt, scoreQuestion } from "../core/scoring";
import { LocalAttemptStorage } from "../core/storage";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { computeAdaptiveSummary, type AdaptiveSummary } from "../core/analytics";
import { AdaptiveResults } from "./AdaptiveResults";
import { ProcessingOverlay } from "./ProcessingOverlay";

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
  min-width: 0;
  width: 100%;

  @media (min-width: 980px) {
    grid-template-columns: 280px 1fr;
    gap: 20px;
  }
`;

const RightCol = styled.div`
  display: grid;
  gap: 16px;
  min-width: 0;
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

/* ── exam status row (progress + unanswered + timer in one line) ─────────── */

const ExamStatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
  margin-bottom: 2px;
`;

const ExamStatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const ExamStatusCounter = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  font-variant-numeric: tabular-nums;
`;

const ExamStatusBadge = styled.div<{ $urgent: boolean }>`
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => p.$urgent ? (p.theme.warning ?? "#f59e0b") : p.theme.muted};
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
  display: none;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  @media (min-width: 980px) {
    display: flex;
  }
`;

const NavBtn = styled.button<{ $primary?: boolean; $danger?: boolean; $flagged?: boolean }>`
  border-radius: 12px;
  border: 1px solid ${(p) =>
    p.$flagged
      ? p.theme.warningBorder
      : p.$primary
      ? "transparent"
      : p.$danger
      ? p.theme.errorBorder
      : p.theme.buttonBorder};
  background: ${(p) =>
    p.$flagged
      ? p.theme.warningSoft
      : p.$primary
      ? p.theme.accent
      : p.$danger
      ? p.theme.errorSoft
      : p.theme.buttonBg};
  color: ${(p) =>
    p.$flagged
      ? p.theme.warning
      : p.$primary
      ? p.theme.accentText
      : p.$danger
      ? p.theme.error
      : p.theme.text};
  padding: 10px 16px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease, transform 100ms ease, opacity 150ms ease, border-color 150ms ease, color 150ms ease;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$flagged
        ? p.theme.warningBorder
        : p.$primary
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
  display: block;

  @media (min-width: 980px) {
    display: block;
  }

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
  display: none;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;

  @media (min-width: 980px) {
    display: flex;
  }

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
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  @media (min-width: 980px) {
    display: none;
  }
`;

const MobileSubmitBtn = styled.button`
  display: flex;
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.errorBorder};
  background: ${(p) => p.theme.errorSoft};
  color: ${(p) => p.theme.error};
  padding: 10px 16px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 150ms ease;

  @media (min-width: 980px) {
    display: none;
  }

  &:hover {
    background: ${(p) => p.theme.errorBorder};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/* ── timer (inline in progress row) ─────────────────────────────────────── */

const TimerValue = styled.div<{ $warning: "none" | "low" | "critical" }>`
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
  color: ${(p) =>
    p.$warning === "critical"
      ? p.theme.error
      : p.$warning === "low"
      ? p.theme.warning
      : p.theme.text};
  transition: color 400ms ease;
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

const ReviewToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.text};
  cursor: pointer;
  user-select: none;
`;

const ToggleSwitch = styled.div<{ $on: boolean }>`
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: ${(p) => (p.$on ? p.theme.accent : p.theme.inputBorder)};
  position: relative;
  transition: background 200ms ease;
  flex-shrink: 0;

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: ${(p) => (p.$on ? "20px" : "2px")};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: left 200ms ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
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
  padding: 8px 0;
  transition: opacity 150ms ease;

  &:hover { opacity: 0.7; }
`;

const SectionArrow = styled.span<{ $open: boolean }>`
  display: inline-block;
  font-size: 12px;
  transition: transform 200ms ease;
  transform: ${(p) => (p.$open ? "rotate(180deg)" : "rotate(0)")};
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

/* ── review question nav row (below explanation) ─────────────────────────── */

const ReviewNavRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const ReviewNavBtn = styled.button<{ $primary?: boolean; $muted?: boolean }>`
  flex: 1;
  min-width: 80px;
  border-radius: 10px;
  border: 1px solid ${(p) =>
    p.$primary ? "transparent" : p.theme.buttonBorder};
  background: ${(p) =>
    p.$primary ? p.theme.accent : p.theme.buttonBg};
  color: ${(p) =>
    p.$primary ? p.theme.accentText : p.$muted ? p.theme.muted : p.theme.text};
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  transition: background 150ms ease, opacity 150ms ease;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$primary ? p.theme.accentHover : p.theme.buttonHover};
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

/* ── desktop-only wrapper (hidden on mobile + tablet) ────────────────────── */

const DesktopOnly = styled.div`
  display: none;

  @media (min-width: 980px) {
    display: block;
  }
`;

/* ── flagged review banner ───────────────────────────────────────────────── */

const FlaggedReviewBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 14px;
  background: ${(p) => p.theme.warningSoft};
  border: 1px solid ${(p) => p.theme.warningBorder};
  color: ${(p) => p.theme.warning};
  font-size: 13px;
  font-weight: 700;
  animation: ${slideIn} 200ms ease both;
`;

const FlaggedReviewExitBtn = styled.button`
  border: 1px solid ${(p) => p.theme.warningBorder};
  background: transparent;
  color: ${(p) => p.theme.warning};
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: background 150ms ease;

  &:hover {
    background: ${(p) => p.theme.warningBorder};
  }
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
    case "dnd_order": {
      if (response?.type !== "dnd_order" || !Array.isArray(response.orderedIds) || response.orderedIds.length === 0) return false;
      // The initial response pre-populates orderedIds with the item list order.
      // Only count as "answered" if the user has actually reordered.
      const initial = question.payload.items.map((i: any) => i.id);
      return response.orderedIds.some((id: string, idx: number) => id !== initial[idx]);
    }
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
  /** User ID for server-side persistence (from auth context) */
  userId?: string | null;
  /** Bank slug for Supabase attempt row */
  bankSlug?: string;
  /** Set ID for exam mode (e.g. "set_a") */
  setId?: string | null;
}) {
  const { title, subtitle, questions, scenarios, blueprint, mode, storageNamespace,
          durationMinutes, passThreshold = 70, userId, bankSlug, setId } = props;
  const engine = useExamSession();
  const router = useRouter();

  const [initialized, setInitialized] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [submittedQ, setSubmittedQ] = useState<Record<string, boolean>>({});
  const [showExplain, setShowExplain] = useState<Record<string, boolean>>({});
  const [examView, setExamView] = useState<"take" | "review_list" | "review_question">("take");
  const [incorrectOnly, setIncorrectOnly] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerWarning, setTimerWarning] = useState<"none" | "low" | "critical">("none");
  const [showProcessing, setShowProcessing] = useState(false);
  const handleProcessingComplete = useCallback(() => setShowProcessing(false), []);
  const [showReviewAfterSubmit, setShowReviewAfterSubmit] = useState(true);
  const [showDomainSection, setShowDomainSection] = useState(true);
  const [showInsightsSection, setShowInsightsSection] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [reviewingFlagged, setReviewingFlagged] = useState(false);

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

    // Reset all local UI state, then create a fresh attempt
    setInitialized(false);
    setRevealed({});
    setSubmittedQ({});
    setShowExplain({});
    setIncorrectOnly(false);
    setFlaggedOnly(false);
    setShowSubmitConfirm(false);
    setExamView("take");
    setTimeRemaining(null);
    setReviewingFlagged(false);

    engine.initIfNeeded({ bank: questions, defaultBlueprint: blueprint, mode, storageNamespace, userId, bankSlug, setId })
      .then(() => { setInitialized(true); });

    return () => {
      // On SPA navigation away, mark any unsubmitted attempt as abandoned
      // so it does not surface as in_progress in the dashboard.
      const att = latestAttemptRef.current;
      if (att && !att.submittedAt && att.id && userId) {
        try {
          const sb = supabaseBrowser();
          sb.from("attempts")
            .update({ status: "abandoned" })
            .eq("id", att.id)
            .eq("user_id", userId)
            .then(({ error }) => {
              if (error) console.warn("[EngineRunner] Failed to abandon attempt on nav:", error.message);
            });
        } catch {
          // Best-effort — don't block navigation
        }
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

  /** Persist scoring result to Supabase after submission (fire-and-forget) */
  function persistResult() {
    engine.persistScoringResult(questions, passThreshold).catch(() => {});
  }

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
      if (remaining === 0) {
        engine.submitAttempt();
        persistResult();
      }
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
    // Never track time during review — the attempt is already submitted and
    // calling recordTimeOnQuestion would trigger unnecessary Zustand updates.
    if (engine.attempt.submittedAt) {
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

      // Mark the old attempt as abandoned in Supabase before clearing
      const oldAttempt = latestAttemptRef.current;
      if (oldAttempt?.id && !oldAttempt.submittedAt && userId) {
        try {
          const sb = supabaseBrowser();
          await sb
            .from("attempts")
            .update({ status: "abandoned" })
            .eq("id", oldAttempt.id)
            .eq("user_id", userId);
        } catch (err) {
          console.warn("[EngineRunner] Failed to abandon old attempt on restart:", err);
        }
      }

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
  }, [mode, storageNamespace, questions, blueprint, engine, userId]);

  const total = engine.attempt?.questionOrder?.length ?? questions.length;
  const index = engine.attempt ? engine.attempt.currentIndex : 0;
  const x = total ? Math.min(total, index + 1) : 0;
  const progressPct = total ? Math.round((x / total) * 100) : 0;

  /** Ordered indices of flagged questions in the current attempt — must be
   *  declared before canPrevNav which depends on it. */
  const flaggedIndices = useMemo(() => {
    if (!engine.attempt) return [] as number[];
    return engine.attempt.questionOrder.reduce<number[]>((acc, qid, idx) => {
      if (engine.attempt!.flagged[qid]) acc.push(idx);
      return acc;
    }, []);
  }, [engine.attempt]);

  // Compute canNext/canPrev directly from functions to avoid stale Zustand getter issue
  const isLast = !engine.canNext();
  const canPrevNav = reviewingFlagged ? flaggedIndices.length > 1 : engine.canPrev();
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
    // Only transition take → review_list on first submission.
    // Never override review_question — that would cause a blank screen
    // during the Zustand re-render triggered by goToIndex / recordTimeOnQuestion.
    if (engine.attempt?.submittedAt) {
      setExamView((prev) => (prev === "take" ? "review_list" : prev));
    }
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
    if (reviewingFlagged) return "Next Flagged →";
    if (mode === "practice") {
      const isRevealed = !!(currentId && revealed[currentId]);
      if (!isRevealed && answered) return "Submit Answer";
      if (isRevealed && isLast) return "Finish Practice";
      if (isRevealed) return "Next Question →";
      return isLast ? "Skip & Finish" : "Skip Question";
    }
    return isLast ? "Finish Exam" : "Next Question →";
  }, [engine.attempt, mode, answered, currentId, revealed, isLast, practiceSubmitted, reviewingFlagged]);

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
    persistResult();
    if (mode === "exam") {
      if (showReviewAfterSubmit) {
        setShowProcessing(true);
      } else {
        // Skip review — go to dashboard
        router.push("/dashboard");
      }
    }
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
        if (isLast) { engine.submitAttempt(); persistResult(); }
        return;
      }
      if (isLast) {
        engine.submitAttempt();
        persistResult();
        return;
      }
      engine.next();
      return;
    }
    // Exam mode — flagged-only navigation
    if (reviewingFlagged) {
      goNextFlagged();
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

  /** Advance to next flagged question, wrapping around if at the end */
  function goNextFlagged() {
    if (!engine.attempt || flaggedIndices.length === 0) return;
    const cur = engine.attempt.currentIndex;
    const next = flaggedIndices.find((i) => i > cur);
    engine.goToIndex(next !== undefined ? next : flaggedIndices[0]);
  }

  /** Go back to previous flagged question, wrapping around if at the start */
  function goPrevFlagged() {
    if (!engine.attempt || flaggedIndices.length === 0) return;
    const cur = engine.attempt.currentIndex;
    const prev = [...flaggedIndices].reverse().find((i) => i < cur);
    engine.goToIndex(prev !== undefined ? prev : flaggedIndices[flaggedIndices.length - 1]);
  }

  const correctCount = result ? result.scoreResults.filter((r) => r.isCorrect).length : 0;
  const incorrectCount = result ? result.incorrectQuestionIds.length : 0;

  return (
    <Grid>
      {/* ── LEFT SIDEBAR ───────────────────────────────────────── */}
      <Card>
        {/* ── Exam status: progress · unanswered · timer ─── */}
        {mode === "exam" && !engine.attempt?.submittedAt && engine.attempt && (
          <ExamStatusRow>
            <ExamStatusLeft>
              <ExamStatusCounter>{x} / {total}</ExamStatusCounter>
              <ExamStatusBadge $urgent={(total - answeredCount) > 0}>
                {total - answeredCount === 0 ? "All answered" : `${total - answeredCount} unanswered`}
              </ExamStatusBadge>
              {flaggedCount > 0 && (
                <ExamStatusBadge $urgent={false}>
                  {flaggedCount} flagged
                </ExamStatusBadge>
              )}
            </ExamStatusLeft>
            {timeRemaining !== null && (
              <TimerValue $warning={timerWarning}>{formatTime(timeRemaining)}</TimerValue>
            )}
          </ExamStatusRow>
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

        <NavRow>
          <NavBtn
            onClick={() => reviewingFlagged ? goPrevFlagged() : engine.prev()}
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
            {engine.attempt.flagged[currentId] ? "Flagged for Review" : "Flag for Review"}
          </FlagBtn>
        )}

        {/* Question map — exam review, desktop only (hidden on mobile/tablet) */}
        {engine.attempt && mode === "exam" && !!engine.attempt.submittedAt && (
          <DesktopOnly>
            <Divider />
            <LearnMoreBtn onClick={() => setShowQuestionGrid((v) => !v)}>
              {showQuestionGrid ? "Hide Question Map" : "Show Question Map"}
            </LearnMoreBtn>
          </DesktopOnly>
        )}
        {engine.attempt && mode === "exam" && !!engine.attempt.submittedAt && showQuestionGrid && (
          <DesktopOnly>
            <SectionTitle style={{ marginTop: 10 }}>Questions</SectionTitle>
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
                    title={`Q${idx + 1}${isFlagged ? " · flagged" : ""}${isSubmitted ? (scoreById.get(qid) ? " · correct" : " · incorrect") : ""}`}
                  >
                    {idx + 1}
                  </QGridBtn>
                );
              })}
            </QGridWrap>
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
          </DesktopOnly>
        )}

        {/* Session Results block removed — all metrics are already shown in the
            right-column Performance Overview, and action buttons live in the
            CompleteCard banner. */}
      </Card>

      {/* ── RIGHT COLUMN ───────────────────────────────────────── */}
      <RightCol>
        {/* EXAM: submitted → review list */}
        {mode === "exam" && engine.attempt?.submittedAt && examView === "review_list" && (
          <Card>
            <ResultsHero $pass={examPassed}>
              <ResultsIcon $pass={examPassed}>
                {examPassed ? "Passed" : "Review"}
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

            {/* Domain breakdown — collapsible */}
            {result && (
              <>
                <Divider />
                <SectionToggleBtn onClick={() => setShowDomainSection((v) => !v)}>
                  Score by Domain
                  <SectionArrow $open={showDomainSection}>▼</SectionArrow>
                </SectionToggleBtn>
                {showDomainSection && (
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
                )}
              </>
            )}

            {/* Adaptive insights — collapsible */}
            {adaptiveSummary && (
              <>
                <Divider />
                <SectionToggleBtn onClick={() => setShowInsightsSection((v) => !v)}>
                  Adaptive Insights
                  <SectionArrow $open={showInsightsSection}>▼</SectionArrow>
                </SectionToggleBtn>
                {showInsightsSection && (
                  <AdaptiveResults summary={adaptiveSummary} passThreshold={passThreshold} />
                )}
              </>
            )}

            <Divider />

            <ActionRow>
              <RetakeBtn onClick={retakeExam}>Retake Exam</RetakeBtn>
            </ActionRow>

            {/* Question review — collapsible */}
            <Divider />
            <SectionToggleBtn onClick={() => setShowQuestionList((v) => !v)}>
              Question Review ({engine.attempt.questionOrder.length})
              <SectionArrow $open={showQuestionList}>▼</SectionArrow>
            </SectionToggleBtn>

            {showQuestionList && (
              <>
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
                      Flagged ({flaggedCount})
                    </FilterToggle>
                  )}
                </FilterToggleRow>

                <ReviewList>
                  {reviewRows.map((r) => (
                    <ReviewItem key={r.qid} $ok={r.isCorrect} onClick={() => openReviewQuestion(r.idx)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <ReviewItemMeta>
                          Q{r.idx + 1} · {r.isCorrect ? "Correct" : "Incorrect"}
                          {r.isFlagged && <ReviewFlagBadge> Flagged</ReviewFlagBadge>}
                        </ReviewItemMeta>
                        {r.promptPreview && <ReviewItemPrompt>{r.promptPreview}{r.promptPreview.length >= 72 ? "…" : ""}</ReviewItemPrompt>}
                      </div>
                      <ReviewStatusDot $ok={r.isCorrect}>
                        {r.isCorrect ? "Correct" : "Wrong"}
                      </ReviewStatusDot>
                    </ReviewItem>
                  ))}
                </ReviewList>
              </>
            )}
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
            </Card>

            <ExplanationCard>
              <ExplanationHeader>
                <ExplanationIcon>?</ExplanationIcon>
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

            {/* Compact nav row — sits below explanation */}
            <ReviewNavRow>
              <ReviewNavBtn
                onClick={() => openReviewQuestion(engine.attempt!.currentIndex - 1)}
                disabled={engine.attempt!.currentIndex <= 0}
              >
                ← Prev
              </ReviewNavBtn>
              <ReviewNavBtn
                $muted
                onClick={() => setExamView("review_list")}
              >
                ↩ Results
              </ReviewNavBtn>
              <ReviewNavBtn
                $primary
                onClick={() => openReviewQuestion(engine.attempt!.currentIndex + 1)}
                disabled={engine.attempt!.currentIndex >= total - 1}
              >
                Next →
              </ReviewNavBtn>
            </ReviewNavRow>
          </>
        )}

        {/* PRACTICE COMPLETE banner */}
        {practiceSubmitted && result && (
          <CompleteCard>
            <CompleteEmoji>{(result.totalScore / result.maxScore) >= 0.8 ? "Excellent" : (result.totalScore / result.maxScore) >= 0.6 ? "Good" : "Review"}</CompleteEmoji>
            <CompleteTitle>
              {(result.totalScore / result.maxScore) >= 0.8
                ? "Excellent Work!"
                : (result.totalScore / result.maxScore) >= 0.6
                ? "Good Progress!"
                : "Keep Studying!"}
            </CompleteTitle>
            <CompleteActions>
              <CompletePrimaryBtn onClick={retakePractice}>New Session</CompletePrimaryBtn>
              {incorrectCount > 0 && (
                <CompleteSecondaryBtn onClick={retryIncorrect}>Retry {incorrectCount} Wrong</CompleteSecondaryBtn>
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

        {/* Flagged-only review banner */}
        {reviewingFlagged && !engine.attempt?.submittedAt && (
          <FlaggedReviewBanner>
            <span>🚩 Reviewing {flaggedIndices.length} flagged question{flaggedIndices.length !== 1 ? "s" : ""} only</span>
            <FlaggedReviewExitBtn onClick={() => setReviewingFlagged(false)}>
              ✕ Show All
            </FlaggedReviewExitBtn>
          </FlaggedReviewBanner>
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

            {/* Show Explanation toggle — below the question card */}
            {mode === "practice" && currentId && submittedQ[currentId] && (
              <LearnMoreBtn onClick={() => setShowExplain((prev) => ({ ...prev, [currentId]: !prev[currentId] }))}>
                {showExplain[currentId] ? "▲ Hide Explanation" : "▼ Show Explanation"}
              </LearnMoreBtn>
            )}

            {mode === "practice" && current && currentId && showExplain[currentId] && (
              <ExplanationCard>
                <ExplanationHeader>
                  <ExplanationIcon>?</ExplanationIcon>
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

            {/* Mobile bottom navigation — matches 3-button practice layout */}
            <MobileNavBar>
              <NavBtn
                onClick={() => reviewingFlagged ? goPrevFlagged() : engine.prev()}
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
                  $flagged={!!engine.attempt.flagged[currentId]}
                  onClick={() => engine.toggleFlagCurrent()}
                  style={{ flex: "0 0 auto" }}
                  aria-label="Flag question"
                  title={engine.attempt.flagged[currentId] ? "Unflag" : "Flag for review"}
                >
                  {engine.attempt.flagged[currentId] ? "✓ Flagged" : "Flag"}
                </NavBtn>
              )}
            </MobileNavBar>

            {/* Mobile Submit — exam only, separate full-width row below nav */}
            {mode === "exam" && !engine.attempt?.submittedAt && (
              <MobileSubmitBtn onClick={initiateSubmit} disabled={!engine.attempt}>
                Submit Exam
              </MobileSubmitBtn>
            )}
          </>
        )}
      </RightCol>

      {/* ── Processing overlay (exam mode) ──────────────────── */}
      {showProcessing && (
        <ProcessingOverlay
          minDuration={3000}
          onComplete={handleProcessingComplete}
        />
      )}

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

            <ReviewToggleRow onClick={() => setShowReviewAfterSubmit((v) => !v)}>
              <ToggleSwitch $on={showReviewAfterSubmit} />
              Review answers after submission
            </ReviewToggleRow>

            <ConfirmActions>
              {flaggedCount > 0 && (
                <ConfirmReviewBtn onClick={() => {
                  setShowSubmitConfirm(false);
                  setReviewingFlagged(true);
                  // Jump to first flagged question
                  const firstFlagged = engine.attempt?.questionOrder.findIndex(
                    (qid) => engine.attempt!.flagged[qid]
                  ) ?? -1;
                  if (firstFlagged >= 0) engine.goToIndex(firstFlagged);
                }}>
                  Review {flaggedCount} Flagged Question{flaggedCount !== 1 ? "s" : ""}
                </ConfirmReviewBtn>
              )}
              <ConfirmSubmitBtn onClick={confirmSubmit}>
                {showReviewAfterSubmit ? "Submit & Review →" : "Submit & Exit →"}
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
