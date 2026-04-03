"use client";

import React, { useRef } from "react";
import styled from "styled-components";
import type { Question, Response } from "../core/types";
import { Subtle } from "./shared";

const Wrap = styled.div`
  display: grid;
  gap: 12px;
`;

const ImgBox = styled.div`
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  position: relative;
`;

const Figure = styled.div`
  position: relative;
  width: 100%;
`;

const Img = styled.img`
  width: 100%;
  height: auto;
  display: block;
  max-height: 480px;
  object-fit: contain;
`;

const Overlay = styled.button`
  position: absolute;
  inset: 0;
  border: none;
  background: transparent;
  cursor: crosshair;
  padding: 0;
`;

type MarkerState = "neutral" | "correct" | "incorrect";

const Marker = styled.div<{ $x: number; $y: number; $state: MarkerState }>`
  position: absolute;
  left: ${(p) => `${p.$x}%`};
  top: ${(p) => `${p.$y}%`};
  transform: translate(-50%, -50%);
  pointer-events: none;

  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2.5px solid white;

  background: ${(p) =>
    p.$state === "correct"
      ? p.theme.success
      : p.$state === "incorrect"
      ? p.theme.error
      : p.theme.accent};

  box-shadow: ${(p) =>
    p.$state === "correct"
      ? `0 0 0 4px ${p.theme.successSoft}, 0 2px 8px rgba(0,0,0,0.30)`
      : p.$state === "incorrect"
      ? `0 0 0 4px ${p.theme.errorSoft}, 0 2px 8px rgba(0,0,0,0.30)`
      : `0 0 0 4px ${p.theme.accentSoft}, 0 2px 8px rgba(0,0,0,0.30)`};
`;

const FeedbackBadge = styled.div<{ $ok: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 800;
  background: ${(p) => (p.$ok ? p.theme.successSoft : p.theme.errorSoft)};
  color: ${(p) => (p.$ok ? p.theme.success : p.theme.error)};
  border: 1px solid ${(p) => (p.$ok ? p.theme.successBorder : p.theme.errorBorder)};
`;

const NoImageMsg = styled.div`
  padding: 32px;
  text-align: center;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
`;

export function Hotspot(props: {
  question: Extract<Question, { type: "hotspot" }>;
  response: Response;
  onChange: (r: Response) => void;
  showCorrect: boolean;
}) {
  const { question, response, onChange, showCorrect } = props;
  const boxRef = useRef<HTMLDivElement | null>(null);

  const selectedRegionId = response.type === "hotspot" ? response.selectedRegionId : null;
  const click = response.type === "hotspot" ? response.click : undefined;

  const correctId = question.answerKey.correctRegionId;
  const chosenId = selectedRegionId;

  const markerState: MarkerState =
    showCorrect && chosenId
      ? chosenId === correctId
        ? "correct"
        : "incorrect"
      : "neutral";

  function regionFromPoint(px: number, py: number) {
    for (const r of question.payload.regions) {
      if (question.payload.coordinateSpace === "percent") {
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return r.id;
      }
    }
    return null;
  }

  function handleClick(e: React.MouseEvent) {
    if (showCorrect) return;
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const regionId = regionFromPoint(x, y);
    onChange({ type: "hotspot", selectedRegionId: regionId, click: { x, y } });
  }

  const ok = showCorrect && chosenId === correctId && !!chosenId;
  const imageUrl = question.media?.imageUrl;

  return (
    <Wrap>
      <Subtle>
        {showCorrect
          ? "Review your selection below."
          : "Click or tap the image to select a region."}
      </Subtle>

      <ImgBox>
        {!imageUrl ? (
          <NoImageMsg>⚠️ No image configured for this question.</NoImageMsg>
        ) : (
          <Figure ref={boxRef}>
            <Img
              src={imageUrl}
              alt={question.media?.alt ?? "Hotspot image"}
              draggable={false}
            />
            <Overlay
              onClick={handleClick}
              aria-label="Select hotspot region"
              disabled={showCorrect}
              style={{ cursor: showCorrect ? "default" : "crosshair" }}
            />
            {click && (
              <Marker $x={click.x} $y={click.y} $state={markerState} />
            )}
          </Figure>
        )}
      </ImgBox>

      {showCorrect && (
        <FeedbackBadge $ok={ok}>
          {ok
            ? "✓ Correct region"
            : chosenId
            ? "✕ Incorrect region"
            : "No selection made"}
        </FeedbackBadge>
      )}
    </Wrap>
  );
}
