"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUpgrade } from "@/lib/useUpgrade";

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
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  overflow: hidden;
`;

const BankImg = styled.img`
  width: 56px;
  height: 56px;
  object-fit: contain;
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

const ModeIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  overflow: hidden;
`;

const ModeImg = styled.img`
  width: 52px;
  height: 52px;
  object-fit: contain;
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

/* ── locked card (Pro-gated sets) ───────────────────────────────────────── */

const LockedCard = styled.div`
  text-decoration: none;
  color: inherit;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 18px;
  box-shadow: ${(p) => p.theme.shadow};
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  cursor: pointer;
  opacity: 0.7;

  @media (min-width: 480px) { padding: 24px; }
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, opacity 180ms ease;

  &::before {
    content: "";
    position: absolute;
    top: -50px; right: -50px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle at center, ${(p) => p.theme.accent}18, transparent 70%);
    pointer-events: none;
  }

  &:hover { transform: translateY(-3px); box-shadow: ${(p) => p.theme.shadowLg}; opacity: 1; }
`;

const LockBadge = styled.div`
  position: absolute;
  top: 14px; right: 14px;
  display: flex; align-items: center; gap: 5px;
  background: ${(p) => p.theme.warningSoft};
  border: 1px solid ${(p) => p.theme.warningBorder};
  color: ${(p) => p.theme.warning};
  font-size: 9px; font-weight: 800;
  padding: 3px 7px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  @media (min-width: 480px) {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 8px;
  }
`;

const UpgradeOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9000;
  display: grid; place-items: center;
  padding: 20px;
  animation: ${fadeUp} 200ms ease both;
`;

const UpgradeCard = styled.div`
  background: ${(p) =>
    p.theme.name === "dark" ? "#111827" : p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: ${(p) => p.theme.shadowLg};
  text-align: center;
`;

const UpgradeTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
`;

const UpgradeText = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  line-height: 1.6;
`;

const UpgradeFeature = styled.div`
  text-align: left;
  margin-bottom: 20px;
  display: grid;
  gap: 8px;
`;

const UpgradeFeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: ${(p) => p.theme.text};
  font-weight: 600;
`;

const UpgradeCheckmark = styled.span`
  width: 20px; height: 20px;
  border-radius: 50%;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  display: grid; place-items: center;
  font-size: 11px; flex-shrink: 0;
`;

const UpgradePrice = styled.div`
  font-size: 32px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
`;

const UpgradePriceNote = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 20px;
`;

const UpgradeBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #7c3aed);
  color: white;
  padding: 13px 20px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;
  margin-bottom: 10px;

  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

const UpgradeCloseBtn = styled.button`
  background: none; border: none;
  color: ${(p) => p.theme.muted};
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  padding: 8px 16px;

  &:hover { color: ${(p) => p.theme.text}; }
`;

const SuccessBanner = styled.div`
  background: ${(p) => p.theme.successSoft};
  border: 1px solid ${(p) => p.theme.successBorder};
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 24px;
  text-align: center;
  animation: ${fadeUp} 400ms ease both;
`;

const SuccessTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: ${(p) => p.theme.success};
  margin-bottom: 4px;
`;

const SuccessText = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.text};
`;

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
`;

export default function BankClient({ bankSlug }: { bankSlug: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const { isPro } = useAuth();
  const { startCheckout, loading: checkoutLoading } = useUpgrade();
  const searchParams = useSearchParams();
  const justUpgraded = searchParams.get("upgraded") === "true";
  const [bank, setBank] = useState<Bank | null>(null);
  const [msg, setMsg] = useState("Loading…");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // After Stripe redirect, verify payment and grant pro role
  useEffect(() => {
    if (!justUpgraded || isPro) {
      if (justUpgraded && isPro) setShowSuccess(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user || cancelled) return;

      // Call verify endpoint — checks Stripe for completed session and grants pro
      try {
        const res = await fetch("/api/verify-upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id }),
        });
        const result = await res.json();
        if (cancelled) return;

        if (result.isPro) {
          // Force full reload so AuthProvider picks up new "pro" role
          window.location.href = `/bank/${bankSlug}?upgraded=done`;
          return;
        }
      } catch (err) {
        console.error("verify-upgrade failed:", err);
      }

      // Fallback: poll user_roles in case webhook fires slightly later
      let pollCount = 0;
      const interval = setInterval(async () => {
        if (cancelled) { clearInterval(interval); return; }
        pollCount++;
        const { data: roles } = await sb
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user!.id);
        const hasPro = (roles ?? []).some((r: any) => r.role === "pro" || r.role === "admin");
        if (hasPro) {
          clearInterval(interval);
          window.location.href = `/bank/${bankSlug}?upgraded=done`;
        }
        if (pollCount >= 8) clearInterval(interval);
      }, 2500);
    })();

    return () => { cancelled = true; };
  }, [justUpgraded, isPro, sb, bankSlug]);

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
      {(showSuccess || (justUpgraded && isPro) || searchParams.get("upgraded") === "done") && (
        <SuccessBanner>
          <SuccessTitle>Payment successful!</SuccessTitle>
          <SuccessText>
            Your Study Mode is now active. All exam simulations and Study Mode features are unlocked.
          </SuccessText>
        </SuccessBanner>
      )}

      <Breadcrumb>
        <BreadcrumbLink href="/">Exams</BreadcrumbLink>
        <BreadcrumbSep>/</BreadcrumbSep>
        <span>{bank.name}</span>
      </Breadcrumb>

      <Header>
        <BankIcon><BankImg src="/images/ui/bank/bank-header.svg" alt="Question bank" /></BankIcon>
        <H1>{bank.name}</H1>
        <Desc>
          {bank.description ?? "Choose a study mode to begin. Practice builds knowledge with instant feedback; Exam Simulation tests your readiness under real exam conditions."}
        </Desc>
      </Header>

      <SectionLabel>Practice</SectionLabel>

      <Grid>
        <ModeCard href={`/bank/${bank.slug}/practice`} $variant="practice">
          <ModeHeader>
            <ModeIcon><ModeImg src="/images/ui/bank/practice.svg" alt="Practice mode" /></ModeIcon>
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
              20 randomized questions per session
            </FeatureItem>
          </FeatureList>

          <CardCta $variant="practice">Start Practice →</CardCta>
        </ModeCard>
      </Grid>

      <SectionLabel style={{ marginTop: 36 }}>Exam Simulations</SectionLabel>

      <Grid>
        {isPro ? (
          <ModeCard href={`/bank/${bank.slug}/exam/set-a/instructions`} $variant="exam">
            <ModeHeader>
              <ModeIcon><ModeImg src="/images/ui/bank/set-a.svg" alt="Set A" /></ModeIcon>
              <ModeTitleGroup>
                <ModeTitle>Simulation — Set A</ModeTitle>
                <ModeSubtitle>70 questions drawn from Set A question bank</ModeSubtitle>
              </ModeTitleGroup>
            </ModeHeader>
            <FeatureList>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Timed simulation under real exam conditions
              </FeatureItem>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Score breakdown by domain and question type
              </FeatureItem>
            </FeatureList>
            <CardCta $variant="exam">Start Set A →</CardCta>
          </ModeCard>
        ) : (
          <LockedCard onClick={() => setShowUpgrade(true)}>
            <LockBadge>STUDY MODE</LockBadge>
            <ModeHeader>
              <ModeIcon><ModeImg src="/images/ui/bank/set-a.svg" alt="Set A" /></ModeIcon>
              <ModeTitleGroup>
                <ModeTitle>Simulation — Set A</ModeTitle>
                <ModeSubtitle>70 questions drawn from Set A question bank</ModeSubtitle>
              </ModeTitleGroup>
            </ModeHeader>
            <FeatureList>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Timed simulation under real exam conditions
              </FeatureItem>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Score breakdown by domain and question type
              </FeatureItem>
            </FeatureList>
            <CardCta $variant="exam">Unlock Set A</CardCta>
          </LockedCard>
        )}

        {isPro ? (
          <ModeCard href={`/bank/${bank.slug}/exam/set-b/instructions`} $variant="exam">
            <ModeHeader>
              <ModeIcon><ModeImg src="/images/ui/bank/set-b.svg" alt="Set B" /></ModeIcon>
              <ModeTitleGroup>
                <ModeTitle>Simulation — Set B</ModeTitle>
                <ModeSubtitle>70 questions drawn from Set B question bank</ModeSubtitle>
              </ModeTitleGroup>
            </ModeHeader>
            <FeatureList>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Timed simulation under real exam conditions
              </FeatureItem>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Fresh questions — no overlap with Set A
              </FeatureItem>
            </FeatureList>
            <CardCta $variant="exam">Start Set B →</CardCta>
          </ModeCard>
        ) : (
          <LockedCard onClick={() => setShowUpgrade(true)}>
            <LockBadge>STUDY MODE</LockBadge>
            <ModeHeader>
              <ModeIcon><ModeImg src="/images/ui/bank/set-b.svg" alt="Set B" /></ModeIcon>
              <ModeTitleGroup>
                <ModeTitle>Simulation — Set B</ModeTitle>
                <ModeSubtitle>70 fresh questions — no overlap with Set A</ModeSubtitle>
              </ModeTitleGroup>
            </ModeHeader>
            <FeatureList>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Timed simulation under real exam conditions
              </FeatureItem>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Fresh questions — no overlap with Set A
              </FeatureItem>
            </FeatureList>
            <CardCta $variant="exam">Unlock Set B</CardCta>
          </LockedCard>
        )}

        {isPro ? (
          <ModeCard href={`/bank/${bank.slug}/exam/set-c/instructions`} $variant="exam">
            <ModeHeader>
              <ModeIcon><ModeImg src="/images/ui/bank/set-c.svg" alt="Set C" /></ModeIcon>
              <ModeTitleGroup>
                <ModeTitle>Simulation — Set C</ModeTitle>
                <ModeSubtitle>70 questions drawn from Set C question bank</ModeSubtitle>
              </ModeTitleGroup>
            </ModeHeader>
            <FeatureList>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Timed simulation under real exam conditions
              </FeatureItem>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Fresh questions — no overlap with Sets A or B
              </FeatureItem>
            </FeatureList>
            <CardCta $variant="exam">Start Set C →</CardCta>
          </ModeCard>
        ) : (
          <LockedCard onClick={() => setShowUpgrade(true)}>
            <LockBadge>STUDY MODE</LockBadge>
            <ModeHeader>
              <ModeIcon><ModeImg src="/images/ui/bank/set-c.svg" alt="Set C" /></ModeIcon>
              <ModeTitleGroup>
                <ModeTitle>Simulation — Set C</ModeTitle>
                <ModeSubtitle>70 fresh questions — no overlap with Sets A or B</ModeSubtitle>
              </ModeTitleGroup>
            </ModeHeader>
            <FeatureList>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Timed simulation under real exam conditions
              </FeatureItem>
              <FeatureItem>
                <FeatureDot $variant="exam">✓</FeatureDot>
                Fresh questions — no overlap with Sets A or B
              </FeatureItem>
            </FeatureList>
            <CardCta $variant="exam">Unlock Set C</CardCta>
          </LockedCard>
        )}
      </Grid>

      {/* ── Upgrade Modal ──────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradeOverlay onClick={() => setShowUpgrade(false)}>
          <UpgradeCard onClick={(e) => e.stopPropagation()}>
            <UpgradeTitle>Upgrade to Study Mode</UpgradeTitle>
            <UpgradeText>
              Unlock the full exam preparation experience and maximize your chances of passing the PMP on your first attempt.
            </UpgradeText>
            <UpgradeFeature>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                All 3 exam simulations (210 exam questions)
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Adaptive difficulty engine
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Weakness targeting per domain & topic
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Topic-level mastery insights
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Personalized study recommendations
              </UpgradeFeatureItem>
            </UpgradeFeature>
            <UpgradePrice>$29</UpgradePrice>
            <UpgradePriceNote>One-time payment · Lifetime access</UpgradePriceNote>
            <UpgradeBtn onClick={startCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Redirecting…" : "Upgrade Now"}
            </UpgradeBtn>
            <UpgradeCloseBtn onClick={() => setShowUpgrade(false)}>
              Maybe later
            </UpgradeCloseBtn>
          </UpgradeCard>
        </UpgradeOverlay>
      )}
    </>
  );
}
