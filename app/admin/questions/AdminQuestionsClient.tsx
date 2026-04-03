"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { requireAdminClient } from "@/src/admin/requireAdmin";
import type { Question, Scenario } from "@/src/exam-engine/core/types";
import { QuestionRenderer } from "@/src/exam-engine/ui/QuestionRenderer";
import { loadBankBySlug, loadQuestions, loadScenarios } from "@/src/exam-engine/data/loadFromSupabase";

import McqSingleForm from "@/src/admin/forms/McqSingleForm";
import McqMultiForm from "@/src/admin/forms/McqMultiForm";
import DndMatchForm from "@/src/admin/forms/DndMatchForm";
import DndOrderForm from "@/src/admin/forms/DndOrderForm";
import FillBlankForm from "@/src/admin/forms/FillBlankForm";
import HotspotForm from "@/src/admin/forms/HotspotForm";

type Bank = { id: string; slug: string; name: string };
const LS_BANK_KEY = "admin_questions_selected_bank_slug";

type DbRow = {
  id: string;
  question_key: string;
  type: Question["type"];
  domain: Question["domain"];
  prompt: string;
  scenario_key: string | null;
  difficulty: number | null;
  tags: string[];
  access_tier: "free" | "premium";
  set_id: "free" | "set_a" | "set_b" | "set_c";
  version: number;
  is_published: boolean;
  created_at?: string;
  media: any;
  payload: any;
  answer_key: any;
  explanation: string | null;
};

/* ─── animations ─────────────────────────────────────────────────────────── */

const fadeIn = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`;

/* ─── layout ─────────────────────────────────────────────────────────────── */

const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
`;

const Layout = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
  align-items: start;

  @media (min-width: 1100px) {
    grid-template-columns: 340px 1fr 1fr;
  }
`;

/* ─── sticky card ────────────────────────────────────────────────────────── */

const Card = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 16px;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
  animation: ${fadeIn} 200ms ease both;

  @media (min-width: 1100px) {
    position: sticky;
    top: 72px;
    max-height: calc(100vh - 86px);
    overflow-y: auto;
    /* nice scrollbar */
    scrollbar-width: thin;
    scrollbar-color: ${(p) => p.theme.cardBorder} transparent;
    &::-webkit-scrollbar { width: 5px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: ${(p) => p.theme.cardBorder}; border-radius: 99px; }
  }
`;

/* ─── admin header ───────────────────────────────────────────────────────── */

const AdminHeader = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
`;

const AdminHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const AdminIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #7c3aed);
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const AdminTitle = styled.h1`
  margin: 0;
  font-size: 17px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.3px;
`;

const AdminSubtitle = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-top: 1px;
`;

const StatChips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const StatChip = styled.div<{ $tone?: "ok" | "warn" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) =>
    p.$tone === "ok" ? p.theme.successBorder
    : p.$tone === "warn" ? p.theme.warningBorder
    : p.theme.cardBorder};
  background: ${(p) =>
    p.$tone === "ok" ? p.theme.successSoft
    : p.$tone === "warn" ? p.theme.warningSoft
    : p.theme.cardBg2};
  color: ${(p) =>
    p.$tone === "ok" ? p.theme.success
    : p.$tone === "warn" ? p.theme.warning
    : p.theme.muted};
`;

/* ─── status message ─────────────────────────────────────────────────────── */

const StatusBar = styled.div<{ $type?: "ok" | "error" | "info" }>`
  font-size: 12.5px;
  font-weight: 600;
  color: ${(p) =>
    p.$type === "ok" ? p.theme.success
    : p.$type === "error" ? p.theme.error
    : p.theme.muted};
  padding: 8px 12px;
  background: ${(p) =>
    p.$type === "ok" ? p.theme.successSoft
    : p.$type === "error" ? p.theme.errorSoft
    : p.theme.cardBg2};
  border: 1px solid ${(p) =>
    p.$type === "ok" ? p.theme.successBorder
    : p.$type === "error" ? p.theme.errorBorder
    : p.theme.cardBorder};
  border-radius: 10px;
  line-height: 1.4;
  word-break: break-word;
`;

/* ─── section headers inside cards ──────────────────────────────────────── */

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 10px;
  &:first-child { margin-top: 0; }
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
  white-space: nowrap;
`;

const SectionLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${(p) => p.theme.divider};
`;

/* ─── form primitives ────────────────────────────────────────────────────── */

const FormGrid = styled.div`
  display: grid;
  gap: 10px;
`;

const FieldRow = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
  align-items: start;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: grid;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  color: ${(p) => p.theme.mutedStrong};
  min-width: 0;
`;

const CharCount = styled.span`
  font-size: 10.5px;
  font-weight: 500;
  color: ${(p) => p.theme.muted};
  justify-self: end;
`;

const Input = styled.input`
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 9px 12px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  font-size: 13px;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder { color: ${(p) => p.theme.muted}; }
  &:focus {
    border-color: ${(p) => p.theme.accent};
    box-shadow: 0 0 0 3px ${(p) => p.theme.accentSoft};
  }
`;

const Select = styled.select`
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 9px 12px;
  outline: none;
  width: 100%;
  font-size: 13px;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:focus {
    border-color: ${(p) => p.theme.accent};
    box-shadow: 0 0 0 3px ${(p) => p.theme.accentSoft};
  }
`;

const Textarea = styled.textarea`
  min-height: 100px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 9px 12px;
  outline: none;
  line-height: 1.5;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  font-size: 13px;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder { color: ${(p) => p.theme.muted}; }
  &:focus {
    border-color: ${(p) => p.theme.accent};
    box-shadow: 0 0 0 3px ${(p) => p.theme.accentSoft};
  }
`;

const JsonArea = styled(Textarea)`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 11.5px;
  min-height: 140px;
  line-height: 1.55;
`;

/* ─── buttons ────────────────────────────────────────────────────────────── */

const BtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const Button = styled.button<{ $variant?: "primary" | "danger" | "default" }>`
  border-radius: 10px;
  border: 1px solid ${(p) =>
    p.$variant === "primary" ? "transparent"
    : p.$variant === "danger" ? p.theme.errorBorder
    : p.theme.buttonBorder};
  background: ${(p) =>
    p.$variant === "primary" ? p.theme.accent
    : p.$variant === "danger" ? p.theme.errorSoft
    : p.theme.buttonBg};
  color: ${(p) =>
    p.$variant === "primary" ? "white"
    : p.$variant === "danger" ? p.theme.error
    : p.theme.text};
  padding: 9px 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 12.5px;
  transition: background 140ms ease, transform 80ms ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$variant === "primary" ? p.theme.accentHover
      : p.$variant === "danger" ? p.theme.error
      : p.theme.buttonHover};
    color: ${(p) =>
      p.$variant === "primary" ? "white"
      : p.$variant === "danger" ? "white"
      : p.theme.text};
    transform: translateY(-1px);
  }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: 0.42; cursor: not-allowed; }
`;

const SaveBtn = styled(Button)`
  flex: 1;
  font-size: 13.5px;
  padding: 11px 18px;
`;

const MiniBtn = styled.button<{ $danger?: boolean; $active?: boolean }>`
  border-radius: 8px;
  border: 1px solid ${(p) =>
    p.$danger ? p.theme.errorBorder
    : p.$active ? p.theme.accent
    : p.theme.buttonBorder};
  background: ${(p) =>
    p.$danger ? p.theme.errorSoft
    : p.$active ? p.theme.accentSoft
    : p.theme.buttonBg};
  color: ${(p) =>
    p.$danger ? p.theme.error
    : p.$active ? p.theme.accent
    : p.theme.text};
  padding: 4px 9px;
  cursor: pointer;
  font-weight: 700;
  font-size: 11px;
  white-space: nowrap;
  transition: background 120ms ease;
  flex-shrink: 0;

  &:hover {
    background: ${(p) => p.$danger ? p.theme.error : p.$active ? p.theme.accent : p.theme.buttonHover};
    color: ${(p) => (p.$danger || p.$active) ? "white" : p.theme.text};
  }
`;

/* ─── filter section ─────────────────────────────────────────────────────── */

const FilterGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr 1fr;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

/* ─── question list ──────────────────────────────────────────────────────── */

const ListCount = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => p.theme.muted};
  margin-bottom: 8px;
`;

const List = styled.div`
  display: grid;
  gap: 6px;
`;

const Item = styled.button<{ $active?: boolean }>`
  width: 100%;
  text-align: left;
  border-radius: 12px;
  border: 1.5px solid ${(p) => p.$active ? p.theme.accent : p.theme.cardBorder};
  background: ${(p) => p.$active ? p.theme.accentSoft : p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 10px 12px;
  cursor: pointer;
  min-width: 0;
  transition: background 120ms ease, border-color 120ms ease, transform 80ms ease;

  &:hover {
    background: ${(p) => p.$active ? p.theme.accentSoft : p.theme.buttonHover};
    border-color: ${(p) => p.$active ? p.theme.accent : `${p.theme.accent}50`};
    transform: translateX(2px);
  }
`;

const ItemKey = styled.div`
  font-size: 12.5px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  word-break: break-all;
  min-width: 0;
  line-height: 1.35;
`;

const ItemPromptPreview = styled.div`
  font-size: 11.5px;
  color: ${(p) => p.theme.muted};
  margin-top: 3px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
`;

const ItemFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
`;

const ItemBadges = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 0;
`;

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${(p) =>
    p.$type.startsWith("mcq") ? p.theme.accentSoft
    : p.$type.startsWith("dnd") ? "rgba(168,85,247,0.12)"
    : p.$type === "hotspot" ? "rgba(251,146,60,0.14)"
    : p.theme.warningSoft};
  color: ${(p) =>
    p.$type.startsWith("mcq") ? p.theme.accent
    : p.$type.startsWith("dnd") ? (p.theme.name === "dark" ? "#c084fc" : "#7c3aed")
    : p.$type === "hotspot" ? (p.theme.name === "dark" ? "#fb923c" : "#c2410c")
    : p.theme.warning};
  border: 1px solid ${(p) =>
    p.$type.startsWith("mcq") ? `${p.theme.accent}30`
    : p.$type.startsWith("dnd") ? "rgba(168,85,247,0.25)"
    : p.$type === "hotspot" ? "rgba(251,146,60,0.30)"
    : p.theme.warningBorder};
`;

const StatusBadge = styled.span<{ $ok: boolean }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${(p) => p.$ok ? p.theme.successSoft : p.theme.warningSoft};
  color: ${(p) => p.$ok ? p.theme.success : p.theme.warning};
  border: 1px solid ${(p) => p.$ok ? p.theme.successBorder : p.theme.warningBorder};
`;

/* ─── pagination ─────────────────────────────────────────────────────────── */

const PagRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const PagInfo = styled.div`
  font-size: 11.5px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
`;

/* ─── divider ────────────────────────────────────────────────────────────── */

const Divider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.divider};
  margin: 12px 0;
`;

/* ─── pills / badges ─────────────────────────────────────────────────────── */

const Pill = styled.span<{ $tone?: "ok" | "warn" | "bad" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) =>
    p.$tone === "ok" ? p.theme.successBorder
    : p.$tone === "warn" ? p.theme.warningBorder
    : p.$tone === "bad" ? p.theme.errorBorder
    : p.theme.cardBorder};
  background: ${(p) =>
    p.$tone === "ok" ? p.theme.successSoft
    : p.$tone === "warn" ? p.theme.warningSoft
    : p.$tone === "bad" ? p.theme.errorSoft
    : p.theme.cardBg2};
  color: ${(p) =>
    p.$tone === "ok" ? p.theme.success
    : p.$tone === "warn" ? p.theme.warning
    : p.$tone === "bad" ? p.theme.error
    : p.theme.muted};
`;

/* ─── error box ──────────────────────────────────────────────────────────── */

const ErrorBox = styled.div`
  border: 1px solid ${(p) => p.theme.errorBorder};
  background: ${(p) => p.theme.errorSoft};
  color: ${(p) => p.theme.error};
  border-radius: 12px;
  padding: 12px;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
  overflow-wrap: break-word;

  ul { margin: 6px 0 0; padding-left: 18px; }
  li { margin-bottom: 2px; }
`;

/* ─── import box ─────────────────────────────────────────────────────────── */

const ImportBox = styled.div`
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 10px;
`;

const FileInput = styled.input`
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 9px 12px;
  outline: none;
  font-size: 12.5px;
  width: 100%;
  box-sizing: border-box;
`;

const SmallList = styled.ul`
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.5;
`;

const Msg = styled.div`
  font-size: 12.5px;
  color: ${(p) => p.theme.muted};
  line-height: 1.4;
  word-break: break-word;
`;

/* ─── keyboard hint ──────────────────────────────────────────────────────── */

const KbdHint = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.muted};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Kbd = styled.kbd`
  background: ${(p) => p.theme.buttonBg};
  border: 1px solid ${(p) => p.theme.buttonBorder};
  border-radius: 5px;
  padding: 1px 5px;
  font-size: 10px;
  font-family: ui-monospace, monospace;
  color: ${(p) => p.theme.text};
`;

/* ─── helper functions ───────────────────────────────────────────────────── */

function safeParseJson(s: string) {
  try {
    return { ok: true as const, value: JSON.parse(s) };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? "Invalid JSON" };
  }
}

function validateQuestion(q: Question): string[] {
  const errs: string[] = [];
  if (!q.id.trim()) errs.push("Question key is required.");
  if (!q.prompt.trim()) errs.push("Prompt is required.");

  if (q.type === "mcq_single") {
    const choices = (q as any).payload?.choices;
    if (!Array.isArray(choices) || choices.length < 2) errs.push("mcq_single requires at least 2 choices.");
    if (!(q as any).answerKey?.correctChoiceId) errs.push("mcq_single requires answerKey.correctChoiceId.");
  }
  if (q.type === "mcq_multi") {
    const choices = (q as any).payload?.choices;
    const correct = (q as any).answerKey?.correctChoiceIds;
    if (!Array.isArray(choices) || choices.length < 2) errs.push("mcq_multi requires at least 2 choices.");
    if (!Array.isArray(correct) || correct.length < 1) errs.push("mcq_multi requires answerKey.correctChoiceIds.");
  }
  if (q.type === "dnd_match") {
    const prompts = (q as any).payload?.prompts;
    const answers = (q as any).payload?.answers;
    const mapping = (q as any).answerKey?.mapping;
    if (!Array.isArray(prompts) || prompts.length < 1) errs.push("dnd_match requires payload.prompts.");
    if (!Array.isArray(answers) || answers.length < 1) errs.push("dnd_match requires payload.answers.");
    if (!mapping || typeof mapping !== "object") errs.push("dnd_match requires answerKey.mapping.");
  }
  if (q.type === "dnd_order") {
    const items = (q as any).payload?.items;
    const orderedIds = (q as any).answerKey?.orderedIds;
    if (!Array.isArray(items) || items.length < 2) errs.push("dnd_order requires payload.items (>=2).");
    if (!Array.isArray(orderedIds) || orderedIds.length < 2) errs.push("dnd_order requires answerKey.orderedIds.");
  }
  if (q.type === "hotspot") {
    const regions = (q as any).payload?.regions;
    if (!Array.isArray(regions) || regions.length < 1) errs.push("hotspot requires payload.regions.");
    if (!(q as any).media?.imageUrl) errs.push("hotspot requires media.imageUrl.");
    if (!(q as any).answerKey?.correctRegionId) errs.push("hotspot requires answerKey.correctRegionId.");
  }
  if (q.type === "fill_blank") {
    const blanks = (q as any).payload?.blanks;
    const values = (q as any).answerKey?.values;
    if (!Array.isArray(blanks) || blanks.length < 1) errs.push("fill_blank requires payload.blanks.");
    if (!values || typeof values !== "object") errs.push("fill_blank requires answerKey.values.");
  }
  return errs;
}

function downloadJson(filename: string, obj: any) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type ImportErr = { idx: number; key?: string; errors: string[] };

function asEngineQuestionFromImport(row: any): Question {
  return {
    id: String(row.question_key ?? ""),
    type: row.type,
    domain: row.domain,
    prompt: String(row.prompt ?? ""),
    scenarioId: row.scenario_key ?? undefined,
    difficulty: row.difficulty ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    accessTier: row.access_tier ?? "free",
    setId: row.set_id ?? "free",
    version: row.version ?? 1,
    media: row.media ?? undefined,
    payload: row.payload ?? {},
    answerKey: row.answer_key ?? {},
    explanation: row.explanation ?? undefined,
  } as any;
}

function getMsgType(msg: string): "ok" | "error" | "info" {
  if (msg.includes("✅") || msg.toLowerCase().includes("saved") || msg.toLowerCase().includes("imported") || msg.toLowerCase().includes("deleted")) return "ok";
  if (msg.toLowerCase().includes("failed") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("fix")) return "error";
  return "info";
}

/* ─── component ──────────────────────────────────────────────────────────── */

export default function AdminQuestionsClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const saveRef = useRef<() => void>(() => {});

  const [msg, setMsg] = useState<string>("");
  const [ready, setReady] = useState(false);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankSlug, setBankSlug] = useState<string>("pmp");
  const [bankId, setBankId] = useState<string>("");

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [rows, setRows] = useState<DbRow[]>([]);
  const [activeKey, setActiveKey] = useState<string>("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");

  const [page, setPage] = useState(0);
  const pageSize = 25;

  const [questionKey, setQuestionKey] = useState("");
  const [type, setType] = useState<Question["type"]>("mcq_single");
  const [domain, setDomain] = useState<Question["domain"]>("process");
  const [prompt, setPrompt] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [difficulty, setDifficulty] = useState<number>(2);
  const [tags, setTags] = useState<string>("");
  const [accessTier, setAccessTier] = useState<"free" | "premium">("free");
  const [setId, setSetId] = useState<"free" | "set_a" | "set_b" | "set_c">("free");
  const [isPublished, setIsPublished] = useState(true);
  const [explanation, setExplanation] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageAlt, setImageAlt] = useState<string>("");
  const [payloadJson, setPayloadJson] = useState<string>("{}");
  const [answerKeyJson, setAnswerKeyJson] = useState<string>("{}");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [advancedJsonMode, setAdvancedJsonMode] = useState(false);

  const [importFileName, setImportFileName] = useState<string>("");
  const [importRaw, setImportRaw] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<ImportErr[]>([]);
  const [importReadyCount, setImportReadyCount] = useState(0);

  /* ── Ctrl/Cmd + S → save ─────────────────────────────────────────────── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ── init ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      setMsg("Checking admin access…");
      const gate = await requireAdminClient();
      if (!gate.ok) {
        setReady(false);
        setMsg(
          gate.reason === "not_signed_in"
            ? "Not signed in. Go to /login."
            : gate.reason === "not_admin"
            ? "Access denied. You are not an admin."
            : "Admin check failed."
        );
        return;
      }

      const { data: bankRows, error: bankErr } = await sb
        .from("question_banks")
        .select("id,slug,name")
        .order("name", { ascending: true });

      if (bankErr) { setMsg(`Failed to load banks: ${bankErr.message}`); return; }

      const list = (bankRows ?? []) as Bank[];
      setBanks(list);

      const stored = typeof window !== "undefined" ? localStorage.getItem(LS_BANK_KEY) : null;
      const initialSlug = stored && list.some((b) => b.slug === stored) ? stored : (list[0]?.slug ?? "pmp");
      setBankSlug(initialSlug);

      const bank = await loadBankBySlug(initialSlug);
      setBankId(bank.id);

      const [, scns] = await Promise.all([loadQuestions(bank.id), loadScenarios(bank.id)]);
      setScenarios(scns);
      await reloadList(bank.id);

      setReady(true);
      setMsg(`Ready — bank: ${initialSlug}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchBank(nextSlug: string) {
    setMsg("Switching bank…");
    setActiveKey("");
    setRows([]);
    setValidationErrors([]);
    clearImportBuffer();
    setBankSlug(nextSlug);
    if (typeof window !== "undefined") localStorage.setItem(LS_BANK_KEY, nextSlug);

    const bank = await loadBankBySlug(nextSlug);
    setBankId(bank.id);
    const scns = await loadScenarios(bank.id);
    setScenarios(scns);
    await reloadList(bank.id);
    setMsg(`Switched to: ${nextSlug}`);
  }

  async function reloadList(bid?: string) {
    const id = bid ?? bankId;
    if (!id) return;

    const { data, error } = await sb
      .from("questions")
      .select("id,question_key,type,domain,prompt,scenario_key,difficulty,tags,access_tier,set_id,version,is_published,media,payload,answer_key,explanation,created_at")
      .eq("bank_id", id)
      .order("created_at", { ascending: false });

    if (error) { setMsg(`Reload failed: ${error.message}`); return; }

    const nextRows = (data ?? []) as DbRow[];
    setRows(nextRows);
    if (!activeKey && nextRows[0]?.question_key) loadIntoEditor(nextRows[0]);
  }

  function setPayloadAndAnswerKey(nextPayload: string, nextAnswerKey: string) {
    setPayloadJson(nextPayload);
    setAnswerKeyJson(nextAnswerKey);
  }

  function duplicateCurrent() {
    const baseKey = questionKey || "q-duplicate";
    const newKey = `${baseKey}-copy-${Date.now()}`;
    setActiveKey("");
    setQuestionKey(newKey);
    setMsg(`Duplicated → ${newKey}. Edit and Save.`);
  }

  async function togglePublishInline(row: DbRow) {
    if (!bankId) return;
    const next = !row.is_published;
    const { error } = await sb
      .from("questions")
      .update({ is_published: next })
      .eq("bank_id", bankId)
      .eq("question_key", row.question_key);

    if (error) { setMsg(`Toggle failed: ${error.message}`); return; }
    setRows((prev) => prev.map((r) => r.question_key === row.question_key ? { ...r, is_published: next } : r));
    if (activeKey === row.question_key) setIsPublished(next);
    setMsg(`${row.question_key} → ${next ? "Published ✅" : "Draft"}`);
  }

  function openHotspotImage() {
    if (!imageUrl) return;
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  }

  function loadIntoEditor(row: DbRow) {
    setActiveKey(row.question_key);
    setQuestionKey(row.question_key);
    setType(row.type);
    setDomain(row.domain);
    setPrompt(row.prompt);
    setScenarioId(row.scenario_key ?? "");
    setDifficulty(row.difficulty ?? 2);
    setTags((row.tags ?? []).join(", "));
    setAccessTier(row.access_tier);
    setSetId(row.set_id);
    setIsPublished(!!row.is_published);
    setExplanation(row.explanation ?? "");
    setImageUrl(row.media?.imageUrl ?? "");
    setImageAlt(row.media?.alt ?? "");
    setPayloadJson(JSON.stringify(row.payload ?? {}, null, 2));
    setAnswerKeyJson(JSON.stringify(row.answer_key ?? {}, null, 2));
    setValidationErrors([]);
  }

  function newQuestionTemplate(t: Question["type"]) {
    if (t === "mcq_single") {
      setPayloadJson(JSON.stringify({ choices: [{ id: "a", text: "Option A" }, { id: "b", text: "Option B" }] }, null, 2));
      setAnswerKeyJson(JSON.stringify({ correctChoiceId: "a" }, null, 2));
      return;
    }
    if (t === "mcq_multi") {
      setPayloadJson(JSON.stringify({ minSelections: 2, maxSelections: 2, choices: [{ id: "a", text: "Option A" }, { id: "b", text: "Option B" }, { id: "c", text: "Option C" }] }, null, 2));
      setAnswerKeyJson(JSON.stringify({ correctChoiceIds: ["a", "b"], scoring: "strict" }, null, 2));
      return;
    }
    if (t === "dnd_match") {
      setPayloadJson(JSON.stringify({ prompts: [{ id: "p1", text: "Prompt 1" }], answers: [{ id: "a1", text: "Answer 1" }] }, null, 2));
      setAnswerKeyJson(JSON.stringify({ mapping: { p1: "a1" } }, null, 2));
      return;
    }
    if (t === "dnd_order") {
      setPayloadJson(JSON.stringify({ items: [{ id: "i1", text: "Step 1" }, { id: "i2", text: "Step 2" }] }, null, 2));
      setAnswerKeyJson(JSON.stringify({ orderedIds: ["i1", "i2"] }, null, 2));
      return;
    }
    if (t === "hotspot") {
      setPayloadJson(JSON.stringify({ coordinateSpace: "percent", regions: [{ id: "r1", shape: "rect", x: 10, y: 10, w: 20, h: 20 }] }, null, 2));
      setAnswerKeyJson(JSON.stringify({ correctRegionId: "r1" }, null, 2));
      return;
    }
    if (t === "fill_blank") {
      setPayloadJson(JSON.stringify({ inputMode: "text", blanks: [{ id: "b1", placeholder: "Answer" }] }, null, 2));
      setAnswerKeyJson(JSON.stringify({ values: { b1: ["example"] }, caseInsensitive: true }, null, 2));
      return;
    }
  }

  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (domainFilter !== "all" && r.domain !== domainFilter) return false;
      if (publishedFilter === "published" && !r.is_published) return false;
      if (publishedFilter === "draft" && r.is_published) return false;
      if (!s) return true;
      return (
        r.question_key.toLowerCase().includes(s) ||
        r.prompt.toLowerCase().includes(s) ||
        (r.tags ?? []).join(",").toLowerCase().includes(s)
      );
    });
  }, [rows, search, typeFilter, domainFilter, publishedFilter]);

  const pagedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  // Bank-wide stats
  const publishedCount = useMemo(() => rows.filter((r) => r.is_published).length, [rows]);
  const draftCount = useMemo(() => rows.filter((r) => !r.is_published).length, [rows]);

  const preview: Question | null = useMemo(() => {
    const payload = safeParseJson(payloadJson);
    const answerKey = safeParseJson(answerKeyJson);
    if (!payload.ok || !answerKey.ok) return null;

    const q: Question = {
      id: questionKey,
      type,
      domain,
      prompt,
      scenarioId: scenarioId || undefined,
      difficulty: (difficulty as any) ?? undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      accessTier,
      setId,
      version: 1,
      media: imageUrl ? { imageUrl, alt: imageAlt || undefined } : undefined,
      payload: payload.value,
      answerKey: answerKey.value,
      explanation: explanation || undefined,
    } as any;

    const errs = validateQuestion(q);
    setValidationErrors(errs);
    if (errs.length) return null;
    return q;
  }, [questionKey, type, domain, prompt, scenarioId, difficulty, tags, accessTier, setId, imageUrl, imageAlt, payloadJson, answerKeyJson, explanation]);

  async function createNew() {
    setActiveKey("");
    setQuestionKey(`q-${type}-${Date.now()}`);
    setPrompt("");
    setScenarioId("");
    setTags("");
    setExplanation("");
    setImageUrl("");
    setImageAlt("");
    setIsPublished(true);
    newQuestionTemplate(type);
    setMsg("New question template ready. Edit and save.");
  }

  const save = useCallback(async () => {
    setMsg("");
    if (!ready) return;
    if (!bankId) return setMsg("Bank not loaded.");

    const payload = safeParseJson(payloadJson);
    const answerKey = safeParseJson(answerKeyJson);
    if (!payload.ok) return setMsg(`Payload JSON error: ${payload.error}`);
    if (!answerKey.ok) return setMsg(`AnswerKey JSON error: ${answerKey.error}`);

    const q: Question = {
      id: questionKey,
      type,
      domain,
      prompt,
      scenarioId: scenarioId || undefined,
      difficulty: (difficulty as any) ?? undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      accessTier,
      setId,
      version: 1,
      media: imageUrl ? { imageUrl, alt: imageAlt || undefined } : undefined,
      payload: payload.value,
      answerKey: answerKey.value,
      explanation: explanation || undefined,
    } as any;

    const errs = validateQuestion(q);
    if (errs.length) {
      setValidationErrors(errs);
      setMsg("Fix validation errors before saving.");
      return;
    }

    const base = {
      bank_id: bankId,
      question_key: questionKey,
      type,
      domain,
      prompt,
      scenario_key: scenarioId || null,
      difficulty: difficulty || null,
      tags: q.tags ?? [],
      access_tier: accessTier,
      set_id: setId,
      version: 1,
      is_published: isPublished,
      media: q.media ?? {},
      payload: q.payload,
      answer_key: q.answerKey,
      explanation: q.explanation ?? null,
    };

    const { error } = await sb.from("questions").upsert(base, { onConflict: "bank_id,question_key" });
    if (error) return setMsg(`Save failed: ${error.message}`);

    setMsg("Saved ✅");
    await reloadList();
    setActiveKey(questionKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, bankId, payloadJson, answerKeyJson, questionKey, type, domain, prompt, scenarioId, difficulty, tags, accessTier, setId, isPublished, imageUrl, imageAlt, explanation]);

  // Keep the ref in sync so Ctrl+S always calls the latest version
  useEffect(() => { saveRef.current = save; }, [save]);

  async function remove() {
    if (!bankId || !activeKey) return;
    const ok = window.confirm(`Delete "${activeKey}"?`);
    if (!ok) return;

    const { error } = await sb.from("questions").delete().eq("bank_id", bankId).eq("question_key", activeKey);
    if (error) return setMsg(`Delete failed: ${error.message}`);

    setMsg("Deleted.");
    setActiveKey("");
    await reloadList();
  }

  /* ── bulk import / export ─────────────────────────────────────────────── */

  function validateImportRows(rowsToCheck: any[]) {
    const errs: ImportErr[] = [];
    let okCount = 0;
    rowsToCheck.forEach((r, idx) => {
      const e: string[] = [];
      if (!r.question_key || typeof r.question_key !== "string") e.push("question_key required.");
      e.push(...validateQuestion(asEngineQuestionFromImport(r)));
      if (e.length) errs.push({ idx, key: r.question_key, errors: e });
      else okCount++;
    });
    setImportErrors(errs);
    setImportReadyCount(okCount);
  }

  async function handleImportFile(file: File) {
    setMsg("");
    setImportFileName(file.name);
    const text = await file.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch (e: any) {
      setMsg(`Import parse error: ${e?.message ?? "Invalid JSON"}`);
      setImportRaw([]); setImportErrors([]); setImportReadyCount(0);
      return;
    }
    if (!Array.isArray(parsed)) {
      setMsg("Import file must be a JSON array.");
      setImportRaw([]); setImportErrors([]); setImportReadyCount(0);
      return;
    }
    setImportRaw(parsed);
    validateImportRows(parsed);
    setMsg(`Loaded ${parsed.length} row(s) from ${file.name}.`);
  }

  async function runBulkImport() {
    setMsg("");
    if (!bankId) return setMsg("Bank not loaded.");
    if (!importRaw.length) return setMsg("No rows loaded.");
    if (importErrors.length) return setMsg("Fix import errors before importing.");

    const payload = importRaw.map((r) => ({
      bank_id: bankId,
      question_key: r.question_key,
      type: r.type,
      domain: r.domain,
      prompt: r.prompt,
      scenario_key: r.scenario_key ?? null,
      difficulty: r.difficulty ?? null,
      tags: Array.isArray(r.tags) ? r.tags : [],
      access_tier: r.access_tier ?? "free",
      set_id: r.set_id ?? "free",
      version: r.version ?? 1,
      is_published: r.is_published ?? true,
      media: r.media ?? {},
      payload: r.payload ?? {},
      answer_key: r.answer_key ?? {},
      explanation: r.explanation ?? null,
    }));

    setMsg(`Importing ${payload.length} question(s)…`);
    const chunkSize = 100;
    for (let i = 0; i < payload.length; i += chunkSize) {
      const { error } = await sb.from("questions").upsert(payload.slice(i, i + chunkSize), { onConflict: "bank_id,question_key" });
      if (error) { setMsg(`Import failed (chunk ${Math.floor(i / chunkSize) + 1}): ${error.message}`); return; }
    }

    setMsg(`Imported ✅ ${payload.length} question(s).`);
    await reloadList();
  }

  function clearImportBuffer() {
    setImportFileName(""); setImportRaw([]); setImportErrors([]); setImportReadyCount(0);
  }

  function bulkExportCurrentList() {
    const filename = `export-${bankSlug}-${new Date().toISOString().slice(0, 10)}.json`;
    downloadJson(filename, rows.map((r) => ({
      question_key: r.question_key, type: r.type, domain: r.domain, prompt: r.prompt,
      scenario_key: r.scenario_key, difficulty: r.difficulty, tags: r.tags ?? [],
      access_tier: r.access_tier, set_id: r.set_id, version: r.version ?? 1,
      is_published: r.is_published ?? true, media: r.media ?? {},
      payload: r.payload ?? {}, answer_key: r.answer_key ?? {},
      explanation: r.explanation ?? null,
    })));
  }

  function downloadImportTemplate() {
    downloadJson(`import-template-${bankSlug}.json`, [{
      question_key: `q-template-${bankSlug}-mcqs-001`,
      type: "mcq_single", domain: "process",
      prompt: "Template: Edit this prompt for your exam bank.",
      scenario_key: null, difficulty: 2, tags: ["template"],
      access_tier: "free", set_id: "free", is_published: true, media: {},
      payload: { choices: [{ id: "a", text: "Option A" }, { id: "b", text: "Option B" }] },
      answer_key: { correctChoiceId: "a" },
      explanation: "Template explanation.",
    }]);
  }

  /* ─── render ─────────────────────────────────────────────────────────── */

  return (
    <PageWrap>
      {/* ── Admin header bar ──────────────────────────────────────────── */}
      <AdminHeader>
        <AdminHeaderLeft>
          <AdminIconBox>🛠️</AdminIconBox>
          <div>
            <AdminTitle>Question Bank Admin</AdminTitle>
            <AdminSubtitle>Manage, create, and preview exam questions</AdminSubtitle>
          </div>
        </AdminHeaderLeft>
        <StatChips>
          <StatChip $tone="neutral">{rows.length} total</StatChip>
          <StatChip $tone="ok">{publishedCount} published</StatChip>
          {draftCount > 0 && <StatChip $tone="warn">{draftCount} draft</StatChip>}
        </StatChips>
      </AdminHeader>

      {/* ── Three-column grid ─────────────────────────────────────────── */}
      <Layout>

        {/* ── COLUMN 1: Question list ──────────────────────────────────── */}
        <Card>
          <SectionHeader>
            <SectionLabel>Bank</SectionLabel>
            <SectionLine />
          </SectionHeader>

          <Select
            value={bankSlug}
            onChange={(e) => { setPage(0); switchBank(e.target.value); }}
            disabled={!banks.length}
          >
            {banks.map((b) => (
              <option key={b.id} value={b.slug}>{b.name} ({b.slug})</option>
            ))}
          </Select>

          {msg ? <StatusBar $type={getMsgType(msg)} style={{ marginTop: 8 }}>{msg}</StatusBar> : null}

          <SectionHeader>
            <SectionLabel>Filters</SectionLabel>
            <SectionLine />
          </SectionHeader>

          <FormGrid>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="🔍  Search key, prompt, tags…"
            />
            <FilterGrid>
              <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
                <option value="all">All types</option>
                <option value="mcq_single">mcq_single</option>
                <option value="mcq_multi">mcq_multi</option>
                <option value="dnd_match">dnd_match</option>
                <option value="dnd_order">dnd_order</option>
                <option value="hotspot">hotspot</option>
                <option value="fill_blank">fill_blank</option>
              </Select>
              <Select value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setPage(0); }}>
                <option value="all">All domains</option>
                <option value="people">People</option>
                <option value="process">Process</option>
                <option value="business_environment">Business Env.</option>
              </Select>
              <Select value={publishedFilter} onChange={(e) => { setPublishedFilter(e.target.value as any); setPage(0); }}>
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </Select>
            </FilterGrid>
          </FormGrid>

          <SectionHeader style={{ marginTop: 14 }}>
            <SectionLabel>Questions</SectionLabel>
            <SectionLine />
            <ListCount>{filteredRows.length} results</ListCount>
          </SectionHeader>

          <BtnRow style={{ marginBottom: 8 }}>
            <Button $variant="primary" onClick={createNew}>＋ New</Button>
            <Button onClick={() => reloadList()}>↺ Reload</Button>
            <Button onClick={bulkExportCurrentList} disabled={!rows.length}>⬇ Export</Button>
            <Button onClick={downloadImportTemplate}>📋 Template</Button>
          </BtnRow>

          <List>
            {pagedRows.map((r) => (
              <Item key={r.question_key} $active={r.question_key === activeKey} onClick={() => loadIntoEditor(r)}>
                <ItemKey>{r.question_key}</ItemKey>
                <ItemPromptPreview>{r.prompt}</ItemPromptPreview>
                <ItemFooter>
                  <ItemBadges>
                    <TypeBadge $type={r.type}>{r.type}</TypeBadge>
                    <StatusBadge $ok={r.is_published}>{r.is_published ? "Published" : "Draft"}</StatusBadge>
                  </ItemBadges>
                  <MiniBtn
                    $active={r.is_published}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePublishInline(r); }}
                  >
                    {r.is_published ? "Unpublish" : "Publish"}
                  </MiniBtn>
                </ItemFooter>
              </Item>
            ))}
          </List>

          <PagRow>
            <BtnRow>
              <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>← Prev</Button>
              <Button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * pageSize >= filteredRows.length}>Next →</Button>
            </BtnRow>
            <PagInfo>
              Page {page + 1} / {Math.max(1, Math.ceil(filteredRows.length / pageSize))}
            </PagInfo>
          </PagRow>
        </Card>

        {/* ── COLUMN 2: Editor ──────────────────────────────────────────── */}
        <Card>
          <BtnRow style={{ justifyContent: "space-between", marginBottom: 2 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: "inherit" }}>
              {activeKey ? `Editing: ${activeKey}` : "New Question"}
            </div>
            <KbdHint>Save: <Kbd>Ctrl</Kbd>+<Kbd>S</Kbd></KbdHint>
          </BtnRow>

          <SectionHeader>
            <SectionLabel>Identity</SectionLabel>
            <SectionLine />
          </SectionHeader>

          <FormGrid>
            <Label>
              Question key (unique)
              <Input value={questionKey} onChange={(e) => setQuestionKey(e.target.value)} placeholder="e.g. q-pmp-mcqs-001" />
            </Label>

            <FieldRow>
              <Label>
                Type
                <Select value={type} onChange={(e) => { const t = e.target.value as any; setType(t); newQuestionTemplate(t); }}>
                  <option value="mcq_single">mcq_single</option>
                  <option value="mcq_multi">mcq_multi</option>
                  <option value="dnd_match">dnd_match</option>
                  <option value="dnd_order">dnd_order</option>
                  <option value="hotspot">hotspot</option>
                  <option value="fill_blank">fill_blank</option>
                </Select>
              </Label>
              <Label>
                Domain
                <Select value={domain} onChange={(e) => setDomain(e.target.value as any)}>
                  <option value="people">People</option>
                  <option value="process">Process</option>
                  <option value="business_environment">Business Env.</option>
                </Select>
              </Label>
            </FieldRow>

            <FieldRow>
              <Label>
                Access tier
                <Select value={accessTier} onChange={(e) => setAccessTier(e.target.value as any)}>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </Select>
              </Label>
              <Label>
                Publish status
                <Select value={isPublished ? "published" : "draft"} onChange={(e) => setIsPublished(e.target.value === "published")}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </Select>
              </Label>
            </FieldRow>
          </FormGrid>

          <SectionHeader>
            <SectionLabel>Content</SectionLabel>
            <SectionLine />
          </SectionHeader>

          <FormGrid>
            <Label>
              <span style={{ display: "flex", justifyContent: "space-between" }}>
                Prompt
                <CharCount>{prompt.length} chars</CharCount>
              </span>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Write the question text here…" style={{ minHeight: 90 }} />
            </Label>

            <Label>
              Scenario (optional)
              <Select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
                <option value="">(none)</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>{s.title ?? s.id}</option>
                ))}
              </Select>
            </Label>
          </FormGrid>

          <SectionHeader>
            <SectionLabel>Metadata</SectionLabel>
            <SectionLine />
          </SectionHeader>

          <FieldRow>
            <Label>
              Difficulty (1–5)
              <Input type="number" min={1} max={5} value={String(difficulty)} onChange={(e) => setDifficulty(Number(e.target.value || "2"))} />
            </Label>
            <Label>
              Set
              <Select value={setId} onChange={(e) => setSetId(e.target.value as any)}>
                <option value="free">free</option>
                <option value="set_a">set_a</option>
                <option value="set_b">set_b</option>
                <option value="set_c">set_c</option>
              </Select>
            </Label>
          </FieldRow>
          <Label style={{ marginTop: 8 }}>
            Tags (comma-separated)
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. agile, risk, scope" />
          </Label>

          {type === "hotspot" && (
            <>
              <SectionHeader>
                <SectionLabel>Hotspot Image</SectionLabel>
                <SectionLine />
              </SectionHeader>
              <FormGrid>
                <Label>
                  Image URL
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/images/diagram.png" />
                </Label>
                <FieldRow>
                  <Label>
                    Alt text
                    <Input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Describe the image…" />
                  </Label>
                  <Label style={{ justifyContent: "end" }}>
                    &nbsp;
                    <Button onClick={openHotspotImage} disabled={!imageUrl}>Open image ↗</Button>
                  </Label>
                </FieldRow>
                {!imageUrl && <Pill $tone="warn">⚠ Hotspot needs an imageUrl</Pill>}
              </FormGrid>
            </>
          )}

          <SectionHeader>
            <SectionLabel>Answer Builder</SectionLabel>
            <SectionLine />
            <Button onClick={() => setAdvancedJsonMode((v) => !v)} style={{ padding: "3px 9px", fontSize: 11 }}>
              {advancedJsonMode ? "← Use forms" : "JSON mode"}
            </Button>
          </SectionHeader>

          {!advancedJsonMode ? (
            <>
              {type === "mcq_single" && <McqSingleForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} />}
              {type === "mcq_multi" && <McqMultiForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} />}
              {type === "dnd_match" && <DndMatchForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} />}
              {type === "dnd_order" && <DndOrderForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} />}
              {type === "fill_blank" && <FillBlankForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} />}
              {type === "hotspot" && <HotspotForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} imageUrl={imageUrl} />}
            </>
          ) : (
            <FormGrid>
              <Label>
                Payload (JSON)
                <JsonArea value={payloadJson} onChange={(e) => setPayloadJson(e.target.value)} />
              </Label>
              <Label>
                Answer key (JSON)
                <JsonArea value={answerKeyJson} onChange={(e) => setAnswerKeyJson(e.target.value)} />
              </Label>
            </FormGrid>
          )}

          <SectionHeader>
            <SectionLabel>Explanation</SectionLabel>
            <SectionLine />
          </SectionHeader>

          <Label>
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              Explanation text (optional)
              <CharCount>{explanation.length} chars</CharCount>
            </span>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why the correct answer is correct…"
              style={{ minHeight: 80 }}
            />
          </Label>

          <Divider />

          {validationErrors.length ? (
            <ErrorBox>
              <strong>Fix before saving:</strong>
              <ul>
                {validationErrors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </ErrorBox>
          ) : (
            <Pill $tone="ok">✓ Valid — ready to save</Pill>
          )}

          <BtnRow style={{ marginTop: 10 }}>
            <SaveBtn $variant="primary" onClick={save} disabled={!preview}>
              💾 Save / Update
            </SaveBtn>
            <Button $variant="danger" onClick={remove} disabled={!activeKey}>Delete</Button>
            <Button onClick={duplicateCurrent} disabled={!questionKey}>Duplicate</Button>
          </BtnRow>

          <Divider />

          {/* Bulk Import */}
          <ImportBox>
            <div style={{ fontWeight: 800, fontSize: 13, color: "inherit" }}>📥 Bulk Import</div>

            <FileInput
              type="file"
              accept=".json,application/json"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
            />

            {importFileName ? (
              <Msg>
                <strong>{importFileName}</strong> — {importRaw.length} rows loaded, {importReadyCount} ready, {importErrors.length} errors
              </Msg>
            ) : (
              <Msg>Select a JSON array file of questions to bulk-import.</Msg>
            )}

            {importErrors.length > 0 && (
              <ErrorBox>
                <strong>Import errors (first 10):</strong>
                <SmallList>
                  {importErrors.slice(0, 10).map((e) => (
                    <li key={`${e.idx}-${e.key ?? "no-key"}`}>
                      Row {e.idx + 1} ({e.key ?? "no key"}): {e.errors[0]}
                    </li>
                  ))}
                </SmallList>
              </ErrorBox>
            )}

            <BtnRow>
              <Button $variant="primary" onClick={runBulkImport} disabled={!importRaw.length || importErrors.length > 0}>
                Import Now
              </Button>
              <Button $variant="danger" onClick={clearImportBuffer} disabled={!importRaw.length}>Clear</Button>
            </BtnRow>
          </ImportBox>
        </Card>

        {/* ── COLUMN 3: Live Preview ─────────────────────────────────────── */}
        <Card>
          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 12 }}>👁 Live Preview</div>
          {preview ? (
            <QuestionRenderer
              question={preview}
              scenario={preview.scenarioId ? scenarios.find((s) => s.id === preview.scenarioId) : undefined}
              response={
                preview.type === "mcq_single"
                  ? { type: "mcq_single", choiceId: null }
                  : preview.type === "mcq_multi"
                  ? { type: "mcq_multi", choiceIds: [] }
                  : preview.type === "dnd_match"
                  ? { type: "dnd_match", mapping: Object.fromEntries(((preview.payload as any).prompts ?? []).map((p: any) => [p.id, null])) }
                  : preview.type === "dnd_order"
                  ? { type: "dnd_order", orderedIds: ((preview.payload as any).items ?? []).map((i: any) => i.id) }
                  : preview.type === "hotspot"
                  ? { type: "hotspot", selectedRegionId: null }
                  : { type: "fill_blank", values: Object.fromEntries(((preview.payload as any).blanks ?? []).map((b: any) => [b.id, ""])) }
              }
              optionOrder={[]}
              onChange={() => {}}
              showCorrect={false}
            />
          ) : (
            <Msg>Fix JSON / required fields to see live preview.</Msg>
          )}
        </Card>
      </Layout>
    </PageWrap>
  );
}
