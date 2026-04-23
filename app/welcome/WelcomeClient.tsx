"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const popIn = keyframes`
  0%   { opacity: 0; transform: scale(0.8); }
  60%  { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

/* ── layout ─────────────────────────────────────────────────────────────── */

const PageWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 32px 16px 64px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 28px;
  padding: 40px 32px;
  box-shadow: ${(p) => p.theme.shadowLg};
  position: relative;
  overflow: hidden;
  text-align: center;
  animation: ${fadeUp} 500ms ease both;

  @media (max-width: 480px) {
    padding: 32px 20px;
    border-radius: 22px;
  }

  &::before {
    content: "";
    position: absolute;
    top: -80px;
    right: -80px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(circle at center, ${(p) => p.theme.accentSoft}, transparent 70%);
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -60px;
    left: -60px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle at center, #7c3aed18, transparent 70%);
    pointer-events: none;
  }
`;

/* ── icon ───────────────────────────────────────────────────────────────── */


/* ── typography ──────────────────────────────────────────────────────────── */

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${(p) => p.theme.text};
  animation: ${fadeUp} 500ms 100ms ease both;
`;

const Subtitle = styled.p`
  margin: 0 0 28px;
  font-size: 15px;
  color: ${(p) => p.theme.muted};
  line-height: 1.65;
  overflow-wrap: break-word;
  word-break: break-word;
  animation: ${fadeUp} 500ms 200ms ease both;
`;

const UserEmail = styled.span`
  color: ${(p) => p.theme.accent};
  font-weight: 700;
  overflow-wrap: break-word;
  word-break: break-all;
`;

/* ── checklist ──────────────────────────────────────────────────────────── */

const Checklist = styled.div`
  text-align: left;
  margin-bottom: 28px;
  display: grid;
  gap: 10px;
  animation: ${fadeUp} 500ms 300ms ease both;
`;

const CheckItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.text};
  line-height: 1.4;
`;

const CheckCircle = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${(p) => p.theme.successSoft};
  color: ${(p) => p.theme.success};
  display: grid;
  place-items: center;
  font-size: 11px;
  flex-shrink: 0;
`;

/* ── CTA ────────────────────────────────────────────────────────────────── */

const CtaButton = styled(Link)`
  display: block;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  padding: 14px 24px;
  box-sizing: border-box;
  border-radius: 14px;
  border: none;
  background: ${(p) => p.theme.accent};
  color: white;
  font-size: 16px;
  font-weight: 800;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;
  box-shadow: 0 4px 20px ${(p) => p.theme.accent}40;
  animation: ${fadeUp} 500ms 400ms ease both;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s ease-in-out infinite;
  }

  &:hover {
    opacity: 0.92;
    transform: translateY(-2px);
    box-shadow: 0 6px 28px ${(p) => p.theme.accent}50;
  }

  &:active {
    transform: translateY(0);
  }
`;

const CtaNote = styled.p`
  margin: 14px 0 0;
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  animation: ${fadeUp} 500ms 500ms ease both;
`;

/* ── component ──────────────────────────────────────────────────────────── */

export default function WelcomeClient() {
  const { user } = useAuth();

  return (
    <PageWrap>
      <Card>
        <Title>You're in!</Title>

        <Subtitle>
          {user?.email ? (
            <>
              Your account{" "}
              <UserEmail>{user.email}</UserEmail>{" "}
              is confirmed and ready to go.
            </>
          ) : (
            <>
              Your account is confirmed and ready to go.
            </>
          )}
          {" "}Here's what you can do right away:
        </Subtitle>

        <Checklist>
          <CheckItem>
            <CheckCircle>✓</CheckCircle>
            Practice mode with instant feedback — unlimited
          </CheckItem>
          <CheckItem>
            <CheckCircle>✓</CheckCircle>
            Full exam simulation (Set A) — 180 questions, timed
          </CheckItem>
          <CheckItem>
            <CheckCircle>✓</CheckCircle>
            Results breakdown by domain and question type
          </CheckItem>
          <CheckItem>
            <CheckCircle>✓</CheckCircle>
            All 6 PMP question formats included
          </CheckItem>
        </Checklist>

        <CtaButton href="/bank/pmp">
          Start Your First Practice
        </CtaButton>

        <CtaNote>
          No credit card required. Upgrade anytime to unlock all 3 simulations.
        </CtaNote>
      </Card>
    </PageWrap>
  );
}
