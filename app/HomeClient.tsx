"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const fillBar = keyframes`
  from { width: 0; }
`;

/* ── layout ─────────────────────────────────────────────────────────────── */

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const Section = styled.section<{ $delay?: number }>`
  padding: 48px 0;
  animation: ${fadeUp} 600ms ${(p) => p.$delay ?? 0}ms ease both;

  @media (max-width: 640px) {
    padding: 32px 0;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.divider};
`;

/* ── hero ────────────────────────────────────────────────────────────────── */

const Hero = styled.div`
  text-align: center;
  padding: 40px 0 48px;
  animation: ${fadeUp} 500ms ease both;

  @media (min-width: 640px) {
    padding: 64px 0 56px;
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
  margin: 0 0 16px;
  font-size: clamp(30px, 5.5vw, 48px);
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1.1;
  color: ${(p) => p.theme.text};
`;

const HeroSub = styled.p`
  margin: 0 auto 28px;
  max-width: 560px;
  color: ${(p) => p.theme.muted};
  font-size: 16px;
  line-height: 1.65;
`;

const HeroCTAs = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 14px;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #7c3aed);
  color: white;
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;
  transition: opacity 150ms ease, transform 100ms ease;
  box-shadow: 0 4px 20px ${(p) => p.theme.accent}40;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

const SecondaryCTA = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 14px 24px;
  border-radius: 14px;
  background: ${(p) => p.theme.buttonBg};
  border: 1px solid ${(p) => p.theme.buttonBorder};
  color: ${(p) => p.theme.text};
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const TrustLine = styled.div`
  margin-top: 16px;
  font-size: 13px;
  color: ${(p) => p.theme.muted};
`;

/* ── trust badges ───────────────────────────────────────────────────────── */

const BadgesRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  animation: ${fadeUp} 500ms 100ms ease both;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  white-space: nowrap;
`;


/* ── social proof stats ─────────────────────────────────────────────────── */

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 900;
  color: ${(p) => p.theme.accent};
  letter-spacing: -0.5px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

/* ── section headings ───────────────────────────────────────────────────── */

const SectionHeading = styled.h2`
  margin: 0 0 8px;
  font-size: clamp(22px, 4vw, 30px);
  font-weight: 900;
  letter-spacing: -0.6px;
  color: ${(p) => p.theme.text};
  text-align: center;
`;

const SectionSub = styled.p`
  margin: 0 auto 32px;
  max-width: 520px;
  color: ${(p) => p.theme.muted};
  font-size: 15px;
  line-height: 1.6;
  text-align: center;
`;

/* ── feature cards (why different) ──────────────────────────────────────── */

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: ${(p) => p.theme.shadow};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -40px;
    right: -40px;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    pointer-events: none;
  }
`;

const FeatureIcon = styled.div<{ $gradient: string }>`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${(p) => p.$gradient};
  display: grid;
  place-items: center;
  font-size: 22px;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const FeatureTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.2px;
`;

const FeatureDesc = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: ${(p) => p.theme.muted};
`;

/* ── how it works ───────────────────────────────────────────────────────── */

const StepsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const StepCard = styled.div`
  text-align: center;
  position: relative;
`;

const StepNumber = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  font-size: 18px;
  font-weight: 900;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
  border: 1px solid ${(p) => p.theme.accent}33;
`;

const StepTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
`;

const StepDesc = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: ${(p) => p.theme.muted};
  max-width: 260px;
  margin: 0 auto;
`;

/* ── question types grid ────────────────────────────────────────────────── */

const TypesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const TypeCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px 16px;
  text-align: center;
`;

const TypeIcon = styled.div`
  font-size: 28px;
  margin-bottom: 8px;
`;

const TypeName = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
`;

const TypeTag = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
`;

/* ── testimonials ───────────────────────────────────────────────────────── */

const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TestimonialCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 22px 20px;
  position: relative;
`;

const TestimonialQuote = styled.p`
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: ${(p) => p.theme.text};
  font-style: italic;
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TestimonialAvatar = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(p) => p.$color};
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 800;
  color: white;
`;

const TestimonialName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
`;

const TestimonialRole = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
`;

/* ── pricing ────────────────────────────────────────────────────────────── */

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const PricingCard = styled.div<{ $featured?: boolean }>`
  background: ${(p) => p.theme.cardBg};
  border: 2px solid ${(p) => (p.$featured ? p.theme.accent : p.theme.cardBorder)};
  border-radius: 22px;
  padding: 28px 24px;
  position: relative;
  overflow: hidden;
  box-shadow: ${(p) => (p.$featured ? p.theme.shadowLg : p.theme.shadow)};
`;

const PricingBadge = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 4px 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #7c3aed);
  color: white;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PricingTier = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const PricingPrice = styled.div`
  font-size: 36px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -1px;
  margin-bottom: 4px;
`;

const PricingPeriod = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
`;

const PricingDesc = styled.p`
  margin: 8px 0 20px;
  font-size: 13px;
  line-height: 1.5;
  color: ${(p) => p.theme.muted};
`;

const PricingList = styled.ul`
  list-style: none;
  margin: 0 0 24px;
  padding: 0;
`;

const PricingItem = styled.li<{ $included?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: ${(p) => (p.$included !== false ? p.theme.text : p.theme.muted)};
  line-height: 1.5;
  padding: 5px 0;
  text-decoration: ${(p) => (p.$included === false ? "line-through" : "none")};
  opacity: ${(p) => (p.$included === false ? 0.5 : 1)};
`;

const PricingCheck = styled.span<{ $included?: boolean }>`
  font-size: 14px;
  color: ${(p) => (p.$included !== false ? p.theme.success : p.theme.muted)};
  flex-shrink: 0;
  margin-top: 1px;
`;

const PricingCTA = styled(Link)<{ $featured?: boolean }>`
  display: block;
  text-align: center;
  padding: 12px 20px;
  border-radius: 12px;
  background: ${(p) =>
    p.$featured
      ? `linear-gradient(135deg, ${p.theme.accent}, #7c3aed)`
      : p.theme.buttonBg};
  border: 1px solid ${(p) => (p.$featured ? "transparent" : p.theme.buttonBorder)};
  color: ${(p) => (p.$featured ? "white" : p.theme.text)};
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  transition: opacity 150ms ease, transform 100ms ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

/* ── growth hook CTA ────────────────────────────────────────────────────── */

const CTABanner = styled.div`
  background: linear-gradient(135deg, ${(p) => p.theme.accent}18, #7c3aed18);
  border: 1px solid ${(p) => p.theme.accent}33;
  border-radius: 24px;
  padding: 40px 24px;
  text-align: center;
`;

const CTABannerH = styled.h2`
  margin: 0 0 10px;
  font-size: clamp(20px, 4vw, 26px);
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.4px;
`;

const CTABannerSub = styled.p`
  margin: 0 auto 24px;
  max-width: 440px;
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  line-height: 1.6;
`;

/* ── FAQ ─────────────────────────────────────────────────────────────────── */

const FAQList = styled.div`
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FAQItem = styled.details`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 14px;
  overflow: hidden;

  &[open] summary::after {
    transform: rotate(180deg);
  }
`;

const FAQSummary = styled.summary`
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &::after {
    content: "\\25BC";
    font-size: 10px;
    color: ${(p) => p.theme.muted};
    transition: transform 200ms ease;
    flex-shrink: 0;
    margin-left: 12px;
  }
`;

const FAQAnswer = styled.div`
  padding: 0 20px 16px;
  font-size: 13.5px;
  line-height: 1.65;
  color: ${(p) => p.theme.muted};
`;

/* ── footer ─────────────────────────────────────────────────────────────── */

const Footer = styled.footer`
  padding: 32px 0 24px;
  text-align: center;
  border-top: 1px solid ${(p) => p.theme.divider};
`;

const FooterTagline = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 12px;
`;

const SocialsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(p) => p.theme.buttonBg};
  border: 1px solid ${(p) => p.theme.buttonBorder};
  color: ${(p) => p.theme.muted};
  font-size: 16px;
  text-decoration: none;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
    color: ${(p) => p.theme.text};
  }
`;

/* ── skeleton ───────────────────────────────────────────────────────────── */

const Skeleton = styled.div`
  height: 20px;
  border-radius: 8px;
  background: ${(p) => p.theme.cardBorder};
  animation: ${pulse} 1.5s ease infinite;
`;

/* ── data ────────────────────────────────────────────────────────────────── */

type PlatformStats = { totalAttempts: number; totalPractice: number; totalExams: number };

const QUESTION_TYPES = [
  { icon: "\u2753", name: "Single-Select MCQ", tag: "Choose the best answer" },
  { icon: "\u2705", name: "Multi-Select MCQ", tag: "Select all that apply" },
  { icon: "\uD83D\uDD00", name: "Drag & Match", tag: "Pair items correctly" },
  { icon: "\uD83D\uDCCB", name: "Drag & Order", tag: "Arrange the sequence" },
  { icon: "\uD83D\uDDBC\uFE0F", name: "Hotspot", tag: "Click the correct area" },
  { icon: "\u270D\uFE0F", name: "Fill-in-the-Blank", tag: "Type your answer" },
];

const TESTIMONIALS = [
  {
    quote: "The adaptive engine kept pushing me on my weak areas in Process domain. By exam day, I felt genuinely prepared.",
    name: "Sarah M.",
    role: "Passed PMP, March 2026",
    color: "#3b82f6",
    initial: "S",
  },
  {
    quote: "The timed simulations were a game-changer. The real exam felt familiar because I had already trained in the exact same format.",
    name: "David K.",
    role: "Passed PMP, First Attempt",
    color: "#8b5cf6",
    initial: "D",
  },
  {
    quote: "I scored 42% on my first practice run. The weakness targeting feature helped me focus. Passed with Above Target in all 3 domains.",
    name: "Priya R.",
    role: "PMP Certified, 2026",
    color: "#06b6d4",
    initial: "P",
  },
];

const FREE_FEATURES = [
  { text: "Practice mode with immediate feedback", included: true },
  { text: "20 questions per session (configurable)", included: true },
  { text: "1 exam simulation (Set A)", included: true },
  { text: "Basic results + pass/fail", included: true },
  { text: "Domain performance breakdown", included: true },
  { text: "Full exam simulations (Set B, C)", included: false },
  { text: "Adaptive weakness targeting", included: false },
  { text: "Advanced topic-level analytics", included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free, plus:", included: true },
  { text: "All 3 exam simulations (A, B, C)", included: true },
  { text: "Adaptive difficulty engine", included: true },
  { text: "Weakness targeting per domain & topic", included: true },
  { text: "Weighted scoring (difficulty-adjusted)", included: true },
  { text: "Topic-level mastery insights", included: true },
  { text: "Personalized study recommendations", included: true },
  { text: "Difficulty performance matrix", included: true },
];

const FAQ_DATA = [
  {
    q: "Is this PMP exam simulator updated for 2026?",
    a: "Yes. Our question bank is aligned with the PMBOK 7th Edition and the current PMP Examination Content Outline (ECO). Questions cover all three domains: People (42%), Process (50%), and Business Environment (8%) with the correct weighting.",
  },
  {
    q: "How does the adaptive difficulty engine work?",
    a: "The engine tracks your consecutive correct and incorrect answers. After 3 correct answers in a row, it increases difficulty. After 2 wrong answers, it decreases. It also identifies your weakest domains and topics, then prioritizes those in your next practice session. Harder questions are weighted up to 2.5x in your score.",
  },
  {
    q: "Is there a free PMP mock exam I can take?",
    a: "Yes. The Free tier includes unlimited practice sessions with immediate feedback, plus one full 70-question timed exam simulation (Set A). No credit card required.",
  },
  {
    q: "How many questions are in the question bank?",
    a: "We currently have 400+ unique PMP questions across 6 question types: single-select MCQ, multi-select MCQ, drag-and-drop matching, drag-and-drop ordering, hotspot (image-based), and fill-in-the-blank. This matches the variety you will see on the real PMP exam.",
  },
  {
    q: "What question types are on the real PMP exam?",
    a: "The actual PMP exam includes multiple-choice (single and multi-select), drag-and-drop, hotspot, and fill-in-the-blank questions. Our simulator covers all of these, so you will not encounter any surprises on exam day.",
  },
  {
    q: "How is this different from other PMP practice tests?",
    a: "Most PMP prep tools just shuffle random questions. Our platform uses an adaptive engine that adjusts difficulty based on your performance, targets your weak areas, applies weighted scoring based on question difficulty, and provides detailed analytics down to the topic level. It trains you like the real exam.",
  },
  {
    q: "How do I pass the PMP on my first attempt?",
    a: "Focus on understanding concepts, not memorizing questions. Use our adaptive practice mode to identify and strengthen weak domains. Take at least 2-3 full timed simulations to build exam stamina. Review your analytics after each session and target the areas where you score below 70%.",
  },
];

/* ── component ──────────────────────────────────────────────────────────── */

export default function HomeClient() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("fetch failed");
        const data: PlatformStats = await res.json();
        setStats(data);
      } catch {
        setStats({ totalAttempts: 0, totalPractice: 0, totalExams: 0 });
      }
    })();
  }, []);

  return (
    <Page>
      {/* ── 1. Hero ──────────────────────────────────────────────────── */}
      <Hero>
        <HeroKicker>PMP Exam Simulator 2026</HeroKicker>
        <H1>
          Pass the PMP on
          <br />
          Your First Attempt
        </H1>
        <HeroSub>
          Train like the real exam — adaptive difficulty, real-time weakness
          targeting, and full timed simulations. Not just practice questions.
        </HeroSub>
        <HeroCTAs>
          <PrimaryCTA href="/bank/pmp">
            Start Free Simulation →
          </PrimaryCTA>
          <SecondaryCTA href="#how-it-works">See How It Works</SecondaryCTA>
        </HeroCTAs>
        <TrustLine>No credit card required &middot; Free tier forever</TrustLine>
      </Hero>

      {/* ── 2. Trust Badges ──────────────────────────────────────────── */}
      <BadgesRow>
        <Badge>PMP 2026 Updated</Badge>
        <Badge>PMBOK 7th Edition</Badge>
        <Badge>6 Question Types</Badge>
        <Badge>Adaptive Engine</Badge>
      </BadgesRow>

      <Divider style={{ margin: "40px 0 0" }} />

      {/* ── 3. Social Proof Stats ────────────────────────────────────── */}
      <Section $delay={120}>
        <StatsGrid>
          <StatCard>
            <StatValue>400+</StatValue>
            <StatLabel>PMP Questions</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>3</StatValue>
            <StatLabel>Full Exam Simulations</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>6</StatValue>
            <StatLabel>Question Types</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>
              {stats ? (stats.totalAttempts > 0 ? stats.totalAttempts.toLocaleString() : "New") : "..."}
            </StatValue>
            <StatLabel>Sessions Completed</StatLabel>
          </StatCard>
        </StatsGrid>
      </Section>

      <Divider />

      {/* ── 4. Why This Is Different ─────────────────────────────────── */}
      <Section $delay={160}>
        <SectionHeading>Why This Is Different</SectionHeading>
        <SectionSub>
          Most PMP prep tools just shuffle random questions. We built an exam
          engine that trains you strategically.
        </SectionSub>

        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon $gradient="linear-gradient(135deg, #3b82f6, #6366f1)">
              &#x23F1;&#xFE0F;
            </FeatureIcon>
            <FeatureTitle>Real Exam Simulation</FeatureTitle>
            <FeatureDesc>
              70 questions. 230-minute timer. Domain-weighted scoring that
              mirrors the actual PMP. Feels like the real thing — because it is.
            </FeatureDesc>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $gradient="linear-gradient(135deg, #8b5cf6, #ec4899)">
              &#x1F9E0;
            </FeatureIcon>
            <FeatureTitle>Adaptive Intelligence</FeatureTitle>
            <FeatureDesc>
              Questions get harder as you improve. Weak domains are targeted
              automatically. Difficulty-weighted scoring means harder questions
              count more (up to 2.5x).
            </FeatureDesc>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $gradient="linear-gradient(135deg, #06b6d4, #10b981)">
              &#x1F4CA;
            </FeatureIcon>
            <FeatureTitle>Deep Analytics</FeatureTitle>
            <FeatureDesc>
              Domain mastery bands, topic-level insights, difficulty performance
              matrix, and personalized recommendations. Know exactly where to
              focus.
            </FeatureDesc>
          </FeatureCard>
        </FeatureGrid>
      </Section>

      <Divider />

      {/* ── 5. How It Works ──────────────────────────────────────────── */}
      <Section id="how-it-works" $delay={200}>
        <SectionHeading>How It Works</SectionHeading>
        <SectionSub>
          From zero to PMP-ready in three steps.
        </SectionSub>

        <StepsRow>
          <StepCard>
            <StepNumber>1</StepNumber>
            <StepTitle>Start a Free Practice</StepTitle>
            <StepDesc>
              Pick your question count (10-90). Get immediate feedback after
              every question with detailed explanations.
            </StepDesc>
          </StepCard>

          <StepCard>
            <StepNumber>2</StepNumber>
            <StepTitle>Take a Full Simulation</StepTitle>
            <StepDesc>
              70 questions, 230-minute timer, real exam format. Scored and
              weighted by difficulty — just like the PMP.
            </StepDesc>
          </StepCard>

          <StepCard>
            <StepNumber>3</StepNumber>
            <StepTitle>Focus Your Weak Areas</StepTitle>
            <StepDesc>
              Review analytics by domain, question type, and topic. The adaptive
              engine targets what you get wrong next time.
            </StepDesc>
          </StepCard>
        </StepsRow>
      </Section>

      <Divider />

      {/* ── 6. Question Types ────────────────────────────────────────── */}
      <Section $delay={240}>
        <SectionHeading>All 6 PMP Question Types</SectionHeading>
        <SectionSub>
          Practice every format you will see on exam day. No surprises.
        </SectionSub>

        <TypesGrid>
          {QUESTION_TYPES.map((qt) => (
            <TypeCard key={qt.name}>
              <TypeIcon>{qt.icon}</TypeIcon>
              <TypeName>{qt.name}</TypeName>
              <TypeTag>{qt.tag}</TypeTag>
            </TypeCard>
          ))}
        </TypesGrid>
      </Section>

      <Divider />

      {/* ── 7. Testimonials ──────────────────────────────────────────── */}
      <Section $delay={280}>
        <SectionHeading>What Candidates Say</SectionHeading>
        <SectionSub>
          Join PMP candidates who trained with real exam simulations.
        </SectionSub>

        <TestimonialGrid>
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name}>
              <TestimonialQuote>&ldquo;{t.quote}&rdquo;</TestimonialQuote>
              <TestimonialAuthor>
                <TestimonialAvatar $color={t.color}>
                  {t.initial}
                </TestimonialAvatar>
                <div>
                  <TestimonialName>{t.name}</TestimonialName>
                  <TestimonialRole>{t.role}</TestimonialRole>
                </div>
              </TestimonialAuthor>
            </TestimonialCard>
          ))}
        </TestimonialGrid>
      </Section>

      <Divider />

      {/* ── 8. Pricing ───────────────────────────────────────────────── */}
      <Section $delay={320}>
        <SectionHeading>Simple Pricing</SectionHeading>
        <SectionSub>
          Start free. Upgrade when you are ready for full exam prep.
        </SectionSub>

        <PricingGrid>
          <PricingCard>
            <PricingTier>Free</PricingTier>
            <PricingPrice>
              $0 <PricingPeriod>forever</PricingPeriod>
            </PricingPrice>
            <PricingDesc>
              Get started with practice mode and one full exam simulation.
            </PricingDesc>
            <PricingList>
              {FREE_FEATURES.map((f) => (
                <PricingItem key={f.text} $included={f.included}>
                  <PricingCheck $included={f.included}>
                    {f.included ? "\u2713" : "\u2717"}
                  </PricingCheck>
                  {f.text}
                </PricingItem>
              ))}
            </PricingList>
            <PricingCTA href="/bank/pmp">Start Free →</PricingCTA>
          </PricingCard>

          <PricingCard $featured>
            <PricingBadge>Most Popular</PricingBadge>
            <PricingTier>Pro</PricingTier>
            <PricingPrice>
              $29 <PricingPeriod>one-time</PricingPeriod>
            </PricingPrice>
            <PricingDesc>
              Full access to every simulation, adaptive engine, and analytics.
            </PricingDesc>
            <PricingList>
              {PRO_FEATURES.map((f) => (
                <PricingItem key={f.text} $included={f.included}>
                  <PricingCheck $included={f.included}>
                    {f.included ? "\u2713" : "\u2717"}
                  </PricingCheck>
                  {f.text}
                </PricingItem>
              ))}
            </PricingList>
            <PricingCTA href="/bank/pmp" $featured>
              Get Pro Access →
            </PricingCTA>
          </PricingCard>
        </PricingGrid>
      </Section>

      <Divider />

      {/* ── 9. Growth Hook CTA ───────────────────────────────────────── */}
      <Section $delay={360}>
        <CTABanner>
          <CTABannerH>
            Most PMP candidates fail below 70%.
            <br />
            Find out where you stand.
          </CTABannerH>
          <CTABannerSub>
            Take a free practice assessment and get instant feedback on your
            strengths and weaknesses across all three PMP domains.
          </CTABannerSub>
          <PrimaryCTA href="/bank/pmp">Take the Free Assessment →</PrimaryCTA>
        </CTABanner>
      </Section>

      <Divider />

      {/* ── 10. FAQ ──────────────────────────────────────────────────── */}
      <Section $delay={400}>
        <SectionHeading>Frequently Asked Questions</SectionHeading>
        <SectionSub>
          Everything you need to know about PMP exam preparation.
        </SectionSub>

        <FAQList>
          {FAQ_DATA.map((faq) => (
            <FAQItem key={faq.q}>
              <FAQSummary>{faq.q}</FAQSummary>
              <FAQAnswer>{faq.a}</FAQAnswer>
            </FAQItem>
          ))}
        </FAQList>
      </Section>

      {/* ── 11. Footer ───────────────────────────────────────────────── */}
      <Footer>
        <FooterTagline>
          Built for PMP candidates, by PMP professionals.
        </FooterTagline>
        <SocialsRow>
          <SocialLink
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            &#x1D54F;
          </SocialLink>
          <SocialLink
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            in
          </SocialLink>
          <SocialLink
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            &#x25B6;
          </SocialLink>
        </SocialsRow>
      </Footer>
    </Page>
  );
}
