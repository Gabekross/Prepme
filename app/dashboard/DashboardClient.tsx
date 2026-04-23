"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { keyframes, useTheme } from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUpgrade } from "@/lib/useUpgrade";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { loadBankBySlug, loadQuestions } from "@/src/exam-engine/data/loadFromSupabase";
import { TOPICS_BY_DOMAIN, buildTopicIndex } from "@/src/exam-engine/core/topicLabels";

/* ── types ──────────────────────────────────────────────────────────────── */

type AttemptSummary = {
  id: string;
  bank_slug: string;
  mode: "practice" | "exam";
  set_id: string | null;
  status: "in_progress" | "submitted" | "abandoned";
  total_score: number | null;
  max_score: number | null;
  score_percent: number | null;
  passed: boolean | null;
  created_at: string;
  submitted_at: string | null;
};

type DomainKey = "people" | "process" | "business_environment";

type BucketStats = {
  score: number;
  maxScore: number;
  correct: number;
  total: number;
};

type ScoreResultLite = { questionId: string; isCorrect: boolean };

type AttemptResult = {
  byDomain: Partial<Record<DomainKey, BucketStats>>;
  /** Present on all modern attempts; used for per-topic aggregation. */
  scoreResults?: ScoreResultLite[];
};

type AttemptWithResult = {
  id: string;
  mode: "practice" | "exam";
  set_id: string | null;
  bank_slug: string;
  result: AttemptResult | null;
};

type QuestionMeta = { domain: DomainKey; tags: string[] };

const DOMAIN_LABELS: Record<DomainKey, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Environment",
};

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── styled components ──────────────────────────────────────────────────── */

const Wrap = styled.div`
  max-width: 780px;
  margin: 0 auto;
  animation: ${fadeUp} 400ms ease both;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const H1 = styled.h1`
  margin: 0 0 6px;
  font-size: clamp(22px, 5vw, 30px);
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${(p) => p.theme.text};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.5;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-bottom: 32px;
  animation: ${fadeUp} 400ms 80ms ease both;
`;

const StatCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(p) => p.theme.muted};
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin: 0 0 14px;
  letter-spacing: -0.2px;
`;

const AttemptList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: ${fadeUp} 400ms 140ms ease both;
`;

const AttemptCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: ${(p) => p.theme.shadow};
  transition: border-color 150ms ease, transform 150ms ease;
  cursor: pointer;

  &:hover {
    border-color: ${(p) => p.theme.accent}60;
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
  }
`;

const DeleteBtn = styled.button`
  border: none;
  background: none;
  color: ${(p) => p.theme.muted};
  font-size: 16px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  flex-shrink: 0;
  transition: color 150ms ease, background 150ms ease;
  line-height: 1;

  &:hover {
    color: ${(p) => p.theme.error};
    background: ${(p) => p.theme.errorSoft};
  }
`;

const AttemptInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AttemptTitle = styled.div`
  font-weight: 700;
  font-size: 14px;
  color: ${(p) => p.theme.text};
  margin-bottom: 3px;
`;

const AttemptMeta = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
`;

const ScoreBadge = styled.div<{ $passed: boolean | null }>`
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: ${(p) =>
    p.$passed === null
      ? p.theme.cardBorder
      : p.$passed
        ? p.theme.successSoft
        : p.theme.errorSoft};
  color: ${(p) =>
    p.$passed === null
      ? p.theme.muted
      : p.$passed
        ? p.theme.success
        : p.theme.error};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.6;
`;

const HistoryGate = styled.div`
  margin-top: 10px;
  padding: 14px 20px;
  border-radius: 14px;
  border: 1px dashed ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.accentSoft};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const HistoryGateText = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.text};
  font-weight: 600;
  flex: 1;

  span {
    color: ${(p) => p.theme.muted};
    font-weight: 400;
  }
`;

const HistoryGateBtn = styled.button`
  border: none;
  background: ${(p) => p.theme.accent};
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 150ms ease;

  &:hover { opacity: 0.88; }
`;

const StartLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 22px;
  border-radius: 12px;
  background: ${(p) => p.theme.accent};
  color: white;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  transition: opacity 150ms ease;

  &:hover {
    opacity: 0.9;
  }
`;

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
`;

/* ── analytics styled components ───────────────────────────────────────── */

const AnalyticsSection = styled.div`
  margin-bottom: 32px;
  animation: ${fadeUp} 400ms 100ms ease both;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AnalyticsCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px;
`;

const AnalyticsCardTitle = styled.h3`
  font-size: 14px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin: 0 0 14px;
  letter-spacing: -0.2px;
`;

const BarRow = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BarLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.text};
  margin-bottom: 5px;
`;

const BarLabelRight = styled.span`
  color: ${(p) => p.theme.muted};
  font-weight: 500;
`;

const BarTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: ${(p) => p.theme.cardBorder};
  overflow: hidden;
`;

const BarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${(p) => Math.max(p.$pct, 2)}%;
  border-radius: 4px;
  background: ${(p) => p.$color};
  transition: width 600ms ease;
`;

/* ── shared empty/loading state for the Topic Performance card ─────────── */

const TopicEmpty = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  padding: 6px 0;
`;

const FocusCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 18px;
`;

const FocusItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FocusIcon = styled.span`
  font-size: 16px;
  line-height: 1.3;
  flex-shrink: 0;
`;

const FocusText = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.text};
  line-height: 1.4;
`;

const FocusPercent = styled.span<{ $color: string }>`
  font-weight: 700;
  color: ${(p) => p.$color};
`;

const ProGateCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const ProGateBlur = styled.div`
  filter: blur(6px);
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
`;

const ProGateOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  gap: 8px;
`;

const ProGateLabel = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${(p) => p.theme.warning};
  background: ${(p) => p.theme.warningSoft};
  border: 1px solid ${(p) => p.theme.warningBorder};
  padding: 4px 12px;
  border-radius: 8px;
`;

const ProGateText = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  max-width: 260px;
`;

const ProGateBtn = styled.button`
  display: inline-block;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.accent};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover { text-decoration: underline; }
`;

/* ── upgrade modal ─────────────────────────────────────────────────────── */

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

const UpgradeModalCard = styled.div`
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

const UpgradeModalBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: none;
  background: ${(p) => p.theme.accent};
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

const TabRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.$active ? p.theme.accent : p.theme.cardBorder};
  background: ${(p) => p.$active ? p.theme.accentSoft : p.theme.buttonBg};
  color: ${(p) => p.$active ? p.theme.accent : p.theme.muted};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    border-color: ${(p) => p.theme.accent};
    color: ${(p) => p.theme.accent};
  }
`;

const SetBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  margin-left: 6px;
  vertical-align: middle;
`;

const NoData = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  padding: 16px 0;
  text-align: center;
`;

/* ── helpers ─────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function setLabel(setId: string | null) {
  if (!setId) return "";
  return setId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pctColor(pct: number, theme: { success: string; warning: string; error: string }) {
  if (pct >= 70) return theme.success;
  if (pct >= 50) return theme.warning;
  return theme.error;
}

type AggBucket = { correct: number; total: number };

function aggregateResults(results: AttemptResult[]) {
  const byDomain: Record<string, AggBucket> = {};

  for (const r of results) {
    if (r.byDomain) {
      for (const [k, v] of Object.entries(r.byDomain)) {
        if (!v) continue;
        if (!byDomain[k]) byDomain[k] = { correct: 0, total: 0 };
        byDomain[k].correct += v.correct;
        byDomain[k].total += v.total;
      }
    }
  }

  return { byDomain };
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function DashboardClient() {
  const { user, loading: authLoading, isPro } = useAuth();
  const { startCheckout, loading: checkoutLoading } = useUpgrade();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const router = useRouter();
  const theme = useTheme() as { success: string; warning: string; error: string };
  const sb = useMemo(() => supabaseBrowser(), []);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [allResults, setAllResults] = useState<AttemptWithResult[]>([]);
  const [questionMeta, setQuestionMeta] = useState<Map<string, QuestionMeta>>(new Map());
  const [loadedBankSlugs, setLoadedBankSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [analyticsTab, setAnalyticsTab] = useState<"practice" | "exam">("practice");

  // Single user-scoped query powers both summary cards and analytics so the
  // two sections can never drift. Called on mount and after every delete.
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await sb
        .from("attempts")
        .select(
          "id, bank_slug, mode, set_id, status, total_score, max_score, score_percent, passed, created_at, submitted_at, result"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data as (AttemptSummary & { result: AttemptResult | null })[]) ?? [];

      setAttempts(rows.map(({ result: _r, ...rest }) => rest));

      setAllResults(
        rows
          .filter((r) => r.status === "submitted" && r.result !== null)
          .map((r) => ({
            id: r.id,
            mode: r.mode,
            set_id: r.set_id,
            bank_slug: r.bank_slug,
            result: r.result,
          }))
      );
    } catch (err) {
      console.error("[Dashboard] Failed to load data:", err);
    }
  }, [user, sb]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      await loadData();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, loadData]);

  // Lazy-load the question bank(s) needed to resolve questionId → tags for
  // per-topic aggregation. Only loads banks we haven't already fetched.
  useEffect(() => {
    if (!user || allResults.length === 0) return;
    const slugs = Array.from(new Set(allResults.map((r) => r.bank_slug).filter(Boolean)));
    const missing = slugs.filter((s) => !loadedBankSlugs.has(s));
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const merged = new Map(questionMeta);
        await Promise.all(
          missing.map(async (slug) => {
            const bank = await loadBankBySlug(slug);
            const qs = await loadQuestions(bank.id);
            for (const q of qs) {
              merged.set(q.id, { domain: q.domain as DomainKey, tags: q.tags ?? [] });
            }
          })
        );
        if (cancelled) return;
        setQuestionMeta(merged);
        setLoadedBankSlugs((prev) => {
          const next = new Set(prev);
          for (const s of missing) next.add(s);
          return next;
        });
      } catch (err) {
        console.error("[Dashboard] Failed to load question bank(s) for topic analytics:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // questionMeta is intentionally excluded: we read it as a starting point
    // but don't want to re-run when we write to it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allResults, loadedBankSlugs]);

  /* ── derived data (all hooks MUST run before any early return) ──────── */

  const submitted = useMemo(() => attempts.filter((a) => a.status === "submitted"), [attempts]);
  const examAttempts = useMemo(() => submitted.filter((a) => a.mode === "exam"), [submitted]);
  const practiceAttempts = useMemo(() => submitted.filter((a) => a.mode === "practice"), [submitted]);
  const passedExams = useMemo(() => examAttempts.filter((a) => a.passed), [examAttempts]);
  const avgScore = useMemo(
    () =>
      examAttempts.length > 0
        ? Math.round(
            examAttempts.reduce((sum, a) => sum + (a.score_percent ?? 0), 0) /
              examAttempts.length
          )
        : null,
    [examAttempts]
  );

  // Split results by mode
  const practiceResults = useMemo(
    () => allResults.filter((r) => r.mode === "practice").map((r) => r.result as AttemptResult),
    [allResults]
  );
  const examResults = useMemo(
    () => allResults.filter((r) => r.mode === "exam").map((r) => r.result as AttemptResult),
    [allResults]
  );

  // Aggregate for whichever tab is active
  const activeResults = analyticsTab === "practice" ? practiceResults : examResults;
  const agg = useMemo(() => aggregateResults(activeResults), [activeResults]);

  const domainEntries = useMemo(() => {
    return (Object.keys(DOMAIN_LABELS) as DomainKey[])
      .filter((k) => agg.byDomain[k] && agg.byDomain[k].total > 0)
      .map((k) => {
        const b = agg.byDomain[k];
        const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
        return { key: k, label: DOMAIN_LABELS[k], pct, correct: b.correct, total: b.total };
      });
  }, [agg]);

  // Per-domain topic breakdown. Derived from scoreResults (questionId +
  // isCorrect) cross-referenced with the loaded question bank's tags,
  // bucketed via TOPICS_BY_DOMAIN. Anything that doesn't match a curated
  // bucket falls into an "Other" group so the user always sees their data.
  const OTHER_TOPIC_ID = "__other__";
  const topicEntriesByDomain = useMemo(() => {
    const out: Record<DomainKey, { id: string; label: string; correct: number; total: number; pct: number }[]> = {
      people: [],
      process: [],
      business_environment: [],
    };

    const modeResults = analyticsTab === "practice"
      ? allResults.filter((r) => r.mode === "practice")
      : allResults.filter((r) => r.mode === "exam");
    if (modeResults.length === 0 || questionMeta.size === 0) return out;

    const topicIndex = buildTopicIndex();
    const buckets: Record<DomainKey, Record<string, { correct: number; total: number }>> = {
      people: {},
      process: {},
      business_environment: {},
    };

    for (const row of modeResults) {
      const sr = row.result?.scoreResults;
      if (!sr || sr.length === 0) continue;
      for (const s of sr) {
        const meta = questionMeta.get(s.questionId);
        if (!meta) continue;
        const idx = topicIndex[meta.domain];
        const matched = new Set<string>();
        if (idx) {
          for (const rawTag of meta.tags) {
            const hit = idx.get(rawTag.toLowerCase());
            if (!hit) continue;
            for (const topicId of hit) matched.add(topicId);
          }
        }
        // Fallback: if no curated topic matched, put this question under "Other"
        // so the user still sees it. A question contributes to either its
        // curated topic(s) or Other — never both.
        if (matched.size === 0) matched.add(OTHER_TOPIC_ID);

        for (const topicId of matched) {
          const b = (buckets[meta.domain][topicId] ||= { correct: 0, total: 0 });
          b.total += 1;
          if (s.isCorrect) b.correct += 1;
        }
      }
    }

    (Object.keys(out) as DomainKey[]).forEach((d) => {
      const ordered = TOPICS_BY_DOMAIN[d];
      const curated = ordered
        .map((t) => {
          const b = buckets[d][t.id];
          if (!b || b.total === 0) return null;
          const pct = Math.round((b.correct / b.total) * 100);
          return { id: t.id, label: t.label, correct: b.correct, total: b.total, pct };
        })
        .filter((x): x is { id: string; label: string; correct: number; total: number; pct: number } => x !== null);

      const otherBucket = buckets[d][OTHER_TOPIC_ID];
      const other = otherBucket && otherBucket.total > 0
        ? [{
            id: OTHER_TOPIC_ID,
            label: "Other",
            correct: otherBucket.correct,
            total: otherBucket.total,
            pct: Math.round((otherBucket.correct / otherBucket.total) * 100),
          }]
        : [];

      out[d] = [...curated, ...other];
    });
    return out;
  }, [allResults, analyticsTab, questionMeta]);

  // True once we've fetched the question bank(s) needed for tag lookup —
  // used to distinguish "loading" from "genuinely no topic data".
  const topicsReady = questionMeta.size > 0;

  // Flat topic list across all domains for the active tab — feeds the
  // Topic Performance card and the Focus Areas pick for Pro users.
  const topicEntriesFlat = useMemo(() => {
    const domOrder: Record<string, number> = { people: 0, process: 1, business_environment: 2 };
    const flat = (Object.keys(topicEntriesByDomain) as DomainKey[]).flatMap((d) =>
      topicEntriesByDomain[d].map((t) => ({
        key: `${d}:${t.id}`,
        label: t.label,
        domain: d,
        domainLabel: DOMAIN_LABELS[d],
        correct: t.correct,
        total: t.total,
        pct: t.pct,
      }))
    );
    flat.sort((a, b) => {
      const dd = (domOrder[a.domain] ?? 9) - (domOrder[b.domain] ?? 9);
      if (dd !== 0) return dd;
      return b.total - a.total;
    });
    return flat;
  }, [topicEntriesByDomain]);

  // Focus Areas: for Pro, pick the 3 weakest topics with at least 2 attempts
  // of signal. For free users (who can't see topics), fall back to weakest
  // domains. Requires at least 2 attempts in the active mode to show at all.
  const weakAreas = useMemo(() => {
    const modeAttempts = analyticsTab === "practice" ? practiceAttempts : examAttempts;
    if (modeAttempts.length < 2) return [];

    if (isPro && topicEntriesFlat.length > 0) {
      const candidates = topicEntriesFlat.filter((t) => t.total >= 2);
      const pool = candidates.length > 0 ? candidates : topicEntriesFlat;
      return [...pool]
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 3)
        .map((t) => ({
          label: t.label,
          pct: t.pct,
          kind: "topic" as const,
          domainLabel: t.domainLabel,
          isOther: t.key.endsWith(`:${OTHER_TOPIC_ID}`),
        }));
    }

    return [...domainEntries]
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map((d) => ({
        label: d.label,
        pct: d.pct,
        kind: "domain" as const,
        domainLabel: undefined,
        isOther: false,
      }));
  }, [
    isPro,
    topicEntriesFlat,
    domainEntries,
    practiceAttempts,
    examAttempts,
    analyticsTab,
  ]);

  // Exam set breakdown
  const examSetBreakdown = useMemo(() => {
    if (analyticsTab !== "exam") return [];
    const setMap: Record<string, AttemptResult[]> = {};
    for (const r of allResults) {
      if (r.mode !== "exam" || !r.result) continue;
      const key = r.set_id ?? "other";
      if (!setMap[key]) setMap[key] = [];
      setMap[key].push(r.result as AttemptResult);
    }
    return Object.entries(setMap).map(([setId, results]) => {
      const agg = aggregateResults(results);
      const totalCorrect = Object.values(agg.byDomain).reduce((s, b) => s + b.correct, 0);
      const totalQ = Object.values(agg.byDomain).reduce((s, b) => s + b.total, 0);
      const pct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
      const label = setId === "other" ? "Other" : setId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return { setId, label, pct, correct: totalCorrect, total: totalQ, attempts: results.length };
    });
  }, [allResults, analyticsTab]);

  const deleteAttempt = useCallback(async (attemptId: string) => {
    if (!user) return;
    const ok = window.confirm("Delete this attempt? This cannot be undone.");
    if (!ok) return;
    try {
      const { error } = await sb
        .from("attempts")
        .delete()
        .eq("id", attemptId)
        .eq("user_id", user.id);
      if (error) throw error;

      // Optimistic update for snappy UI...
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
      setAllResults((prev) => prev.filter((r) => r.id !== attemptId));

      // ...then refetch so summary cards AND analytics are guaranteed to match
      // the DB (covers cascades and any rows filtered out of allResults at load).
      await loadData();
    } catch (err) {
      console.error("[Dashboard] Failed to delete attempt:", err);
    }
  }, [user, sb, loadData]);

  /* ── early returns (after all hooks) ───────────────────────────────── */

  if (authLoading || loading) return <P>Loading dashboard...</P>;
  if (!user) return <P>Please sign in to view your dashboard.</P>;

  return (
    <Wrap>
      <Header>
        <H1>Dashboard</H1>
        <Subtitle>
          Track your progress and review past exam attempts.
        </Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{examAttempts.length}</StatValue>
          <StatLabel>Exams Taken</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{practiceAttempts.length}</StatValue>
          <StatLabel>Practice Sessions</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{avgScore !== null ? `${avgScore}%` : "—"}</StatValue>
          <StatLabel>Avg Exam Score</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{passedExams.length}</StatValue>
          <StatLabel>Exams Passed</StatLabel>
        </StatCard>
      </StatsGrid>

      {allResults.length > 0 && (
        <AnalyticsSection>
          <SectionTitle>Performance Analytics</SectionTitle>

          <TabRow>
            <Tab $active={analyticsTab === "practice"} onClick={() => setAnalyticsTab("practice")}>
              Practice ({practiceResults.length})
            </Tab>
            <Tab $active={analyticsTab === "exam"} onClick={() => setAnalyticsTab("exam")}>
              Exam Simulations ({examResults.length})
            </Tab>
          </TabRow>

          {activeResults.length === 0 ? (
            <NoData>
              No {analyticsTab === "practice" ? "practice" : "exam"} results yet.
            </NoData>
          ) : (
            <>
              {/* Exam set breakdown */}
              {analyticsTab === "exam" && examSetBreakdown.length > 0 && (
                <AnalyticsCard style={{ marginBottom: 14 }}>
                  <AnalyticsCardTitle>Performance by Exam Set</AnalyticsCardTitle>
                  {examSetBreakdown.map((s) => (
                    <BarRow key={s.setId}>
                      <BarLabel>
                        <span>{s.label} <SetBadge>{s.attempts} attempt{s.attempts !== 1 ? "s" : ""}</SetBadge></span>
                        <BarLabelRight>
                          {s.pct}% ({s.correct}/{s.total})
                        </BarLabelRight>
                      </BarLabel>
                      <BarTrack>
                        <BarFill $pct={s.pct} $color={pctColor(s.pct, theme)} />
                      </BarTrack>
                    </BarRow>
                  ))}
                </AnalyticsCard>
              )}

              <AnalyticsGrid>
                {domainEntries.length > 0 && (
                  <AnalyticsCard>
                    <AnalyticsCardTitle>Domain Performance</AnalyticsCardTitle>
                    {domainEntries.map((d) => (
                      <BarRow key={d.key}>
                        <BarLabel>
                          <span>{d.label}</span>
                          <BarLabelRight>
                            {d.pct}% ({d.correct}/{d.total})
                          </BarLabelRight>
                        </BarLabel>
                        <BarTrack>
                          <BarFill $pct={d.pct} $color={pctColor(d.pct, theme)} />
                        </BarTrack>
                      </BarRow>
                    ))}
                  </AnalyticsCard>
                )}
                {domainEntries.length > 0 && (
                  isPro ? (
                    <AnalyticsCard>
                      <AnalyticsCardTitle>Topic Performance</AnalyticsCardTitle>
                      {!topicsReady ? (
                        <TopicEmpty>Loading topic data…</TopicEmpty>
                      ) : topicEntriesFlat.length === 0 ? (
                        <TopicEmpty>No topic data available yet.</TopicEmpty>
                      ) : (
                        topicEntriesFlat.map((t) => (
                          <BarRow key={t.key}>
                            <BarLabel>
                              <span>
                                {t.label}{" "}
                                <SetBadge>{t.domainLabel}</SetBadge>
                              </span>
                              <BarLabelRight>
                                {t.pct}% ({t.correct}/{t.total})
                              </BarLabelRight>
                            </BarLabel>
                            <BarTrack>
                              <BarFill $pct={t.pct} $color={pctColor(t.pct, theme)} />
                            </BarTrack>
                          </BarRow>
                        ))
                      )}
                    </AnalyticsCard>
                  ) : (
                    <ProGateCard>
                      <ProGateOverlay>
                        <ProGateLabel>STUDY MODE</ProGateLabel>
                        <ProGateText>Unlock per-topic performance breakdown</ProGateText>
                        <ProGateBtn onClick={() => setShowUpgrade(true)}>Upgrade to Study Mode</ProGateBtn>
                      </ProGateOverlay>
                      <ProGateBlur>
                        {(topicsReady ? topicEntriesFlat.slice(0, 6) : []).map((t) => (
                          <BarRow key={t.key}>
                            <BarLabel><span>{t.label}</span></BarLabel>
                            <BarTrack><BarFill $pct={t.pct} $color="#666" /></BarTrack>
                          </BarRow>
                        ))}
                      </ProGateBlur>
                    </ProGateCard>
                  )
                )}
              </AnalyticsGrid>

              {weakAreas.length > 0 && (
                isPro ? (
                  <FocusCard>
                    <AnalyticsCardTitle>
                      Focus Areas
                      <SetBadge>{analyticsTab === "practice" ? "Practice" : "Exam"}</SetBadge>
                    </AnalyticsCardTitle>
                    {weakAreas.map((w) => (
                      <FocusItem key={`${w.kind}:${w.domainLabel ?? ""}:${w.label}`}>
                        <FocusIcon>{w.pct < 50 ? "\u26A0" : "\u25CB"}</FocusIcon>
                        <FocusText>
                          {w.isOther && w.domainLabel ? (
                            <>Practice more of the {w.domainLabel} domain</>
                          ) : (
                            <>
                              <FocusPercent $color={pctColor(w.pct, theme)}>
                                {w.pct}%
                              </FocusPercent>{" "}
                              accuracy in {w.label}
                              {w.kind === "topic" && w.domainLabel ? ` (${w.domainLabel})` : ""}
                              {" "}&mdash; Practice more{" "}
                              {w.kind === "domain"
                                ? `${w.label} domain questions`
                                : `${w.label} questions`}
                            </>
                          )}
                        </FocusText>
                      </FocusItem>
                    ))}
                  </FocusCard>
                ) : (
                  <ProGateCard>
                    <ProGateOverlay>
                      <ProGateLabel>STUDY MODE</ProGateLabel>
                      <ProGateText>Unlock personalized focus areas & study recommendations</ProGateText>
                      <ProGateBtn onClick={() => setShowUpgrade(true)}>Upgrade to Study Mode</ProGateBtn>
                    </ProGateOverlay>
                    <ProGateBlur>
                      <FocusItem>
                        <FocusIcon>&#x26A0;</FocusIcon>
                        <FocusText>Focus area insights appear here</FocusText>
                      </FocusItem>
                      <FocusItem>
                        <FocusIcon>&#x25CB;</FocusIcon>
                        <FocusText>Personalized recommendations appear here</FocusText>
                      </FocusItem>
                    </ProGateBlur>
                  </ProGateCard>
                )
              )}
            </>
          )}
        </AnalyticsSection>
      )}

      {submitted.length === 0 ? (
        <EmptyState>
          <div>No completed attempts yet.</div>
          <div>Start a practice session or exam simulation to track your progress here.</div>
          <StartLink href="/bank/pmp">Go to PMP Exam</StartLink>
        </EmptyState>
      ) : (
        <>
          <SectionTitle>Recent Attempts</SectionTitle>
          <AttemptList>
            {(isPro ? submitted : submitted.slice(0, 3)).map((a) => (
              <AttemptCard
                key={a.id}
                onClick={() => router.push(`/dashboard/results/${a.id}`)}
              >
                <AttemptInfo>
                  <AttemptTitle>
                    {a.mode === "exam" ? "Exam Simulation" : "Practice Session"}
                    {a.set_id ? ` — ${setLabel(a.set_id)}` : ""}
                  </AttemptTitle>
                  <AttemptMeta>
                    {formatDate(a.submitted_at ?? a.created_at)}
                    {a.score_percent !== null && ` · Score: ${a.score_percent}%`}
                  </AttemptMeta>
                </AttemptInfo>
                <ScoreBadge $passed={a.passed}>
                  {a.score_percent !== null ? `${a.score_percent}%` : "—"}
                </ScoreBadge>
                <DeleteBtn
                  onClick={(e) => { e.stopPropagation(); deleteAttempt(a.id); }}
                  title="Delete attempt"
                >
                  ✕
                </DeleteBtn>
              </AttemptCard>
            ))}
          </AttemptList>
          {!isPro && submitted.length > 3 && (
            <HistoryGate>
              <HistoryGateText>
                {submitted.length - 3} older attempt{submitted.length - 3 === 1 ? "" : "s"} hidden.{" "}
                <span>Study Mode unlocks your full attempt history.</span>
              </HistoryGateText>
              <HistoryGateBtn onClick={() => setShowUpgrade(true)}>
                Unlock History
              </HistoryGateBtn>
            </HistoryGate>
          )}
        </>
      )}
      {/* ── Upgrade Modal ──────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradeOverlay onClick={() => setShowUpgrade(false)}>
          <UpgradeModalCard onClick={(e) => e.stopPropagation()}>
            <UpgradeTitle>Upgrade to Study Mode</UpgradeTitle>
            <UpgradeText>
              Most PMP candidates fail because they don't know where they're losing marks. Study Mode shows you exactly that.
            </UpgradeText>
            <UpgradeFeature>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Topic-level breakdown — see exactly where you're losing marks
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                2 more full simulations — Sets B & C (fresh questions)
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Personalized focus areas — top 3 weak spots to fix first
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Full attempt history — track improvement over time
              </UpgradeFeatureItem>
              <UpgradeFeatureItem>
                <UpgradeCheckmark>✓</UpgradeCheckmark>
                Extended practice sessions (50 & 90 questions)
              </UpgradeFeatureItem>
            </UpgradeFeature>
            <UpgradePrice>$29</UpgradePrice>
            <UpgradePriceNote>One-time payment · Lifetime access · Less than a practice exam book</UpgradePriceNote>
            <UpgradeModalBtn onClick={startCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Redirecting…" : "Unlock Study Mode"}
            </UpgradeModalBtn>
            <UpgradeCloseBtn onClick={() => setShowUpgrade(false)}>
              Maybe later
            </UpgradeCloseBtn>
          </UpgradeModalCard>
        </UpgradeOverlay>
      )}
    </Wrap>
  );
}
