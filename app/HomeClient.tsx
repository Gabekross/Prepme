"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Bank = { id: string; slug: string; name: string; description: string | null };

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── hero ────────────────────────────────────────────────────────────────── */

const Hero = styled.div`
  text-align: center;
  padding: 32px 0 32px;
  animation: ${fadeUp} 500ms ease both;

  @media (min-width: 640px) {
    padding: 48px 0 40px;
  }
`;

const HeroKicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 999px;
  background: ${(p) => p.theme.accentSoft};
  border: 1px solid ${(p) => p.theme.accent}33;
  color: ${(p) => p.theme.accent};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-bottom: 20px;
`;

const H1 = styled.h1`
  margin: 0 0 14px;
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 900;
  letter-spacing: -0.8px;
  line-height: 1.15;
  color: ${(p) => p.theme.text};
`;

const HeroSub = styled.p`
  margin: 0 auto;
  max-width: 520px;
  color: ${(p) => p.theme.muted};
  font-size: 15px;
  line-height: 1.6;
`;

/* ── stats row ───────────────────────────────────────────────────────────── */

const StatsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 32px;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-top: 2px;
`;

/* ── section header ──────────────────────────────────────────────────────── */

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  animation: ${fadeUp} 500ms 100ms ease both;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.2px;
  color: ${(p) => p.theme.text};
`;

const SectionCount = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
`;

/* ── grid ─────────────────────────────────────────────────────────────────── */

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  max-width: 420px;
  margin: 0 auto;
  animation: ${fadeUp} 500ms 160ms ease both;
`;

/* ── card accent colors (cycling) ─────────────────────────────────────────── */

const ACCENTS = [
  { from: "#3b82f6", to: "#6366f1" },
  { from: "#8b5cf6", to: "#ec4899" },
  { from: "#06b6d4", to: "#3b82f6" },
  { from: "#f59e0b", to: "#ef4444" },
  { from: "#10b981", to: "#06b6d4" },
  { from: "#f97316", to: "#8b5cf6" },
];

const Card = styled(Link)<{ $idx: number }>`
  text-decoration: none;
  color: inherit;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 20px;
  box-shadow: ${(p) => p.theme.shadow};
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  min-width: 0;

  @media (min-width: 480px) {
    padding: 24px;
  }
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;

  &::before {
    content: "";
    position: absolute;
    top: -60px;
    right: -60px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: ${(p) => {
      const a = ACCENTS[p.$idx % ACCENTS.length];
      return `radial-gradient(circle at center, ${a.from}22, transparent 70%)`;
    }};
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${(p) => p.theme.shadowLg};
    border-color: ${(p) => {
      const a = ACCENTS[p.$idx % ACCENTS.length];
      return `${a.from}60`;
    }};
  }

  &:focus-visible {
    outline: 2px solid ${(p) => p.theme.accent};
    outline-offset: 3px;
  }
`;

const CardIcon = styled.div<{ $idx: number }>`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: ${(p) => {
    const a = ACCENTS[p.$idx % ACCENTS.length];
    return `linear-gradient(135deg, ${a.from}, ${a.to})`;
  }};
  display: grid;
  place-items: center;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px ${(p) => {
    const a = ACCENTS[p.$idx % ACCENTS.length];
    return `${a.from}40`;
  }};
`;

const CardName = styled.div`
  font-weight: 800;
  font-size: 15px;
  line-height: 1.3;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.1px;
  word-break: break-word;
  overflow-wrap: break-word;

  @media (min-width: 480px) {
    font-size: 16px;
  }
`;

const CardDesc = styled.div`
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  line-height: 1.5;
  flex: 1;
  word-break: break-word;
  overflow-wrap: break-word;

  @media (min-width: 480px) {
    font-size: 13.5px;
  }
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid ${(p) => p.theme.divider};
  margin-top: auto;
  flex-wrap: wrap;
  width: 100%;
`;

const FooterPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  font-size: 11.5px;
  font-weight: 700;
`;

const FooterMuted = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
`;

/* ── empty / loading states ──────────────────────────────────────────────── */

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
  color: ${(p) => p.theme.muted};
`;

const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  margin-bottom: 6px;
`;

const EmptyBody = styled.div`
  font-size: 14px;
  line-height: 1.5;
  max-width: 360px;
  margin: 0 auto;
`;

const SkeletonGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  max-width: 420px;
  margin: 0 auto;
`;

const SkeletonCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 20px;
  height: 160px;
  opacity: 0.6;
`;

const BANK_ICONS = ["📚", "🧠", "🎯", "💡", "📝", "🔬", "🏛️", "⚡", "🌐", "🔐"];

const FEATURE_PILLS = [
  { icon: "✏️", label: "Practice Mode" },
  { icon: "🎓", label: "Exam Simulation" },
];

export default function HomeClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data, error } = await sb
        .from("question_banks")
        .select("id,slug,name,description")
        .eq("slug", "pmp")
        .order("name", { ascending: true });

      setLoading(false);
      if (error) {
        setError(`Failed to load exams: ${error.message}`);
        return;
      }
      setBanks((data ?? []) as Bank[]);
    })();
  }, [sb]);

  return (
    <>
      <Hero>
        <HeroKicker>PMP Exam Preparation</HeroKicker>
        <H1>Master the PMP Exam,<br />One Question at a Time</H1>
        <HeroSub>
          Practice with immediate feedback, or run a full timed exam simulation
          — all in one place.
        </HeroSub>

        <StatsRow>
          <StatItem>
            <StatValue>6</StatValue>
            <StatLabel>Question Types</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>2</StatValue>
            <StatLabel>Study Modes</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>100%</StatValue>
            <StatLabel>Free to Use</StatLabel>
          </StatItem>
        </StatsRow>
      </Hero>

      {loading && (
        <SkeletonGrid>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </SkeletonGrid>
      )}

      {!loading && error && (
        <EmptyState>
          <EmptyIcon>⚠️</EmptyIcon>
          <EmptyTitle>Could not load exams</EmptyTitle>
          <EmptyBody>{error}</EmptyBody>
        </EmptyState>
      )}

      {!loading && !error && banks.length === 0 && (
        <EmptyState>
          <EmptyIcon>📭</EmptyIcon>
          <EmptyTitle>No exam banks yet</EmptyTitle>
          <EmptyBody>Add question banks via the Supabase dashboard or admin panel.</EmptyBody>
        </EmptyState>
      )}

      {!loading && !error && banks.length > 0 && (
        <>
          {/* <SectionHeader>
            <SectionTitle>Available Exam Banks</SectionTitle>
            <SectionCount>{banks.length} bank{banks.length !== 1 ? "s" : ""}</SectionCount>
          </SectionHeader> */}

          <Grid>
            {banks.map((b, idx) => (
              <Card key={b.id} href={`/bank/${b.slug}`} $idx={idx}>
                <CardIcon $idx={idx}>{BANK_ICONS[idx % BANK_ICONS.length]}</CardIcon>
                <CardName>{b.name}</CardName>
                <CardDesc>
                  {b.description ?? "Practice questions and full exam simulations for this topic."}
                </CardDesc>
                <CardFooter>
                  {FEATURE_PILLS.map((f) => (
                    <FooterPill key={f.label}>
                      {f.icon} {f.label}
                    </FooterPill>
                  ))}
                  <FooterMuted>Open →</FooterMuted>
                </CardFooter>
              </Card>
            ))}
          </Grid>
        </>
      )}
    </>
  );
}
