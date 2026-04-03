"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Bank = { id: string; slug: string; name: string; description: string | null };

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── breadcrumb ─────────────────────────────────────────────────────────── */

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

  &:hover {
    color: ${(p) => p.theme.text};
  }
`;

const BreadcrumbSep = styled.span`
  opacity: 0.4;
`;

/* ── header ─────────────────────────────────────────────────────────────── */

const Header = styled.div`
  margin-bottom: 36px;
  animation: ${fadeUp} 400ms 50ms ease both;
`;

const BankIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, ${(p) => p.theme.accent} 0%, #7c3aed 100%);
  display: grid;
  place-items: center;
  font-size: 26px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px ${(p) => p.theme.accentSoft};
`;

const H1 = styled.h1`
  margin: 0 0 10px;
  font-size: clamp(20px, 5vw, 30px);
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${(p) => p.theme.text};
  word-break: break-word;
  overflow-wrap: break-word;
`;

const Desc = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.6;
  max-width: 560px;
  word-break: break-word;
  overflow-wrap: break-word;

  @media (min-width: 480px) {
    font-size: 15px;
  }
`;

/* ── section label ──────────────────────────────────────────────────────── */

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
  margin-bottom: 14px;
  animation: ${fadeUp} 400ms 100ms ease both;
`;

/* ── mode cards ─────────────────────────────────────────────────────────── */

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  animation: ${fadeUp} 400ms 140ms ease both;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ModeCard = styled(Link)<{ $variant: "practice" | "exam" }>`
  text-decoration: none;
  color: inherit;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) =>
    p.$variant === "practice" ? p.theme.successBorder : p.theme.cardBorder};
  border-radius: 20px;
  padding: 18px;
  box-shadow: ${(p) => p.theme.shadow};
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;

  @media (min-width: 480px) {
    padding: 24px;
  }
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;

  &::before {
    content: "";
    position: absolute;
    top: -50px;
    right: -50px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: ${(p) =>
      p.$variant === "practice"
        ? `radial-gradient(circle at center, ${p.theme.success}18, transparent 70%)`
        : `radial-gradient(circle at center, ${p.theme.accent}18, transparent 70%)`};
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${(p) => p.theme.shadowLg};
    border-color: ${(p) =>
      p.$variant === "practice" ? p.theme.success : p.theme.accent}80;
  }

  &:focus-visible {
    outline: 2px solid ${(p) =>
      p.$variant === "practice" ? p.theme.success : p.theme.accent};
    outline-offset: 3px;
  }
`;

const ModeHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const ModeIcon = styled.div<{ $variant: "practice" | "exam" }>`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: ${(p) =>
    p.$variant === "practice"
      ? `linear-gradient(135deg, ${p.theme.success}, #06b6d4)`
      : `linear-gradient(135deg, ${p.theme.accent}, #7c3aed)`};
  display: grid;
  place-items: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: ${(p) =>
    p.$variant === "practice"
      ? `0 4px 14px ${p.theme.success}35`
      : `0 4px 14px ${p.theme.accent}35`};
`;

const ModeTitleGroup = styled.div`
  flex: 1;
`;

const ModeTitle = styled.div`
  font-weight: 800;
  font-size: 16px;
  letter-spacing: -0.2px;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
  word-break: break-word;

  @media (min-width: 480px) {
    font-size: 18px;
  }
`;

const ModeSubtitle = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: break-word;

  @media (min-width: 480px) {
    font-size: 13.5px;
  }
`;

const FeatureList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 13px;
  color: ${(p) => p.theme.mutedStrong};
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;

  @media (min-width: 480px) {
    font-size: 13.5px;
  }
`;

const FeatureDot = styled.span<{ $variant: "practice" | "exam" }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${(p) =>
    p.$variant === "practice" ? p.theme.successSoft : p.theme.accentSoft};
  color: ${(p) =>
    p.$variant === "practice" ? p.theme.success : p.theme.accent};
  font-size: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

const CardCta = styled.div<{ $variant: "practice" | "exam" }>`
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  background: ${(p) =>
    p.$variant === "practice" ? p.theme.successSoft : p.theme.accentSoft};
  color: ${(p) =>
    p.$variant === "practice" ? p.theme.success : p.theme.accent};
  align-self: flex-start;
  transition: background 150ms ease;

  ${ModeCard}:hover & {
    background: ${(p) =>
      p.$variant === "practice" ? p.theme.success : p.theme.accent};
    color: white;
  }
`;

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
`;

export default function BankClient({ bankSlug }: { bankSlug: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [bank, setBank] = useState<Bank | null>(null);
  const [msg, setMsg] = useState("Loading…");

  useEffect(() => {
    (async () => {
      const { data, error } = await sb
        .from("question_banks")
        .select("id,slug,name,description")
        .eq("slug", bankSlug)
        .single();

      if (error) {
        setMsg(`Bank not found: ${error.message}`);
        return;
      }

      setBank(data as any);
      setMsg("");
    })();
  }, [sb, bankSlug]);

  if (msg) return <P>{msg}</P>;
  if (!bank) return null;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbLink href="/">Exams</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <span>{bank.name}</span>
      </Breadcrumb>

      <Header>
        <BankIcon>📚</BankIcon>
        <H1>{bank.name}</H1>
        <Desc>
          {bank.description ?? "Choose a study mode to begin. Practice builds knowledge with instant feedback; Exam Simulation tests your readiness under real exam conditions."}
        </Desc>
      </Header>

      <SectionLabel>Choose a study mode</SectionLabel>

      <Grid>
        <ModeCard href={`/bank/${bank.slug}/practice`} $variant="practice">
          <ModeHeader>
            <ModeIcon $variant="practice">✏️</ModeIcon>
            <ModeTitleGroup>
              <ModeTitle>Practice Mode</ModeTitle>
              <ModeSubtitle>Learn at your own pace with guided feedback</ModeSubtitle>
            </ModeTitleGroup>
          </ModeHeader>

          <FeatureList>
            <FeatureItem>
              <FeatureDot $variant="practice">✓</FeatureDot>
              Immediate answer feedback after each submission
            </FeatureItem>
            <FeatureItem>
              <FeatureDot $variant="practice">✓</FeatureDot>
              Detailed explanations to reinforce learning
            </FeatureItem>
            <FeatureItem>
              <FeatureDot $variant="practice">✓</FeatureDot>
              Navigate freely — revisit any question
            </FeatureItem>
            <FeatureItem>
              <FeatureDot $variant="practice">✓</FeatureDot>
              30 randomized questions per session
            </FeatureItem>
          </FeatureList>

          <CardCta $variant="practice">Start Practice →</CardCta>
        </ModeCard>

        <ModeCard href={`/bank/${bank.slug}/exam`} $variant="exam">
          <ModeHeader>
            <ModeIcon $variant="exam">🎓</ModeIcon>
            <ModeTitleGroup>
              <ModeTitle>Exam Simulation</ModeTitle>
              <ModeSubtitle>Full exam experience under realistic conditions</ModeSubtitle>
            </ModeTitleGroup>
          </ModeHeader>

          <FeatureList>
            <FeatureItem>
              <FeatureDot $variant="exam">✓</FeatureDot>
              No feedback until you submit the full exam
            </FeatureItem>
            <FeatureItem>
              <FeatureDot $variant="exam">✓</FeatureDot>
              Detailed review with explanations after submit
            </FeatureItem>
            <FeatureItem>
              <FeatureDot $variant="exam">✓</FeatureDot>
              Score breakdown by domain and question type
            </FeatureItem>
            <FeatureItem>
              <FeatureDot $variant="exam">✓</FeatureDot>
              60 questions — mirrors real exam length
            </FeatureItem>
          </FeatureList>

          <CardCta $variant="exam">Start Simulation →</CardCta>
        </ModeCard>
      </Grid>
    </>
  );
}
