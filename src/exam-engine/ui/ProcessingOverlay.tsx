"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

/* ── animations ──────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { stroke-dashoffset: 283; }
  to   { stroke-dashoffset: 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
`;

/* ── styled ──────────────────────────────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  background: ${(p) =>
    p.theme.name === "dark"
      ? "rgba(6, 9, 15, 0.96)"
      : "rgba(255, 255, 255, 0.97)"};
  backdrop-filter: blur(24px);
  animation: ${fadeIn} 300ms ease both;
`;

const RingWrap = styled.div`
  width: 80px;
  height: 80px;
  position: relative;
`;

const RingTrack = styled.circle`
  fill: none;
  stroke: ${(p) => p.theme.cardBorder};
  stroke-width: 4;
`;

const RingProgress = styled.circle<{ $duration: number }>`
  fill: none;
  stroke: ${(p) => p.theme.accent};
  stroke-width: 4;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  animation: ${spin} ${(p) => p.$duration}ms ease-in-out forwards;
`;

const TextGroup = styled.div`
  text-align: center;
  animation: ${fadeUp} 400ms 200ms ease both;
`;

const Heading = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.3px;
  margin-bottom: 8px;
`;

const StatusText = styled.div`
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
  animation: ${pulse} 1.8s ease-in-out infinite;
`;

/* ── staged messages ─────────────────────────────────────────────────────── */

const STAGES = [
  "Scoring your responses...",
  "Analyzing domain performance...",
  "Generating your performance summary...",
  "Preparing results...",
];

/* ── component ───────────────────────────────────────────────────────────── */

interface ProcessingOverlayProps {
  /** Minimum display duration in ms before onComplete fires. Default 3000. */
  minDuration?: number;
  /** Called when the processing animation finishes. */
  onComplete: () => void;
}

export function ProcessingOverlay({
  minDuration = 3000,
  onComplete,
}: ProcessingOverlayProps) {
  const [stageIdx, setStageIdx] = useState(0);

  // Cycle through status messages
  useEffect(() => {
    const interval = Math.floor(minDuration / STAGES.length);
    const timer = setInterval(() => {
      setStageIdx((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, interval);
    return () => clearInterval(timer);
  }, [minDuration]);

  // Fire onComplete after min duration
  useEffect(() => {
    const timer = setTimeout(onComplete, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <Overlay>
      <RingWrap>
        <svg viewBox="0 0 100 100" width="80" height="80">
          <RingTrack cx="50" cy="50" r="45" />
          <RingProgress
            cx="50"
            cy="50"
            r="45"
            strokeDasharray="283"
            strokeDashoffset="283"
            $duration={minDuration}
          />
        </svg>
      </RingWrap>

      <TextGroup>
        <Heading>Processing Your Exam</Heading>
        <StatusText key={stageIdx}>{STAGES[stageIdx]}</StatusText>
      </TextGroup>
    </Overlay>
  );
}
