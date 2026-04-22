"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import type { Question, Scenario, SetId } from "@/src/exam-engine/core/types";
import type { BankConfig } from "@/src/exam-engine/data/loadFromSupabase";
import { EngineRunner } from "@/src/exam-engine/ui/EngineRunner";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";
import { balanceSimulationBlueprint } from "@/src/exam-engine/core/simulationBalance";
import { useAuth } from "@/lib/auth/AuthProvider";
import { pmpBank } from "@/src/exam-engine/data/seed.pmp";
import { setABank } from "@/src/exam-engine/data/seed.set-a";
import { setBBank } from "@/src/exam-engine/data/seed.set-b";
import { setCBank } from "@/src/exam-engine/data/seed.set-c";

/* ── types ──────────────────────────────────────────────────────────────── */

export type BreakModeId = "real_pmp" | "continuous" | "adaptive";

const SET_MAP: Record<string, SetId> = {
  "set-a": "set_a", "set-b": "set_b", "set-c": "set_c",
  set_a: "set_a",   set_b: "set_b",   set_c: "set_c",
};

const SEED_FALLBACKS: Partial<Record<SetId, Question[]>> = {
  set_a: setABank, set_b: setBBank, set_c: setCBank,
};

const FALLBACK_BANK_CONFIG: BankConfig = {
  id: "local-fallback", slug: "pmp", durationMinutes: 230, passThreshold: 61,
};

/* ── animations ──────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── shared layout ───────────────────────────────────────────────────────── */

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.45;
`;

/* ── selector page ───────────────────────────────────────────────────────── */

const Page = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  @media (min-width: 640px) { padding: 40px 24px 96px; }
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
  transition: color 150ms;
  &:hover { color: ${(p) => p.theme.text}; }
`;

const BreadcrumbSep = styled.span`opacity: 0.4;`;

const Hero = styled.div`
  text-align: center;
  margin-bottom: 32px;
  animation: ${fadeUp} 400ms 50ms ease both;
`;

const HeroBadge = styled.div`
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
  margin-bottom: 14px;
`;

const HeroTitle = styled.h1`
  margin: 0 0 8px;
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${(p) => p.theme.text};
`;

const HeroMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const HeroChip = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  display: flex;
  align-items: center;
  gap: 5px;
`;

const HeroSep = styled.span`
  color: ${(p) => p.theme.muted};
  opacity: 0.3;
`;

/* ── mode grid ───────────────────────────────────────────────────────────── */

const ModeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 28px;
  animation: ${fadeUp} 400ms 100ms ease both;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const ModeCard = styled.button<{ $selected: boolean }>`
  background: ${(p) => p.theme.cardBg};
  border: 2px solid ${(p) => p.$selected ? p.theme.accent : p.theme.cardBorder};
  border-radius: 20px;
  padding: 20px;
  text-align: left;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 100ms ease;
  box-shadow: ${(p) => p.$selected
    ? `0 0 0 4px ${p.theme.accent}18, ${p.theme.shadow}`
    : p.theme.shadow};
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: ${(p) => p.$selected ? p.theme.accent : p.theme.accent}80;
    transform: translateY(-2px);
    box-shadow: ${(p) => p.theme.shadowLg ?? p.theme.shadow};
  }
`;

const CardGlow = styled.div<{ $selected: boolean }>`
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${(p) => p.$selected
    ? `radial-gradient(circle at center, ${p.theme.accent}20, transparent 70%)`
    : "transparent"};
  pointer-events: none;
  transition: background 200ms ease;
`;

const CardIcon = styled.div`
  font-size: 28px;
  margin-bottom: 12px;
  line-height: 1;
`;

const CardBadge = styled.div<{ $color: "accent" | "success" | "warning" }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
  background: ${(p) =>
    p.$color === "accent" ? p.theme.accentSoft
    : p.$color === "success" ? p.theme.successSoft
    : (p.theme.warningSoft ?? "rgba(245,158,11,0.1)")};
  color: ${(p) =>
    p.$color === "accent" ? p.theme.accent
    : p.$color === "success" ? p.theme.success
    : (p.theme.warning ?? "#f59e0b")};
`;

const CardTitle = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.2px;
  margin-bottom: 6px;
`;

const CardDesc = styled.div`
  font-size: 12.5px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
  margin-bottom: 14px;
`;

const CardFeatures = styled.div`
  display: grid;
  gap: 5px;
`;

const CardFeature = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: ${(p) => p.theme.mutedStrong};
  font-weight: 600;
`;

const CardFeatureDot = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  font-size: 9px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

const SelectedCheck = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${(p) => p.theme.accent};
  color: ${(p) => p.theme.accentText};
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
`;

/* ── adaptive sub-options ────────────────────────────────────────────────── */

const AdaptiveOptions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
`;

const AdaptiveOption = styled.button<{ $selected: boolean }>`
  flex: 1;
  min-width: 80px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1.5px solid ${(p) => p.$selected ? p.theme.success : p.theme.cardBorder};
  background: ${(p) => p.$selected ? p.theme.successSoft : "transparent"};
  color: ${(p) => p.$selected ? p.theme.success : p.theme.muted};
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: center;

  &:hover {
    border-color: ${(p) => p.theme.success};
    color: ${(p) => p.theme.success};
    background: ${(p) => p.theme.successSoft};
  }
`;

/* ── CTA ─────────────────────────────────────────────────────────────────── */

const CtaWrap = styled.div`
  text-align: center;
  animation: ${fadeUp} 400ms 150ms ease both;
`;

const BeginBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 48px;
  border-radius: 16px;
  border: none;
  background: ${(p) => p.theme.accent};
  color: ${(p) => p.theme.accentText};
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.1px;
  transition: background 150ms ease, transform 100ms ease, box-shadow 150ms ease;
  box-shadow: 0 4px 20px ${(p) => p.theme.accent}40;

  &:hover {
    background: ${(p) => p.theme.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 6px 28px ${(p) => p.theme.accent}50;
  }
  &:active { transform: translateY(0); }
`;

const CtaNote = styled.p`
  margin: 10px 0 0;
  font-size: 12px;
  color: ${(p) => p.theme.muted};
`;

/* ── selector component ──────────────────────────────────────────────────── */

interface SelectorProps {
  bankSlug: string;
  setLabel: string;
  durationStr: string;
  passThreshold: number;
  modeId: BreakModeId;
  adaptiveInterval: 45 | 60;
  onModeChange: (m: BreakModeId) => void;
  onAdaptiveChange: (n: 45 | 60) => void;
  onBegin: () => void;
}

function BreakModeSelector({
  bankSlug, setLabel, durationStr, passThreshold,
  modeId, adaptiveInterval,
  onModeChange, onAdaptiveChange, onBegin,
}: SelectorProps) {
  return (
    <Page>
      <Breadcrumb>
        <BreadcrumbLink href="/">Exams</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <BreadcrumbLink href={`/bank/${bankSlug}`}>PMP</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <span>{setLabel} — Mode</span>
      </Breadcrumb>

      <Hero>
        <HeroBadge>Choose Exam Mode</HeroBadge>
        <HeroTitle>PMP Simulation — {setLabel}</HeroTitle>
        <HeroMeta>
          <HeroChip>180 questions</HeroChip>
          <HeroSep>·</HeroSep>
          <HeroChip>{durationStr}</HeroChip>
          <HeroSep>·</HeroSep>
          <HeroChip>Pass {passThreshold}%</HeroChip>
        </HeroMeta>
      </Hero>

      <ModeGrid>

        {/* ── Real PMP ── */}
        <ModeCard $selected={modeId === "real_pmp"} onClick={() => onModeChange("real_pmp")}>
          <CardGlow $selected={modeId === "real_pmp"} />
          {modeId === "real_pmp" && <SelectedCheck>✓</SelectedCheck>}
          <CardIcon>🎓</CardIcon>
          <CardBadge $color="accent">Official Format</CardBadge>
          <CardTitle>Real PMP Exam</CardTitle>
          <CardDesc>
            Mirrors the official PMI® exam structure exactly, including the two scheduled break points.
          </CardDesc>
          <CardFeatures>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>Optional break after Q60</CardFeature>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>Optional break after Q120</CardFeature>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>Up to 10 min per break</CardFeature>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>Previous sections lock</CardFeature>
          </CardFeatures>
        </ModeCard>

        {/* ── Continuous ── */}
        <ModeCard $selected={modeId === "continuous"} onClick={() => onModeChange("continuous")}>
          <CardGlow $selected={modeId === "continuous"} />
          {modeId === "continuous" && <SelectedCheck>✓</SelectedCheck>}
          <CardIcon>⚡</CardIcon>
          <CardBadge $color="warning">Focus Mode</CardBadge>
          <CardTitle>Continuous Mode</CardTitle>
          <CardDesc>
            No scheduled interruptions. A single unbroken 230-minute focus session.
          </CardDesc>
          <CardFeatures>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>No scheduled breaks</CardFeature>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>Maximum immersion</CardFeature>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>Full 230 min timer</CardFeature>
          </CardFeatures>
        </ModeCard>

        {/* ── Adaptive ── */}
        <ModeCard $selected={modeId === "adaptive"} onClick={() => onModeChange("adaptive")}>
          <CardGlow $selected={modeId === "adaptive"} />
          {modeId === "adaptive" && <SelectedCheck>✓</SelectedCheck>}
          <CardIcon>🎯</CardIcon>
          <CardBadge $color="success">Training</CardBadge>
          <CardTitle>Adaptive Training</CardTitle>
          <CardDesc>
            Timed breaks to keep your performance sharp. Timer pauses; answers are preserved.
          </CardDesc>
          <CardFeatures>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>Timer pauses on break</CardFeature>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>All answers preserved</CardFeature>
            <CardFeature><CardFeatureDot>✓</CardFeatureDot>10 min per break</CardFeature>
          </CardFeatures>
          <AdaptiveOptions>
            <AdaptiveOption
              $selected={adaptiveInterval === 45}
              onClick={(e) => { e.stopPropagation(); onModeChange("adaptive"); onAdaptiveChange(45); }}
            >
              Break every 45 min
            </AdaptiveOption>
            <AdaptiveOption
              $selected={adaptiveInterval === 60}
              onClick={(e) => { e.stopPropagation(); onModeChange("adaptive"); onAdaptiveChange(60); }}
            >
              Break every 60 min
            </AdaptiveOption>
          </AdaptiveOptions>
        </ModeCard>

      </ModeGrid>

      <CtaWrap>
        <BeginBtn onClick={onBegin}>
          Begin Simulation →
        </BeginBtn>
        <CtaNote>Timer starts immediately when the exam loads.</CtaNote>
      </CtaWrap>
    </Page>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */

interface ExamClientProps {
  bankSlug: string;
  setId?: string;
}

export default function ExamClient({ bankSlug, setId: rawSetId }: ExamClientProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [msg, setMsg] = useState("Loading exam\u2026");
  const [loadError, setLoadError] = useState(false);

  // Break mode selection
  const [modeId, setModeId] = useState<BreakModeId>("real_pmp");
  const [adaptiveInterval, setAdaptiveInterval] = useState<45 | 60>(45);
  const [modeConfirmed, setModeConfirmed] = useState(false);

  const resolvedSetId: SetId | undefined = rawSetId ? SET_MAP[rawSetId] : undefined;
  const setLabel = resolvedSetId?.replace("_", " ").toUpperCase() ?? "Random";

  const namespaceKey = resolvedSetId
    ? `${bankSlug}__exam__${resolvedSetId}`
    : `${bankSlug}__exam`;

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled || questions) return;
      setBankConfig(FALLBACK_BANK_CONFIG);
      setQuestions(resolvedSetId && SEED_FALLBACKS[resolvedSetId] ? SEED_FALLBACKS[resolvedSetId]! : pmpBank);
      setScenarios([]);
      setMsg("");
    }, 20_000);

    (async () => {
      try {
        const bank = await loadBankBySlug(bankSlug);
        if (cancelled) return;
        setBankConfig(bank);
        const [qs, scns] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);
        if (cancelled) return;

        let finalQs: Question[];
        if (resolvedSetId) {
          const setQs = qs.filter((q) => (q.setId ?? "free") === resolvedSetId);
          const seedQs = SEED_FALLBACKS[resolvedSetId];
          if (setQs.length >= 180) {
            finalQs = qs;
          } else if (seedQs) {
            const seedIds = new Set(seedQs.map((q) => q.id));
            finalQs = [...seedQs, ...qs.filter((q) => !seedIds.has(q.id))];
          } else {
            finalQs = qs.length ? qs : pmpBank;
          }
        } else {
          finalQs = qs.length ? qs : pmpBank;
        }

        // Cancel the fallback timeout — real data is ready
        clearTimeout(timeout);
        setQuestions(finalQs);
        setScenarios(scns);
        setMsg("");
      } catch (e: any) {
        if (cancelled) return;
        // Cancel the fallback timeout — catch block handles the fallback directly
        clearTimeout(timeout);
        setBankConfig(FALLBACK_BANK_CONFIG);
        setQuestions(resolvedSetId && SEED_FALLBACKS[resolvedSetId] ? SEED_FALLBACKS[resolvedSetId]! : pmpBank);
        setScenarios([]);
        setMsg("");
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [bankSlug, resolvedSetId]);

  if (!questions || !bankConfig) return <P>{msg}</P>;

  const duration = bankConfig.durationMinutes ?? 230;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;

  // Compute final break config key for EngineRunner
  const breakConfigMode =
    modeId === "continuous" ? "continuous"
    : modeId === "adaptive" ? (adaptiveInterval === 45 ? "adaptive_45" : "adaptive_60")
    : "real_pmp";

  if (!modeConfirmed) {
    return (
      <BreakModeSelector
        bankSlug={bankSlug}
        setLabel={setLabel}
        durationStr={durationStr}
        passThreshold={bankConfig.passThreshold ?? 61}
        modeId={modeId}
        adaptiveInterval={adaptiveInterval}
        onModeChange={setModeId}
        onAdaptiveChange={setAdaptiveInterval}
        onBegin={() => setModeConfirmed(true)}
      />
    );
  }

  return (
    <EngineRunner
      key={namespaceKey}
      title={`Exam Simulation \u2022 ${setLabel}`}
      subtitle={
        resolvedSetId
          ? `${setLabel} simulation. Submit to see your results.`
          : "Simulation mode. Submit to see your results."
      }
      questions={questions}
      scenarios={scenarios}
      blueprint={balanceSimulationBlueprint({
        total: 180,
        domains: { people: 76, process: 90, business_environment: 14 },
        ...(resolvedSetId ? { setId: resolvedSetId } : {}),
      })}
      mode="exam"
      allowDomainFilter={false}
      storageNamespace={namespaceKey}
      durationMinutes={bankConfig.durationMinutes ?? undefined}
      passThreshold={bankConfig.passThreshold}
      userId={user?.id}
      bankSlug={bankSlug}
      setId={resolvedSetId}
      breakConfig={{ mode: breakConfigMode }}
    />
  );
}
