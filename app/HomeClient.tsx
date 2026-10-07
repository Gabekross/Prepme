"use client";

import React from "react";
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
  max-width: 1060px;
  margin: 0 auto;
`;

const Section = styled.section<{ $delay?: number }>`
  padding: 56px 0;
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
  text-align: left;
  padding: 64px 0 60px;
  animation: ${fadeUp} 500ms ease both;

  @media (min-width: 640px) {
    padding: 84px 0 72px;
  }

  @media (min-width: 768px) {
    text-align: center;
    padding: 84px 48px 72px;
    overflow: hidden;
    border-radius: 20px;
    background-image: linear-gradient(
        90deg,
        ${(p) =>
          p.theme.name === "dark"
            ? "rgba(16, 27, 31, 0.68)"
            : "rgba(237, 244, 243, 0.7)"} 0%,
        ${(p) =>
          p.theme.name === "dark"
            ? "rgba(16, 27, 31, 0.84)"
            : "rgba(237, 244, 243, 0.86)"} 34%,
        ${(p) =>
          p.theme.name === "dark"
            ? "rgba(16, 27, 31, 0.84)"
            : "rgba(237, 244, 243, 0.86)"} 66%,
        ${(p) =>
          p.theme.name === "dark"
            ? "rgba(16, 27, 31, 0.68)"
            : "rgba(237, 244, 243, 0.7)"} 100%
      ),
      url("/hero-exam-study-underlay.png");
    background-position: center;
    background-size: cover;
    box-shadow: ${(p) => p.theme.shadowLg};
  }
`;

const HeroKicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
  color: ${(p) => p.theme.accent};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.9px;
  text-transform: uppercase;
  margin-bottom: 18px;
`;

const H1 = styled.h1`
  margin: 0 0 24px;
  max-width: 760px;
  font-size: clamp(44px, 7.4vw, 76px);
  font-weight: 500;
  letter-spacing: -0.055em;
  line-height: 0.98;
  color: ${(p) => p.theme.text};

  @media (min-width: 768px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeroSub = styled.p`
  margin: 0 0 30px;
  max-width: 700px;
  color: ${(p) => p.theme.muted};
  font-size: clamp(17px, 2vw, 20px);
  line-height: 1.72;

  @media (min-width: 768px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeroCTAs = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    justify-content: center;
  }
`;

const PrimaryCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 15px 28px;
  border-radius: 7px;
  background: ${(p) => p.theme.accent};
  color: ${(p) => p.theme.accentText};
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


const DisclaimerLine = styled.div`
  margin-top: 16px;
  max-width: 700px;
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  opacity: 0.72;

  @media (min-width: 768px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

/* ── section headings ───────────────────────────────────────────────────── */

const SectionHeading = styled.h2`
  margin: 0 0 10px;
  font-size: clamp(30px, 4.4vw, 46px);
  font-weight: 500;
  letter-spacing: -0.04em;
  color: ${(p) => p.theme.text};
  text-align: center;
`;

const SectionSub = styled.p`
  margin: 0 auto 32px;
  max-width: 600px;
  color: ${(p) => p.theme.muted};
  font-size: 16px;
  line-height: 1.7;
  text-align: center;
`;

/* ── practice-exam overview ────────────────────────────────────────────── */

const OverviewCopy = styled.div`
  max-width: 760px;
  margin: 0 auto;
  color: ${(p) => p.theme.muted};
  font-size: 16px;
  line-height: 1.75;
  text-align: center;

  p {
    margin: 0 0 16px;
  }

  p:last-child {
    margin-bottom: 0;
  }
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
  margin-bottom: 16px;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const FooterLink = styled(Link)`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.muted};
  text-decoration: none;
  transition: color 150ms ease;
  &:hover { color: ${(p) => p.theme.text}; }
`;

const FooterSep = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  opacity: 0.35;
`;

const SocialsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
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

const FooterCopy = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  opacity: 0.6;
  max-width: 540px;
  margin: 0 auto;
  line-height: 1.6;
`;

/* ── skeleton ───────────────────────────────────────────────────────────── */

const Skeleton = styled.div`
  height: 20px;
  border-radius: 8px;
  background: ${(p) => p.theme.cardBorder};
  animation: ${pulse} 1.5s ease infinite;
`;

/* ── data ────────────────────────────────────────────────────────────────── */

const FAQ_DATA = [
  {
    q: "Is PMP Mastery Lab updated for 2026?",
    a: "Yes. Our question bank is aligned with the current PMP Exam Content Outline (ECO). Questions cover all three domains: People (42%), Process (50%), and Business Environment (8%) with the correct weighting.",
  },
  {
    q: "How does the adaptive difficulty engine work?",
    a: "The engine tracks your consecutive correct and incorrect answers. After 3 correct answers in a row, it increases difficulty. After 2 wrong answers, it decreases. It also identifies your weakest domains and topics, then prioritizes those in your next practice session. Harder questions are weighted up to 2.5x in your score.",
  },
  {
    q: "Can I try PMP-style questions before choosing a plan?",
    a: "Yes. You can begin with practice sessions that include immediate feedback and realistic question formats. Full access is introduced after you have experienced the simulator.",
  },
  {
    q: "How many questions are in the question bank?",
    a: "We currently have 400+ unique PMP questions across all question types: single-select MCQ, multi-select MCQ, drag-and-drop matching, drag-and-drop ordering, hotspot (image-based), and fill-in-the-blank. This matches the variety you will see on the real PMP exam.",
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
    a: "Focus on understanding concepts, not memorizing questions. Use our adaptive practice mode to identify and strengthen weak domains. Take at least 2-3 full timed simulations to build exam stamina. Review your analytics after each session and target the areas that need more work.",
  },
];

/* ── component ──────────────────────────────────────────────────────────── */

export default function HomeClient() {
  return (
    <Page>
      {/* ── 1. Hero ──────────────────────────────────────────────────── */}
      <Hero>
        <HeroKicker>PMP Mastery Lab — 2026</HeroKicker>
        <H1>
          Prepare with Confidence
          <br />
          for the PMP Exam
        </H1>
        <HeroSub>
          Practice with realistic PMP exam simulations, timed mock exams,
          and targeted PMP practice questions designed to help you
          prepare effectively for exam day.
        </HeroSub>
        <HeroCTAs>
          <PrimaryCTA href="/bank/pmp">
            Start Practice
          </PrimaryCTA>
        </HeroCTAs>
        <DisclaimerLine>
          PMP&reg; is a registered trademark of the Project Management Institute, Inc.
          PMP Mastery Lab is not affiliated with or endorsed by PMI&reg;.
        </DisclaimerLine>
      </Hero>

      {/* ── 2. Divider ───────────────────────────────────────────────── */}
      <Divider style={{ margin: "40px 0 0" }} />

      {/* ── 3. Practice Exam Overview ───────────────────────────────── */}
      <Section $delay={130}>
        <SectionHeading>Built to Feel Like Exam Day</SectionHeading>
        <OverviewCopy>
          <p>
            Our full-length PMP practice exams are designed around the format,
            pacing, and question styles you can expect on test day. Each
            simulation follows the PMP Exam Content Outline and includes 180
            questions delivered in timed sections.
          </p>
          <p>
            Choose from three complete simulations to build stamina and test
            your readiness. When you finish, you&apos;ll see exam-style results
            across the People, Process, and Business Environment domains, plus
            answer explanations that help you pinpoint gaps and study with
            greater confidence.
          </p>
        </OverviewCopy>
      </Section>

      <Divider />

      {/* ── 5. Blog Promo ────────────────────────────────────────────── */}
      <Section $delay={140}>
        <SectionHeading>PMP Exam Tips & Study Guides</SectionHeading>
        <SectionSub>
          Read practical PMP tips, scenario breakdowns, and study strategies from the PMP Mastery Lab blog.
        </SectionSub>
        <HeroCTAs>
          <PrimaryCTA href="/blog">Read the Blog</PrimaryCTA>
        </HeroCTAs>
      </Section>

      <Divider />

      {/* ── 10. FAQ ──────────────────────────────────────────────────── */}
      <Section $delay={320}>
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

        <FooterLinks>
          <FooterLink href="/terms">Terms of Service</FooterLink>
          <FooterSep>&middot;</FooterSep>
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
          <FooterSep>&middot;</FooterSep>
          <FooterLink href="/refund">Refund Policy</FooterLink>
          <FooterSep>&middot;</FooterSep>
          <FooterLink href="/contact">Contact</FooterLink>
        </FooterLinks>

        <SocialsRow>
          <SocialLink
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            in
          </SocialLink>
          <SocialLink
            href="https://www.instagram.com/pmpmasterylab"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @pmpmasterylab"
          >
            @
          </SocialLink>
        </SocialsRow>

        <FooterCopy>
          &copy; 2026 Jemigah LLC. PMI&reg; and PMP&reg; are registered trademarks of the
          Project Management Institute, Inc. PMP Mastery Lab is not affiliated with
          or endorsed by PMI&reg;.
        </FooterCopy>
      </Footer>
    </Page>
  );
}
