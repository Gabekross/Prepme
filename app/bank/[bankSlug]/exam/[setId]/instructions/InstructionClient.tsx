"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { BankConfig } from "@/src/exam-engine/data/loadFromSupabase";
import { loadBankBySlug } from "@/src/exam-engine/data/loadFromSupabase";

/* ── animations ──────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── layout ──────────────────────────────────────────────────────────────── */

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 64px;

  @media (min-width: 640px) {
    padding: 40px 20px 80px;
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

/* ── header ──────────────────────────────────────────────────────────────── */

const Header = styled.div`
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
  margin: 0 0 8px;
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${(p) => p.theme.text};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 15px;
  line-height: 1.6;
`;

/* ── info grid ───────────────────────────────────────────────────────────── */

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 28px;
  animation: ${fadeUp} 400ms 100ms ease both;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
`;

const InfoCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 14px;
  padding: 14px 16px;
  text-align: center;
`;

const InfoValue = styled.div`
  font-size: 20px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.3px;
`;

const InfoLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

/* ── rules section ───────────────────────────────────────────────────────── */

const Section = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 16px;
  animation: ${fadeUp} 400ms 150ms ease both;

  @media (min-width: 480px) {
    padding: 24px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.1px;
  color: ${(p) => p.theme.text};
`;

const RuleList = styled.ol`
  margin: 0;
  padding: 0 0 0 20px;
  display: grid;
  gap: 10px;
`;

const RuleItem = styled.li`
  font-size: 13.5px;
  line-height: 1.55;
  color: ${(p) => p.theme.mutedStrong};
`;

const TipList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
`;

const TipItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.55;
  color: ${(p) => p.theme.mutedStrong};
`;

const TipIcon = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

/* ── CTA ─────────────────────────────────────────────────────────────────── */

const CtaWrap = styled.div`
  text-align: center;
  margin-top: 32px;
  animation: ${fadeUp} 400ms 200ms ease both;
`;

const BeginBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 40px;
  border-radius: 14px;
  background: ${(p) => p.theme.accent};
  color: ${(p) => p.theme.accentText};
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;
  letter-spacing: 0.2px;
  transition: background 150ms ease, transform 100ms ease, box-shadow 150ms ease;
  box-shadow: 0 4px 16px ${(p) => p.theme.accent}40;

  &:hover {
    background: ${(p) => p.theme.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 6px 24px ${(p) => p.theme.accent}50;
  }

  &:active {
    transform: translateY(0);
  }
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

/* ── component ───────────────────────────────────────────────────────────── */

interface Props {
  bankSlug: string;
  setSlug: string;
}

const PRO_SETS = ["set-b", "set-c"];

export default function InstructionClient({ bankSlug, setSlug }: Props) {
  const { isPro, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const setLabel = SET_LABELS[setSlug] ?? setSlug.replace(/-/g, " ").toUpperCase();

  // Redirect free users away from Pro-only sets
  useEffect(() => {
    if (!authLoading && !isPro && PRO_SETS.includes(setSlug)) {
      router.replace(`/bank/${bankSlug}`);
    }
  }, [authLoading, isPro, setSlug, bankSlug, router]);

  useEffect(() => {
    (async () => {
      try {
        const bank = await loadBankBySlug(bankSlug);
        setBankConfig(bank);
      } catch {
        // Fallback defaults
        setBankConfig({
          id: "fallback",
          slug: bankSlug,
          durationMinutes: 230,
          passThreshold: 61,
        });
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
  const durationStr = hours > 0
    ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    : `${mins}m`;

  return (
    <Page>
      <Breadcrumb>
        <BreadcrumbLink href="/">Exams</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <BreadcrumbLink href={`/bank/${bankSlug}`}>PMP</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <span>{setLabel}</span>
      </Breadcrumb>

      <Header>
        <ModeBadge>Exam Simulation</ModeBadge>
        <Title>PMP Exam Simulation — {setLabel}</Title>
        <Subtitle>
          Review the exam parameters and instructions below before you begin.
          Once started, the timer cannot be paused.
        </Subtitle>
      </Header>

      <InfoGrid>
        <InfoCard>
          <InfoValue>180</InfoValue>
          <InfoLabel>Questions</InfoLabel>
        </InfoCard>
        <InfoCard>
          <InfoValue>{durationStr}</InfoValue>
          <InfoLabel>Time Limit</InfoLabel>
        </InfoCard>
        <InfoCard>
          <InfoValue>{passThreshold}%</InfoValue>
          <InfoLabel>Pass Threshold</InfoLabel>
        </InfoCard>
        <InfoCard>
          <InfoValue>3</InfoValue>
          <InfoLabel>Domains</InfoLabel>
        </InfoCard>
      </InfoGrid>

      <Section>
        <SectionTitle>Exam Rules</SectionTitle>
        <RuleList>
          <RuleItem>
            The exam timer will begin as soon as you click <strong>Begin Exam</strong>.
            The timer cannot be paused or reset once started.
          </RuleItem>
          <RuleItem>
            You must answer all questions before submitting. Unanswered questions will be
            marked as incorrect.
          </RuleItem>
          <RuleItem>
            You may navigate freely between questions using the navigation controls.
            Use the <strong>Flag</strong> feature to mark questions you wish to revisit
            before submitting.
          </RuleItem>
          <RuleItem>
            Your progress is saved automatically. If you accidentally close your browser,
            you can resume from where you left off.
          </RuleItem>
          <RuleItem>
            Once you submit the exam, your answers are final and cannot be changed.
            Results will be calculated and displayed immediately after submission.
          </RuleItem>
          <RuleItem>
            Your score will be broken down by domain (People, Process, Business Environment)
            and by question type. A minimum of {passThreshold}% is required to pass.
          </RuleItem>
        </RuleList>
      </Section>

      <Section>
        <SectionTitle>Tips for Success</SectionTitle>
        <TipList>
          <TipItem>
            <TipIcon>1</TipIcon>
            <span>
              Read each question carefully and identify what is being asked before
              reviewing the answer choices. Many questions are scenario-based and
              require contextual judgment.
            </span>
          </TipItem>
          <TipItem>
            <TipIcon>2</TipIcon>
            <span>
              Manage your time wisely. With {duration} minutes for 180 questions,
              you have approximately {Math.round((duration / 180) * 60)} seconds
              per question. Do not spend too long on any single question.
            </span>
          </TipItem>
          <TipItem>
            <TipIcon>3</TipIcon>
            <span>
              If you are unsure about a question, flag it and move on. You can review
              all flagged questions before final submission.
            </span>
          </TipItem>
          <TipItem>
            <TipIcon>4</TipIcon>
            <span>
              Before submitting, review the summary screen to ensure you have answered
              every question and revisited any items you flagged for review.
            </span>
          </TipItem>
          <TipItem>
            <TipIcon>5</TipIcon>
            <span>
              Eliminate obviously incorrect answers first. In scenario-based questions,
              focus on the approach that best aligns with PMP principles and the
              situation described.
            </span>
          </TipItem>
        </TipList>
      </Section>

      <CtaWrap>
        <BeginBtn href={`/bank/${bankSlug}/exam/${setSlug}`}>
          Begin Exam
        </BeginBtn>
        <CtaNote>
          Your timer will start immediately. Make sure you are ready.
        </CtaNote>
      </CtaWrap>
    </Page>
  );
}
