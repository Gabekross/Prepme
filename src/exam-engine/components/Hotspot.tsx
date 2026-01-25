"use client";

import React, { useRef } from "react";
import styled from "styled-components";
import type { Question, Response } from "../core/types";
import { Subtle } from "./shared";

const Wrap = styled.div`
  display: grid;
  gap: 10px;
`;

const ImgBox = styled.div`
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
`;

const Figure = styled.div`
  position: relative;
`;

const Img = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const Overlay = styled.button`
  position: absolute;
  inset: 0;
  border: none;
  background: transparent;
  cursor: crosshair;
`;

type MarkerState = "neutral" | "correct" | "incorrect";

const Marker = styled.div<{ $x: number; $y: number; $state: MarkerState }>`
  position: absolute;
  left: ${(p) => `${p.$x}%`};
  top: ${(p) => `${p.$y}%`};
  transform: translate(-50%, -50%);

  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.9);
  pointer-events: none;

  background: ${(p) =>
    p.$state === "correct"
      ? "rgba(34,197,94,0.85)"
      : p.$state === "incorrect"
      ? "rgba(239,68,68,0.85)"
      : "rgba(255,255,255,0.35)"};

  box-shadow: ${(p) =>
    p.$state === "correct"
      ? "0 0 0 3px rgba(34,197,94,0.25)"
      : p.$state === "incorrect"
      ? "0 0 0 3px rgba(239,68,68,0.25)"
      : "0 0 0 3px rgba(255,255,255,0.12)"};
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
      } else {
        // (Not used in this scaffold) If you switch to px space later, implement px checks here.
      }
    }
    return null;
  }

  function handleClick(e: React.MouseEvent) {
    const box = boxRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const regionId = regionFromPoint(x, y);

    onChange({
      type: "hotspot",
      selectedRegionId: regionId,
      click: { x, y },
    });
  }

  const ok = showCorrect && chosenId && chosenId === correctId;

  return (
    <Wrap>
      <Subtle>Tap/click the image to select a region.</Subtle>

      <ImgBox>
        <Figure ref={boxRef}>
          <Img src={question.media?.imageUrl ?? ""} alt={question.media?.alt ?? "Hotspot"} />
          <Overlay onClick={handleClick} aria-label="Select hotspot region" />

          {click ? <Marker $x={click.x} $y={click.y} $state={markerState} /> : null}
        </Figure>
      </ImgBox>

      {showCorrect ? (
        <Subtle>{ok ? "✓ Correct region" : chosenId ? "✗ Incorrect region" : "No selection made."}</Subtle>
      ) : null}
    </Wrap>
  );
}
