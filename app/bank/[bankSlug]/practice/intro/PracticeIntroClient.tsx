"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUpgrade } from "@/lib/useUpgrade";
import { loadBankBySlug } from "@/src/exam-engine/data/loadFromSupabase";
import type { BankConfig } from "@/src/exam-engine/data/loadFromSupabase";

/* ── animations ──────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

/* ── sample questions (shared with exam intro) ───────────────────────────── */

interface SampleQ {
  id: number;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
  domain: string;
}

const SAMPLE_QUESTIONS: SampleQ[] = [
  {
    id: 1,
    text: "You are managing a software project when a key stakeholder requests a significant scope change mid-execution. What should you do first?",
    options: [
      "Implement the change immediately to keep the stakeholder satisfied",
      "Evaluate the impact through the integrated change control process",
      "Reject the change to protect the original scope baseline",
      "Update the project schedule to accommodate the change",
    ],
    answer: 1,
    explanation:
      "All change requests must go through Integrated Change Control first. This ensures impacts to scope, schedule, cost, and quality are assessed before any action is taken.",
    domain: "Process",
  },
  {
    id: 2,
    text: "Your project is consistently behind schedule despite the team working overtime. What should you analyze first?",
    options: [
      "Team morale and individual performance metrics",
      "The critical path and its current float values",
      "Budget variance and cost performance index",
      "Stakeholder communication frequency",
    ],
    answer: 1,
    explanation:
      "The critical path determines the minimum project duration. Analyzing float values on critical and near-critical activities reveals where schedule compression efforts will have the most impact.",
    domain: "Process",
  },
  {
    id: 3,
    text: "A team member privately tells you they are experiencing burnout and may need to leave the project. What is your best first response?",
    options: [
      "Immediately update the risk register and resource plan",
      "Report the issue to the team member's functional manager",
      "Have a private, empathetic conversation to understand the situation",
      "Redistribute their tasks to other team members proactively",
    ],
    answer: 2,
    explanation:
      "The People domain emphasizes servant leadership and emotional intelligence. Your first action should be to listen and understand — not escalate or act unilaterally — to build trust before taking any organizational steps.",
    domain: "People",
  },
  {
    id: 4,
    text: "The project sponsor asks for status. You know the project is behind schedule but the team believes they can recover. What do you report?",
    options: [
      "Report the current behind-schedule status with the recovery plan",
      "Wait until the team recovers before reporting any issue",
      "Report that the project is on track since recovery is expected",
      "Escalate the concern to the PMO before responding",
    ],
    answer: 0,
    explanation:
      "Transparency and honest reporting are core PMP principles. Report current status accurately — including variances — along with corrective actions. Concealing issues violates professional and ethical standards.",
    domain: "Business Environment",
  },
  {
    id: 5,
    text: "During retrospectives, your agile team consistently identifies the same impediment but the root cause remains unclear. What is the most appropriate next step?",
    options: [
      "Escalate the impediment to organizational leadership immediately",
      "Document it in the risk register and accept it as a known risk",
      "Facilitate a structured root cause analysis (e.g., 5 Whys) with the team",
      "Remove the impediment from future retrospective discussions",
    ],
    answer: 2,
    explanation:
      "When impediments persist, structured root cause analysis (5 Whys, fishbone diagrams) uncovers underlying issues. The project manager facilitates the discovery — not just escalates or accepts the status quo.",
    domain: "Process",
  },
];

/* ── layout ──────────────────────────────────────────────────────────────── */

const Page = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 80px;

  @media (min-width: 640px) {
    padding: 40px 20px 96px;
  }
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 28px;
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

/* ── hero ────────────────────────────────────────────────────────────────── */

const Hero = styled.div`
  text-align: center;
  margin-bottom: 32px;
  animation: ${fadeUp} 400ms 50ms ease both;
`;

const ModeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  background: ${(p) => p.theme.successSoft};
  color: ${(p) => p.theme.success};
  border: 1px solid ${(p) => p.theme.success}33;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  margin: 0 0 10px;
  font-size: clamp(22px, 4vw, 34px);
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${(p) => p.theme.text};
  line-height: 1.2;
`;

const Subtitle = styled.p`
  margin: 0 auto;
  color: ${(p) => p.theme.muted};
  font-size: 15px;
  line-height: 1.6;
  max-width: 540px;
`;

/* ── stats row ───────────────────────────────────────────────────────────── */

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 28px;
  animation: ${fadeUp} 400ms 100ms ease both;
`;

const StatCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 14px 16px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.3px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
  margin-top: 3px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

/* ── count selector ──────────────────────────────────────────────────────── */

const Section = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 22px 20px;
  margin-bottom: 16px;
  animation: ${fadeUp} 400ms 130ms ease both;

  @media (min-width: 480px) {
    padding: 26px 26px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
`;

const SectionSub = styled.p`
  margin: -8px 0 16px;
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
`;

const PresetsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const PresetBtn = styled.button<{ $active: boolean }>`
  padding: 11px 20px;
  border-radius: 12px;
  border: 1.5px solid ${(p) => p.$active ? p.theme.success : p.theme.cardBorder};
  background: ${(p) => p.$active ? p.theme.successSoft : p.theme.buttonBg};
  color: ${(p) => p.$active ? p.theme.success : p.theme.text};
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 150ms ease;
  min-width: 60px;
  text-align: center;

  &:hover {
    border-color: ${(p) => p.theme.success};
    background: ${(p) => p.theme.successSoft};
    color: ${(p) => p.theme.success};
  }
`;

const LockedPresetBtn = styled.button`
  padding: 8px 18px;
  border-radius: 12px;
  border: 1.5px dashed ${(p) => p.theme.cardBorder};
  background: transparent;
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.65;
  transition: all 150ms ease;

  &:hover {
    opacity: 1;
    border-color: ${(p) => p.theme.accent};
    color: ${(p) => p.theme.accent};
  }
`;

const LockBadge = styled.span`
  font-size: 10px;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  border-radius: 4px;
  padding: 1px 5px;
  font-weight: 800;
  letter-spacing: 0.3px;
`;

/* ── what you'll practice ────────────────────────────────────────────────── */

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13.5px;
  color: ${(p) => p.theme.mutedStrong};
  line-height: 1.5;
`;

const FeatureDot = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: ${(p) => p.theme.successSoft};
  color: ${(p) => p.theme.success};
  font-size: 10px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

/* ── mini quiz ───────────────────────────────────────────────────────────── */

const QuizSection = styled.div`
  margin-bottom: 16px;
  animation: ${fadeUp} 400ms 180ms ease both;
`;

const QuizToggleBtn = styled.button`
  width: 100%;
  padding: 14px 20px;
  border-radius: 16px;
  border: 1.5px dashed ${(p) => p.theme.cardBorder};
  background: transparent;
  color: ${(p) => p.theme.muted};
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 150ms ease;

  &:hover {
    border-color: ${(p) => p.theme.success};
    color: ${(p) => p.theme.success};
    background: ${(p) => p.theme.successSoft};
  }
`;

const QuizCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 24px 20px;
  animation: ${fadeIn} 250ms ease both;

  @media (min-width: 480px) {
    padding: 28px 26px;
  }
`;

const QuizHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const QuizTitle = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${(p) => p.theme.muted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const QuizProgressLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
`;

const QuizDomain = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  background: ${(p) => p.theme.successSoft};
  color: ${(p) => p.theme.success};
  margin-bottom: 12px;
`;

const QuizQuestion = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${(p) => p.theme.text};
  line-height: 1.6;
  margin-bottom: 18px;
`;

const QuizOptions = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
`;

const QuizOption = styled.button<{
  $selected: boolean;
  $correct: boolean | null;
  $wrong: boolean | null;
  $revealed: boolean;
}>`
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid ${(p) => {
    if (p.$correct) return p.theme.success;
    if (p.$wrong) return (p.theme.error ?? "#ef4444");
    if (p.$selected) return p.theme.success;
    return p.theme.cardBorder;
  }};
  background: ${(p) => {
    if (p.$correct) return p.theme.successSoft;
    if (p.$wrong) return (p.theme.errorSoft ?? "#fef2f2");
    if (p.$selected && !p.$revealed) return p.theme.successSoft;
    return "transparent";
  }};
  color: ${(p) => {
    if (p.$correct) return p.theme.success;
    if (p.$wrong) return (p.theme.error ?? "#ef4444");
    return p.theme.text;
  }};
  font-size: 14px;
  font-weight: ${(p) => (p.$selected || p.$correct) ? "700" : "500"};
  line-height: 1.5;
  cursor: ${(p) => (p.$revealed ? "default" : "pointer")};
  transition: all 150ms ease;
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &:hover {
    ${(p) => !p.$revealed && css`
      border-color: ${p.theme.success};
      background: ${p.theme.successSoft};
    `}
  }
`;

const OptionLetter = styled.span`
  min-width: 20px;
  height: 20px;
  border-radius: 6px;
  background: ${(p) => p.theme.cardBorder};
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

const QuizExplanation = styled.div`
  background: ${(p) => p.theme.successSoft};
  border: 1px solid ${(p) => p.theme.success}33;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13.5px;
  color: ${(p) => p.theme.text};
  line-height: 1.6;
  margin-bottom: 16px;
  animation: ${fadeIn} 200ms ease both;
`;

const QuizExplanationLabel = styled.div`
  font-size: 11px;
  font-weight: 800;
  color: ${(p) => p.theme.success};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 4px;
`;

const QuizNavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const QuizCloseBtn = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: transparent;
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
  &:hover { color: ${(p) => p.theme.text}; border-color: ${(p) => p.theme.text}; }
`;

const QuizNextBtn = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: ${(p) => p.theme.success};
  color: white;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover { opacity: 0.9; transform: translateY(-1px); }
  &:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
`;

const QuizResult = styled.div`
  text-align: center;
  padding: 8px 0;
  animation: ${fadeIn} 300ms ease both;
`;

const QuizResultScore = styled.div<{ $pass: boolean }>`
  font-size: 48px;
  font-weight: 900;
  color: ${(p) => p.$pass ? p.theme.success : (p.theme.error ?? "#ef4444")};
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 8px;
`;

const QuizResultLabel = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin-bottom: 6px;
`;

const QuizResultSub = styled.div`
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 20px;
  line-height: 1.5;
`;

const QuizRestartBtn = styled.button`
  padding: 10px 24px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: transparent;
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
  &:hover { color: ${(p) => p.theme.text}; border-color: ${(p) => p.theme.text}; }
`;

/* ── upgrade overlay ─────────────────────────────────────────────────────── */

const UpgradeOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9000;
  display: grid; place-items: center;
  padding: 20px;
  animation: ${fadeIn} 200ms ease both;
`;

const UpgradeCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: ${(p) => p.theme.shadowLg ?? p.theme.shadow};
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

const UpgradeBtn = styled.button`
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
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const UpgradeCloseBtn = styled.button`
  background: none; border: none;
  color: ${(p) => p.theme.muted};
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  padding: 8px 16px;
  &:hover { color: ${(p) => p.theme.text}; }
`;

/* ── CTA ─────────────────────────────────────────────────────────────────── */

const CtaWrap = styled.div`
  text-align: center;
  margin-top: 32px;
  animation: ${fadeUp} 400ms 220ms ease both;
`;

const StartBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 44px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${(p) => p.theme.success}, #06b6d4);
  color: white;
  font-size: 16px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  letter-spacing: 0.1px;
  transition: opacity 150ms ease, transform 100ms ease, box-shadow 150ms ease;
  box-shadow: 0 4px 20px ${(p) => p.theme.success}40;

  &:hover {
    opacity: 0.92;
    transform: translateY(-2px);
    box-shadow: 0 6px 28px ${(p) => p.theme.success}50;
  }

  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const CtaNote = styled.p`
  margin: 12px 0 0;
  font-size: 12px;
  color: ${(p) => p.theme.muted};
`;

const Loading = styled.p`
  text-align: center;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  padding: 64px 0;
`;

/* ── presets config ──────────────────────────────────────────────────────── */

const FREE_PRESETS = [10, 20, 25];
const PRO_PRESETS = [50, 90];
const ALL_PRESETS = [...FREE_PRESETS, ...PRO_PRESETS];

/* ── MiniQuiz component ──────────────────────────────────────────────────── */

function MiniQuiz({ onClose }: { onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = SAMPLE_QUESTIONS[idx];
  const letters = ["A", "B", "C", "D"];

  const handleSelect = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= SAMPLE_QUESTIONS.length) {
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const handleRestart = () => {
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pass = score >= 3;
    return (
      <QuizCard>
        <QuizResult>
          <QuizResultScore $pass={pass}>{score}/{SAMPLE_QUESTIONS.length}</QuizResultScore>
          <QuizResultLabel>{pass ? "Nicely done!" : "Good practice!"}</QuizResultLabel>
          <QuizResultSub>
            {pass
              ? "You're handling the concepts well. Jump into a practice session to keep the momentum going."
              : "Every question you practice builds your understanding. Start a session below to keep improving."}
          </QuizResultSub>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <QuizRestartBtn onClick={handleRestart}>Try Again</QuizRestartBtn>
            <QuizRestartBtn onClick={onClose} style={{ borderColor: "transparent" }}>Close</QuizRestartBtn>
          </div>
        </QuizResult>
      </QuizCard>
    );
  }

  return (
    <QuizCard>
      <QuizHeader>
        <QuizTitle>Sample Questions</QuizTitle>
        <QuizProgressLabel>{idx + 1} / {SAMPLE_QUESTIONS.length}</QuizProgressLabel>
      </QuizHeader>

      <QuizDomain>{q.domain}</QuizDomain>
      <QuizQuestion>{q.text}</QuizQuestion>

      <QuizOptions>
        {q.options.map((opt, i) => (
          <QuizOption
            key={i}
            $selected={selected === i}
            $correct={revealed && i === q.answer ? true : null}
            $wrong={revealed && selected === i && i !== q.answer ? true : null}
            $revealed={revealed}
            onClick={() => handleSelect(i)}
          >
            <OptionLetter>{letters[i]}</OptionLetter>
            {opt}
          </QuizOption>
        ))}
      </QuizOptions>

      {revealed && (
        <QuizExplanation>
          <QuizExplanationLabel>Why this answer?</QuizExplanationLabel>
          {q.explanation}
        </QuizExplanation>
      )}

      <QuizNavRow>
        <QuizCloseBtn onClick={onClose}>Close quiz</QuizCloseBtn>
        <QuizNextBtn onClick={handleNext} disabled={!revealed}>
          {idx + 1 >= SAMPLE_QUESTIONS.length ? "See Results →" : "Next Question →"}
        </QuizNextBtn>
      </QuizNavRow>
    </QuizCard>
  );
}

/* ── component ───────────────────────────────────────────────────────────── */

export default function PracticeIntroClient({ bankSlug }: { bankSlug: string }) {
  const router = useRouter();
  const { isPro } = useAuth();
  const { startCheckout, loading: checkoutLoading } = useUpgrade();
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(20);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const bank = await loadBankBySlug(bankSlug);
        setBankConfig(bank);
      } catch {
        setBankConfig({ id: "fallback", slug: bankSlug, durationMinutes: 230, passThreshold: 61 });
      } finally {
        setLoading(false);
      }
    })();
  }, [bankSlug]);

  const handleStart = () => {
    router.push(`/bank/${bankSlug}/practice?count=${questionCount}`);
  };

  if (loading) return <Loading>Preparing practice session...</Loading>;

  return (
    <Page>
      <Breadcrumb>
        <BreadcrumbLink href="/">Exams</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <BreadcrumbLink href={`/bank/${bankSlug}`}>PMP</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <span>Practice</span>
      </Breadcrumb>

      {/* ── hero ── */}
      <Hero>
        <ModeBadge>Practice Mode</ModeBadge>
        <Title>PMP Practice Session</Title>
        <Subtitle>
          Randomized questions with immediate feedback after every answer.
          Learn, identify weak spots, and build confidence at your own pace.
        </Subtitle>
      </Hero>

      {/* ── stats ── */}
      <StatsGrid>
        <StatCard>
          <StatValue>180+</StatValue>
          <StatLabel>Question Pool</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>3</StatValue>
          <StatLabel>Domains</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>No</StatValue>
          <StatLabel>Time Limit</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* ── count selector ── */}
      <Section>
        <SectionTitle>How many questions?</SectionTitle>
        <SectionSub>
          Questions are randomly drawn from the full pool, balanced across all three PMP domains.
        </SectionSub>
        <PresetsRow>
          {ALL_PRESETS.map((n) => {
            const isProPreset = PRO_PRESETS.includes(n);
            if (isProPreset && !isPro) {
              return (
                <LockedPresetBtn
                  key={n}
                  onClick={() => setShowUpgrade(true)}
                  title="Pro feature"
                >
                  {n}
                  <LockBadge>PRO</LockBadge>
                </LockedPresetBtn>
              );
            }
            return (
              <PresetBtn
                key={n}
                $active={questionCount === n}
                onClick={() => setQuestionCount(n)}
              >
                {n}
              </PresetBtn>
            );
          })}
        </PresetsRow>
      </Section>

      {/* ── what you'll practice ── */}
      <Section>
        <SectionTitle>How practice mode works</SectionTitle>
        <FeatureGrid>
          <FeatureItem>
            <FeatureDot>✓</FeatureDot>
            Immediate correct/incorrect feedback after each answer
          </FeatureItem>
          <FeatureItem>
            <FeatureDot>✓</FeatureDot>
            Full explanations for every question
          </FeatureItem>
          <FeatureItem>
            <FeatureDot>✓</FeatureDot>
            Navigate freely — revisit any answered question
          </FeatureItem>
          <FeatureItem>
            <FeatureDot>✓</FeatureDot>
            No timer — focus on learning, not speed
          </FeatureItem>
          <FeatureItem>
            <FeatureDot>✓</FeatureDot>
            Session auto-saved — resume anytime
          </FeatureItem>
          <FeatureItem>
            <FeatureDot>✓</FeatureDot>
            Domain-balanced question selection
          </FeatureItem>
        </FeatureGrid>
      </Section>

      {/* ── mini quiz ── */}
      <QuizSection>
        {showQuiz ? (
          <MiniQuiz onClose={() => setShowQuiz(false)} />
        ) : (
          <QuizToggleBtn onClick={() => setShowQuiz(true)}>
            <span>&#9654;</span>
            Warm up with 5 sample questions
          </QuizToggleBtn>
        )}
      </QuizSection>

      {/* ── CTA ── */}
      <CtaWrap>
        <StartBtn onClick={handleStart}>
          Start Practice ({questionCount} questions)
        </StartBtn>
        <CtaNote>
          Questions are randomly selected and balanced across People, Process, and Business Environment.
        </CtaNote>
      </CtaWrap>

      {/* ── upgrade modal ── */}
      {showUpgrade && (
        <UpgradeOverlay onClick={() => setShowUpgrade(false)}>
          <UpgradeCard onClick={(e) => e.stopPropagation()}>
            <UpgradeTitle>Upgrade to Study Mode</UpgradeTitle>
            <UpgradeText>
              Most PMP candidates fail because they don't know where they're losing marks. Study Mode shows you exactly that.
            </UpgradeText>
            <UpgradePrice>$29</UpgradePrice>
            <UpgradePriceNote>One-time payment · Lifetime access · Less than a practice exam book</UpgradePriceNote>
            <UpgradeBtn onClick={startCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Redirecting…" : "Unlock Study Mode"}
            </UpgradeBtn>
            <UpgradeCloseBtn onClick={() => setShowUpgrade(false)}>
              Maybe later
            </UpgradeCloseBtn>
          </UpgradeCard>
        </UpgradeOverlay>
      )}
    </Page>
  );
}
