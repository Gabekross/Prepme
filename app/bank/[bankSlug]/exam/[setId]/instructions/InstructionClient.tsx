"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
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

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

/* ── sample questions (inline mini-quiz) ─────────────────────────────────── */

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
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  border: 1px solid ${(p) => p.theme.accent}33;
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
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 15px;
  line-height: 1.6;
  max-width: 540px;
  margin: 0 auto;
`;

/* ── stats row ───────────────────────────────────────────────────────────── */

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 28px;
  animation: ${fadeUp} 400ms 100ms ease both;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
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

/* ── tabs ────────────────────────────────────────────────────────────────── */

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 5px;
  margin-bottom: 16px;
  animation: ${fadeUp} 400ms 130ms ease both;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const TabBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  min-width: 80px;
  padding: 9px 14px;
  border-radius: 11px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;

  ${(p) =>
    p.$active
      ? css`
          background: ${p.theme.accent};
          color: ${p.theme.accentText};
          box-shadow: 0 2px 8px ${p.theme.accent}40;
        `
      : css`
          background: transparent;
          color: ${p.theme.muted};
          &:hover { background: ${p.theme.cardBorder}; color: ${p.theme.text}; }
        `}
`;

/* ── tab panels ──────────────────────────────────────────────────────────── */

const Panel = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 22px 20px;
  margin-bottom: 16px;
  animation: ${slideIn} 200ms ease both;

  @media (min-width: 480px) {
    padding: 26px 26px;
  }
`;

const PanelTitle = styled.h2`
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.1px;
  color: ${(p) => p.theme.text};
`;

/* overview tab */

const DomainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const DomainCard = styled.div<{ $color: string }>`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.$color}33;
  border-radius: 14px;
  padding: 14px 16px;
  text-align: center;
`;

const DomainPct = styled.div<{ $color: string }>`
  font-size: 24px;
  font-weight: 900;
  color: ${(p) => p.$color};
  letter-spacing: -0.5px;
`;

const DomainName = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  margin: 4px 0 2px;
`;

const DomainCount = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
`;

const WhatToExpect = styled.div`
  display: grid;
  gap: 10px;
`;

const ExpectItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.55;
  color: ${(p) => p.theme.mutedStrong};
`;

const ExpectDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => p.theme.accent};
  flex-shrink: 0;
  margin-top: 7px;
`;

/* rules tab */

const RuleList = styled.ol`
  margin: 0;
  padding: 0 0 0 20px;
  display: grid;
  gap: 12px;
`;

const RuleItem = styled.li`
  font-size: 13.5px;
  line-height: 1.6;
  color: ${(p) => p.theme.mutedStrong};
`;

/* navigation tab */

const NavGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const NavItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const NavIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  font-size: 16px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

const NavContent = styled.div``;
const NavLabel = styled.div`
  font-size: 13.5px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin-bottom: 2px;
`;
const NavDesc = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
`;

/* tips tab */

const TipList = styled.div`
  display: grid;
  gap: 14px;
`;

const TipItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 13.5px;
  line-height: 1.55;
  color: ${(p) => p.theme.mutedStrong};
`;

const TipNum = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  font-size: 11px;
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
    border-color: ${(p) => p.theme.accent};
    color: ${(p) => p.theme.accent};
    background: ${(p) => p.theme.accentSoft};
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

const QuizProgress = styled.div`
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
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
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
    if (p.$wrong) return p.theme.error ?? "#ef4444";
    if (p.$selected) return p.theme.accent;
    return p.theme.cardBorder;
  }};
  background: ${(p) => {
    if (p.$correct) return p.theme.successSoft;
    if (p.$wrong) return (p.theme.errorSoft ?? "#fef2f2");
    if (p.$selected && !p.$revealed) return p.theme.accentSoft;
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
      border-color: ${p.theme.accent};
      background: ${p.theme.accentSoft};
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
  background: ${(p) => p.theme.accentSoft};
  border: 1px solid ${(p) => p.theme.accent}33;
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
  color: ${(p) => p.theme.accent};
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

const QuizNavBtn = styled.button<{ $primary?: boolean }>`
  padding: 10px 20px;
  border-radius: 10px;
  border: ${(p) => p.$primary ? "none" : `1px solid ${p.theme.cardBorder}`};
  background: ${(p) => p.$primary ? p.theme.accent : "transparent"};
  color: ${(p) => p.$primary ? p.theme.accentText : p.theme.muted};
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    ${(p) => p.$primary
      ? css`background: ${p.theme.accentHover}; transform: translateY(-1px);`
      : css`color: ${p.theme.text}; border-color: ${p.theme.text};`}
  }

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

/* ── CTA ─────────────────────────────────────────────────────────────────── */

const CtaWrap = styled.div`
  text-align: center;
  margin-top: 32px;
  animation: ${fadeUp} 400ms 220ms ease both;
`;

const BeginBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 44px;
  border-radius: 16px;
  background: ${(p) => p.theme.accent};
  color: ${(p) => p.theme.accentText};
  font-size: 16px;
  font-weight: 800;
  text-decoration: none;
  letter-spacing: 0.1px;
  transition: background 150ms ease, transform 100ms ease, box-shadow 150ms ease;
  box-shadow: 0 4px 20px ${(p) => p.theme.accent}40;

  &:hover {
    background: ${(p) => p.theme.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 6px 28px ${(p) => p.theme.accent}50;
  }

  &:active { transform: translateY(0); }
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

/* ── set label helpers ───────────────────────────────────────────────────── */

const SET_LABELS: Record<string, string> = {
  "set-a": "Set A",
  "set-b": "Set B",
  "set-c": "Set C",
  set_a: "Set A",
  set_b: "Set B",
  set_c: "Set C",
};

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
          <QuizResultLabel>{pass ? "Great work!" : "Keep studying!"}</QuizResultLabel>
          <QuizResultSub>
            {pass
              ? "You answered most sample questions correctly. You're ready to tackle the full simulation."
              : "Review the domains and tips above, then give the full simulation a shot — practice makes perfect."}
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
        <QuizProgress>{idx + 1} / {SAMPLE_QUESTIONS.length}</QuizProgress>
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
        <QuizRestartBtn onClick={onClose}>Close quiz</QuizRestartBtn>
        <QuizNavBtn
          $primary
          onClick={handleNext}
          disabled={!revealed}
        >
          {idx + 1 >= SAMPLE_QUESTIONS.length ? "See Results →" : "Next Question →"}
        </QuizNavBtn>
      </QuizNavRow>
    </QuizCard>
  );
}

/* ── types ───────────────────────────────────────────────────────────────── */

type Tab = "overview" | "rules" | "navigation" | "tips";

const PRO_SETS = ["set-b", "set-c"];

interface Props {
  bankSlug: string;
  setSlug: string;
}

/* ── component ───────────────────────────────────────────────────────────── */

export default function InstructionClient({ bankSlug, setSlug }: Props) {
  const { isPro, phase } = useAuth();
  const router = useRouter();
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showQuiz, setShowQuiz] = useState(false);

  const setLabel = SET_LABELS[setSlug] ?? setSlug.replace(/-/g, " ").toUpperCase();

  useEffect(() => {
    if (phase === "ready" && !isPro && PRO_SETS.includes(setSlug)) {
      router.replace(`/bank/${bankSlug}`);
    }
  }, [phase, isPro, setSlug, bankSlug, router]);

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

  if (loading) return <Loading>Preparing exam details...</Loading>;

  const duration = bankConfig?.durationMinutes ?? 230;
  const passThreshold = bankConfig?.passThreshold ?? 61;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
  const secsPerQ = Math.round((duration / 180) * 60);

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "rules", label: "Rules" },
    { id: "navigation", label: "Navigation" },
    { id: "tips", label: "Tips" },
  ];

  return (
    <Page>
      <Breadcrumb>
        <BreadcrumbLink href="/">Exams</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <BreadcrumbLink href={`/bank/${bankSlug}`}>PMP</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <span>{setLabel}</span>
      </Breadcrumb>

      {/* ── hero ── */}
      <Hero>
        <ModeBadge>Exam Simulation</ModeBadge>
        <Title>PMP Exam Simulation — {setLabel}</Title>
        <Subtitle>
          A full-length, timed simulation that mirrors the real PMI® exam experience.
          Read the details below, then begin when you're ready.
        </Subtitle>
      </Hero>

      {/* ── stats ── */}
      <StatsGrid>
        <StatCard>
          <StatValue>180</StatValue>
          <StatLabel>Questions</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{durationStr}</StatValue>
          <StatLabel>Time Limit</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{passThreshold}%</StatValue>
          <StatLabel>Pass Mark</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>3</StatValue>
          <StatLabel>Domains</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* ── tabs ── */}
      <TabBar>
        {TABS.map((t) => (
          <TabBtn key={t.id} $active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </TabBtn>
        ))}
      </TabBar>

      {/* ── overview panel ── */}
      {activeTab === "overview" && (
        <Panel>
          <PanelTitle>Domain Breakdown</PanelTitle>
          <DomainGrid>
            <DomainCard $color="#6366f1">
              <DomainPct $color="#6366f1">42%</DomainPct>
              <DomainName>People</DomainName>
              <DomainCount>~76 questions</DomainCount>
            </DomainCard>
            <DomainCard $color="#10b981">
              <DomainPct $color="#10b981">50%</DomainPct>
              <DomainName>Process</DomainName>
              <DomainCount>~90 questions</DomainCount>
            </DomainCard>
            <DomainCard $color="#f59e0b">
              <DomainPct $color="#f59e0b">8%</DomainPct>
              <DomainName>Business Env.</DomainName>
              <DomainCount>~14 questions</DomainCount>
            </DomainCard>
          </DomainGrid>

          <PanelTitle>What to Expect</PanelTitle>
          <WhatToExpect>
            <ExpectItem>
              <ExpectDot />
              Scenario-based questions drawn from predictive, agile, and hybrid project environments.
            </ExpectItem>
            <ExpectItem>
              <ExpectDot />
              Question types include multiple choice, drag-and-drop matching, ordering, and hotspot questions.
            </ExpectItem>
            <ExpectItem>
              <ExpectDot />
              Results include a domain score breakdown and performance insights immediately after submission.
            </ExpectItem>
            <ExpectItem>
              <ExpectDot />
              Your progress is saved automatically — if you close the browser, you can resume where you left off.
            </ExpectItem>
          </WhatToExpect>
        </Panel>
      )}

      {/* ── rules panel ── */}
      {activeTab === "rules" && (
        <Panel>
          <PanelTitle>Exam Rules</PanelTitle>
          <RuleList>
            <RuleItem>
              The timer starts the moment you click <strong>Begin Exam</strong> and cannot be paused or reset.
            </RuleItem>
            <RuleItem>
              You may navigate freely between questions at any time during the exam using the question navigator.
            </RuleItem>
            <RuleItem>
              Use the <strong>Flag</strong> button to mark questions for review. All flagged questions are listed before final submission.
            </RuleItem>
            <RuleItem>
              Unanswered questions are counted as incorrect. Review the summary screen before submitting.
            </RuleItem>
            <RuleItem>
              Once submitted, your answers are final and cannot be changed. Results are calculated immediately.
            </RuleItem>
            <RuleItem>
              A minimum score of <strong>{passThreshold}%</strong> is required to pass. Scores are broken down by domain.
            </RuleItem>
          </RuleList>
        </Panel>
      )}

      {/* ── navigation panel ── */}
      {activeTab === "navigation" && (
        <Panel>
          <PanelTitle>How to Navigate</PanelTitle>
          <NavGrid>
            <NavItem>
              <NavIcon>&#9776;</NavIcon>
              <NavContent>
                <NavLabel>Question Map</NavLabel>
                <NavDesc>
                  Open the question map to see all 180 questions at a glance. Answered questions are highlighted; flagged questions are marked. Tap any item to jump directly to it.
                </NavDesc>
              </NavContent>
            </NavItem>
            <NavItem>
              <NavIcon>&#9873;</NavIcon>
              <NavContent>
                <NavLabel>Flag for Review</NavLabel>
                <NavDesc>
                  Not sure about an answer? Flag the question and keep moving. Before you submit, you'll see a list of all flagged questions to review.
                </NavDesc>
              </NavContent>
            </NavItem>
            <NavItem>
              <NavIcon>&#8987;</NavIcon>
              <NavContent>
                <NavLabel>Timer</NavLabel>
                <NavDesc>
                  The countdown timer is visible at all times. With {durationStr} for 180 questions, aim for roughly {secsPerQ} seconds per question on average.
                </NavDesc>
              </NavContent>
            </NavItem>
            <NavItem>
              <NavIcon>&#128190;</NavIcon>
              <NavContent>
                <NavLabel>Auto-Save</NavLabel>
                <NavDesc>
                  Your answers are saved automatically as you go. If you accidentally close your browser, re-open the exam link and choose "Resume" to continue from where you left off.
                </NavDesc>
              </NavContent>
            </NavItem>
          </NavGrid>
        </Panel>
      )}

      {/* ── tips panel ── */}
      {activeTab === "tips" && (
        <Panel>
          <PanelTitle>Tips for Success</PanelTitle>
          <TipList>
            <TipItem>
              <TipNum>1</TipNum>
              <span>
                Read each question carefully and identify <em>what is being asked</em> before reviewing the choices. Scenario-based questions often have multiple plausible answers — look for the <strong>best</strong> response.
              </span>
            </TipItem>
            <TipItem>
              <TipNum>2</TipNum>
              <span>
                Manage your time. With approximately {secsPerQ} seconds per question, avoid spending more than 90 seconds on any single item — flag it and come back.
              </span>
            </TipItem>
            <TipItem>
              <TipNum>3</TipNum>
              <span>
                Eliminate wrong answers first. In most scenario questions, two options are clearly off-track. Narrow to two and choose the one most aligned with PMI® principles.
              </span>
            </TipItem>
            <TipItem>
              <TipNum>4</TipNum>
              <span>
                Think like a <strong>proactive, ethical project manager</strong>. PMI® favors answers that address root causes, involve the team, and follow proper processes — not quick fixes or shortcuts.
              </span>
            </TipItem>
            <TipItem>
              <TipNum>5</TipNum>
              <span>
                Before you submit, use the summary screen to ensure every question is answered and all flagged items have been revisited. A final 2-minute review can make a real difference.
              </span>
            </TipItem>
          </TipList>
        </Panel>
      )}

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
        <BeginBtn href={`/bank/${bankSlug}/exam/${setSlug}`}>
          Begin Full Simulation
        </BeginBtn>
        <CtaNote>
          Timer starts immediately. Make sure you are in a quiet, distraction-free environment.
        </CtaNote>
      </CtaWrap>
    </Page>
  );
}
