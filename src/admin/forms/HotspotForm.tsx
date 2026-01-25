"use client";

import React, { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { pretty, safeParse } from "./utils";
import { nextId } from "./dndUtils";

type Region = { id: string; shape: "rect"; x: number; y: number; w: number; h: number };

const Wrap = styled.div`
  display: grid;
  gap: 12px;
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 13px;
  opacity: 0.9;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 10px;
  align-items: center;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.div`
  font-size: 12px;
  opacity: 0.85;
`;

const Input = styled.input`
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
`;

const Select = styled.select`
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(11, 16, 32, 0.35);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
`;

const Button = styled.button<{ $danger?: boolean; $active?: boolean }>`
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: ${(p) =>
    p.$danger ? "rgba(239,68,68,0.18)" : p.$active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"};
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 900;

  &:hover {
    background: ${(p) =>
      p.$danger ? "rgba(239,68,68,0.24)" : p.$active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.10)"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Hint = styled.div`
  font-size: 12px;
  opacity: 0.82;
  line-height: 1.35;
`;

const Box = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 10px;
`;

const PreviewBox = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  overflow: hidden;
`;

const Figure = styled.div`
  position: relative;
`;

const Img = styled.img`
  display: block;
  width: 100%;
  height: auto;
`;

const Canvas = styled.div<{ $enabled?: boolean }>`
  position: absolute;
  inset: 0;
  cursor: ${(p) => (p.$enabled ? "crosshair" : "default")};
  touch-action: none;
`;

const Rect = styled.button<{ $x: number; $y: number; $w: number; $h: number; $active?: boolean }>`
  position: absolute;
  left: ${(p) => `${p.$x}%`};
  top: ${(p) => `${p.$y}%`};
  width: ${(p) => `${p.$w}%`};
  height: ${(p) => `${p.$h}%`};

  border-radius: 8px;
  border: 2px solid ${(p) => (p.$active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)")};
  background: ${(p) => (p.$active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)")};
  box-shadow: ${(p) => (p.$active ? "0 0 0 3px rgba(255,255,255,0.14)" : "0 0 0 2px rgba(0,0,0,0.15)")};

  cursor: pointer;
  padding: 0;
`;

function clamp01to100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function normRect(a: { x: number; y: number }, b: { x: number; y: number }) {
  const x1 = clamp01to100(Math.min(a.x, b.x));
  const y1 = clamp01to100(Math.min(a.y, b.y));
  const x2 = clamp01to100(Math.max(a.x, b.x));
  const y2 = clamp01to100(Math.max(a.y, b.y));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function pointInRect(px: number, py: number, r: Region) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export default function HotspotForm(props: {
  payloadJson: string;
  answerKeyJson: string;
  onChange: (nextPayloadJson: string, nextAnswerKeyJson: string) => void;
  imageUrl?: string;
}) {
  const payload = useMemo(
    () =>
      safeParse<{ coordinateSpace?: "percent" | "px"; regions: Region[] }>(props.payloadJson, {
        coordinateSpace: "percent",
        regions: [],
      }),
    [props.payloadJson]
  );

  const key = useMemo(() => safeParse<{ correctRegionId?: string }>(props.answerKeyJson, {}), [props.answerKeyJson]);

  // We enforce percent for draw mode
  const regions: Region[] = Array.isArray(payload.regions) ? payload.regions : [];
  const correctRegionId = key.correctRegionId ?? (regions[0]?.id ?? "");

  const [drawEnabled, setDrawEnabled] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
  const [curPt, setCurPt] = useState<{ x: number; y: number } | null>(null);

  const figureRef = useRef<HTMLDivElement | null>(null);

  function commit(nextRegions: Region[], nextCorrectId: string) {
    props.onChange(pretty({ coordinateSpace: "percent", regions: nextRegions }), pretty({ correctRegionId: nextCorrectId }));
  }

  function addRegionManual() {
    const id = nextId("r", regions.map((r) => r.id));
    const next: Region[] = [...regions, { id, shape: "rect" as const, x: 10, y: 10, w: 20, h: 20 }];
    const nextCorrect = correctRegionId || next[0]?.id || "";
    commit(next, nextCorrect);
  }

  function removeRegion(id: string) {
    const next = regions.filter((r) => r.id !== id);
    const nextCorrect = id === correctRegionId ? (next[0]?.id ?? "") : correctRegionId;
    commit(next, nextCorrect);
  }

  function setCorrect(id: string) {
    commit(regions, id);
  }

  function updateRegion(id: string, patch: Partial<Region>) {
    const next: Region[] = regions.map((r) => (r.id === id ? { ...r, ...patch, shape: "rect" as const } : r));
    commit(next, correctRegionId);
  }

  function getPercentFromEvent(e: React.PointerEvent) {
    const box = figureRef.current;
    if (!box) return { x: 0, y: 0 };
    const rect = box.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: clamp01to100(x), y: clamp01to100(y) };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!drawEnabled) return;
    if (!props.imageUrl) return;

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    const p = getPercentFromEvent(e);
    setDragging(true);
    setStartPt(p);
    setCurPt(p);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawEnabled || !dragging || !startPt) return;
    const p = getPercentFromEvent(e);
    setCurPt(p);
  }

  function onPointerUp() {
    if (!drawEnabled) return;

    if (!dragging || !startPt || !curPt) {
      setDragging(false);
      setStartPt(null);
      setCurPt(null);
      return;
    }

    const rect = normRect(startPt, curPt);

    // avoid tiny accidental regions
    const minSize = 2; // percent
    if (rect.w >= minSize && rect.h >= minSize) {
      const id = nextId("r", regions.map((r) => r.id));
      const nextRegions: Region[] = [...regions, { id, shape: "rect" as const, ...rect }];
      const nextCorrect = correctRegionId || id;
      commit(nextRegions, nextCorrect);
    }

    setDragging(false);
    setStartPt(null);
    setCurPt(null);
  }

  const liveRect = startPt && curPt ? normRect(startPt, curPt) : null;

  function onRectClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setCorrect(id);
  }

  function onCanvasClick(e: React.MouseEvent) {
    // If draw mode is off, allow click-to-select region by click location.
    if (drawEnabled) return;
    const box = figureRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // top-most region: choose last region that contains point
    for (let i = regions.length - 1; i >= 0; i--) {
      if (pointInRect(x, y, regions[i])) {
        setCorrect(regions[i].id);
        return;
      }
    }
  }

  return (
    <Wrap>
      <Title>Hotspot Builder</Title>

      <Row>
        <Label>Draw mode</Label>
        <Select value={drawEnabled ? "on" : "off"} onChange={(e) => setDrawEnabled(e.target.value === "on")}>
          <option value="on">On (draw rectangles)</option>
          <option value="off">Off (click region to select)</option>
        </Select>
        <Button onClick={addRegionManual}>Add region</Button>
      </Row>

      <Row>
        <Label>Correct region</Label>
        <Select value={correctRegionId} onChange={(e) => setCorrect(e.target.value)}>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id}
            </option>
          ))}
        </Select>
        <Hint>Tip: click a rectangle on the image to set it as correct.</Hint>
      </Row>

      <PreviewBox>
        <Figure ref={figureRef}>
          {props.imageUrl ? <Img src={props.imageUrl} alt="Hotspot preview" /> : null}

          <Canvas
            $enabled={!!(drawEnabled && props.imageUrl)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={onCanvasClick}
            aria-label="Hotspot drawing canvas"
          />

          {/* Existing regions (clickable) */}
          {regions.map((r) => (
            <Rect
              key={r.id}
              $x={r.x}
              $y={r.y}
              $w={r.w}
              $h={r.h}
              $active={r.id === correctRegionId}
              onClick={(e) => onRectClick(e, r.id)}
              aria-label={`Region ${r.id}`}
              type="button"
            />
          ))}

          {/* Live drag rectangle (not clickable) */}
          {drawEnabled && liveRect ? (
            <Rect
              $x={liveRect.x}
              $y={liveRect.y}
              $w={liveRect.w}
              $h={liveRect.h}
              $active
              type="button"
              aria-label="Drawing region"
              onClick={(e) => e.preventDefault()}
            />
          ) : null}
        </Figure>
      </PreviewBox>

      {!props.imageUrl ? (
        <Hint>Add an image URL in the editor (“Hotspot image URL”) to enable drawing.</Hint>
      ) : (
        <Hint>
          Drag to create a region (min 2%). Turn draw off to click-select by position.
        </Hint>
      )}

      <Box>
        <Title>Regions</Title>
        {regions.length === 0 ? <Hint>No regions yet. Draw one or click “Add region”.</Hint> : null}

        {regions.map((r) => (
          <Box key={r.id}>
            <Row>
              <Label>{r.id}</Label>
              <Hint>Rect coords in percent: x,y,w,h</Hint>
              <Button $danger onClick={() => removeRegion(r.id)} disabled={regions.length <= 1}>
                Remove
              </Button>
            </Row>

            <Row>
              <Label>x</Label>
              <Input type="number" value={String(r.x)} onChange={(e) => updateRegion(r.id, { x: Number(e.target.value || "0") })} />
              <div />
            </Row>
            <Row>
              <Label>y</Label>
              <Input type="number" value={String(r.y)} onChange={(e) => updateRegion(r.id, { y: Number(e.target.value || "0") })} />
              <div />
            </Row>
            <Row>
              <Label>w</Label>
              <Input type="number" value={String(r.w)} onChange={(e) => updateRegion(r.id, { w: Number(e.target.value || "0") })} />
              <div />
            </Row>
            <Row>
              <Label>h</Label>
              <Input type="number" value={String(r.h)} onChange={(e) => updateRegion(r.id, { h: Number(e.target.value || "0") })} />
              <div />
            </Row>

            <Row>
              <Label>Correct?</Label>
              <Button $active={r.id === correctRegionId} onClick={() => setCorrect(r.id)}>
                {r.id === correctRegionId ? "Correct region" : "Set as correct"}
              </Button>
              <div />
            </Row>
          </Box>
        ))}
      </Box>
    </Wrap>
  );
}
