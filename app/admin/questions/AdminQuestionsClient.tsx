"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
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

const Layout = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
  @media (min-width: 1100px) {
    grid-template-columns: 360px 1fr 1fr;
    align-items: start;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 14px;
`;

const Title = styled.h1`
  margin: 0 0 10px 0;
  font-size: 18px;
`;

const SmallTitle = styled.div`
  font-weight: 900;
  font-size: 16px;
  margin: 0;
`;

const Row = styled.div`
  display: grid;
  gap: 10px;
`;

const Label = styled.label`
  display: grid;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
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

const Textarea = styled.textarea`
  min-height: 110px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
  line-height: 1.4;
`;

const JsonArea = styled(Textarea)`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  min-height: 160px;
`;

const BtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Button = styled.button<{ $danger?: boolean }>`
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: ${(p) => (p.$danger ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.08)")};
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 900;

  &:hover {
    background: ${(p) => (p.$danger ? "rgba(239,68,68,0.24)" : "rgba(255,255,255,0.10)")};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Msg = styled.div`
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.4;
`;

const List = styled.div`
  display: grid;
  gap: 10px;
`;

const Item = styled.button<{ $active?: boolean }>`
  width: 100%;
  text-align: left;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: ${(p) => (p.$active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)")};
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 10px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

/** UI bits (polish pack) */
const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 10px 0;
`;

const Pill = styled.span<{ $tone?: "ok" | "warn" | "bad" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);

  background: ${(p) =>
    p.$tone === "ok"
      ? "rgba(34,197,94,0.16)"
      : p.$tone === "warn"
      ? "rgba(245,158,11,0.16)"
      : p.$tone === "bad"
      ? "rgba(239,68,68,0.16)"
      : "rgba(255,255,255,0.04)"};
`;

const MiniBtn = styled.button<{ $danger?: boolean }>`
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: ${(p) => (p.$danger ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.06)")};
  color: rgba(255, 255, 255, 0.92);
  padding: 6px 10px;
  cursor: pointer;
  font-weight: 800;
  font-size: 12px;

  &:hover {
    background: ${(p) => (p.$danger ? "rgba(239,68,68,0.24)" : "rgba(255,255,255,0.10)")};
  }
`;

const ItemTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ErrorBox = styled.div`
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.12);
  border-radius: 16px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.4;

  ul {
    margin: 6px 0 0;
    padding-left: 18px;
  }
`;

const ItemMeta = styled.div`
  font-size: 12px;
  opacity: 0.78;
  margin-top: 4px;
`;

/** Bulk import/export UI */
const ImportBox = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 10px;
`;

const FileInput = styled.input`
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
`;

const SmallList = styled.ul`
  margin: 6px 0 0;
  padding-left: 18px;
  font-size: 13px;
  opacity: 0.9;
`;

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

export default function AdminQuestionsClient() {
  const sb = useMemo(() => supabaseBrowser(), []);

  const [msg, setMsg] = useState<string>("");
  const [ready, setReady] = useState(false);

  // ✅ Bank selector state
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
  const pageSize = 20;

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

  /** Bulk import state */
  const [importFileName, setImportFileName] = useState<string>("");
  const [importRaw, setImportRaw] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<ImportErr[]>([]);
  const [importReadyCount, setImportReadyCount] = useState(0);

  useEffect(() => {
    (async () => {
      setMsg("Checking admin…");
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

      // Load banks
      const { data: bankRows, error: bankErr } = await sb
        .from("question_banks")
        .select("id,slug,name")
        .order("name", { ascending: true });

      if (bankErr) {
        setMsg(`Failed to load banks: ${bankErr.message}`);
        return;
      }

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
      setMsg(`Admin ready. Bank: ${initialSlug}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchBank(nextSlug: string) {
    setMsg("");
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

    setMsg(`Switched to bank: ${nextSlug}`);
  }

  async function reloadList(bid?: string) {
    const id = bid ?? bankId;
    if (!id) return;

    const { data, error } = await sb
      .from("questions")
      .select(
        "id,question_key,type,domain,prompt,scenario_key,difficulty,tags,access_tier,set_id,version,is_published,media,payload,answer_key,explanation,created_at"
      )
      .eq("bank_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(`Reload failed: ${error.message}`);
      return;
    }

    const nextRows = (data ?? []) as DbRow[];
    setRows(nextRows);

    if (!activeKey) {
      const first = nextRows[0];
      if (first?.question_key) loadIntoEditor(first);
    }
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
    setMsg(`Duplicated into new key: ${newKey}. Edit and Save.`);
  }

  async function togglePublishInline(row: DbRow) {
    if (!bankId) return;

    const next = !row.is_published;
    const { error } = await sb
      .from("questions")
      .update({ is_published: next })
      .eq("bank_id", bankId)
      .eq("question_key", row.question_key);

    if (error) {
      setMsg(`Publish toggle failed: ${error.message}`);
      return;
    }

    setRows((prev) => prev.map((r) => (r.question_key === row.question_key ? { ...r, is_published: next } : r)));
    if (activeKey === row.question_key) setIsPublished(next);
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
      setPayloadJson(
        JSON.stringify(
          {
            minSelections: 2,
            maxSelections: 2,
            choices: [
              { id: "a", text: "Option A" },
              { id: "b", text: "Option B" },
              { id: "c", text: "Option C" },
            ],
          },
          null,
          2
        )
      );
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
    setMsg("New question template loaded. Edit then click Save.");
  }

  async function save() {
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
  }

  async function remove() {
    if (!bankId || !activeKey) return;
    const ok = window.confirm(`Delete ${activeKey}?`);
    if (!ok) return;

    const { error } = await sb.from("questions").delete().eq("bank_id", bankId).eq("question_key", activeKey);
    if (error) return setMsg(`Delete failed: ${error.message}`);

    setMsg("Deleted.");
    setActiveKey("");
    await reloadList();
  }

  /** -------- Bulk import / export / templates -------- */

  function validateImportRows(rowsToCheck: any[]) {
    const errs: ImportErr[] = [];
    let okCount = 0;

    rowsToCheck.forEach((r, idx) => {
      const e: string[] = [];
      if (!r.question_key || typeof r.question_key !== "string") e.push("question_key is required (string).");

      const q = asEngineQuestionFromImport(r);
      e.push(...validateQuestion(q));

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

    try {
      parsed = JSON.parse(text);
    } catch (e: any) {
      setMsg(`Import JSON parse error: ${e?.message ?? "Invalid JSON"}`);
      setImportRaw([]);
      setImportErrors([]);
      setImportReadyCount(0);
      return;
    }

    if (!Array.isArray(parsed)) {
      setMsg("Import file must be a JSON array of question objects.");
      setImportRaw([]);
      setImportErrors([]);
      setImportReadyCount(0);
      return;
    }

    setImportRaw(parsed);
    validateImportRows(parsed);
    setMsg(`Loaded ${parsed.length} row(s) from ${file.name}.`);
  }

  async function runBulkImport() {
    setMsg("");
    if (!bankId) return setMsg("Bank not loaded.");
    if (!importRaw.length) return setMsg("No import rows loaded.");
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
      const chunk = payload.slice(i, i + chunkSize);
      const { error } = await sb.from("questions").upsert(chunk, { onConflict: "bank_id,question_key" });
      if (error) {
        setMsg(`Import failed (chunk ${Math.floor(i / chunkSize) + 1}): ${error.message}`);
        return;
      }
    }

    setMsg(`Imported ✅ ${payload.length} question(s).`);
    await reloadList();
  }

  function clearImportBuffer() {
    setImportFileName("");
    setImportRaw([]);
    setImportErrors([]);
    setImportReadyCount(0);
  }

  function bulkExportCurrentList() {
    const filename = `export-${bankSlug}-${new Date().toISOString().slice(0, 10)}.json`;
    const data = rows.map((r) => ({
      question_key: r.question_key,
      type: r.type,
      domain: r.domain,
      prompt: r.prompt,
      scenario_key: r.scenario_key,
      difficulty: r.difficulty,
      tags: r.tags ?? [],
      access_tier: r.access_tier,
      set_id: r.set_id,
      version: r.version ?? 1,
      is_published: r.is_published ?? true,
      media: r.media ?? {},
      payload: r.payload ?? {},
      answer_key: r.answer_key ?? {},
      explanation: r.explanation ?? null,
    }));
    downloadJson(filename, data);
  }

  function downloadImportTemplate() {
    const template = [
      {
        question_key: `q-template-${bankSlug}-mcqs-001`,
        type: "mcq_single",
        domain: "process",
        prompt: "Template: Edit this prompt for your exam bank.",
        scenario_key: null,
        difficulty: 2,
        tags: ["template"],
        access_tier: "free",
        set_id: "free",
        is_published: true,
        media: {},
        payload: { choices: [{ id: "a", text: "Option A" }, { id: "b", text: "Option B" }] },
        answer_key: { correctChoiceId: "a" },
        explanation: "Template explanation.",
      },
    ];
    downloadJson(`import-template-${bankSlug}.json`, template);
  }

  return (
    <Layout>
      <Card>
        <Title>Questions</Title>
        <Msg>{msg}</Msg>

        <Row>
          {/* ✅ Bank dropdown */}
          <Label>
            Bank
            <Select
              value={bankSlug}
              onChange={(e) => {
                setPage(0);
                switchBank(e.target.value);
              }}
              disabled={!banks.length}
            >
              {banks.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name} ({b.slug})
                </option>
              ))}
            </Select>
          </Label>

          <Label>
            Search
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="key, prompt, tags…" />
          </Label>

          <Label>
            Type filter
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
              <option value="all">All</option>
              <option value="mcq_single">mcq_single</option>
              <option value="mcq_multi">mcq_multi</option>
              <option value="dnd_match">dnd_match</option>
              <option value="dnd_order">dnd_order</option>
              <option value="hotspot">hotspot</option>
              <option value="fill_blank">fill_blank</option>
            </Select>
          </Label>

          <Label>
            Domain filter
            <Select value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setPage(0); }}>
              <option value="all">All</option>
              <option value="people">people</option>
              <option value="process">process</option>
              <option value="business_environment">business_environment</option>
            </Select>
          </Label>

          <Label>
            Published filter
            <Select value={publishedFilter} onChange={(e) => { setPublishedFilter(e.target.value as any); setPage(0); }}>
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </Label>

          <BtnRow>
            <Button onClick={createNew}>New</Button>
            <Button onClick={() => reloadList()}>Reload</Button>
            <Button onClick={bulkExportCurrentList} disabled={!rows.length}>Export JSON</Button>
            <Button onClick={downloadImportTemplate}>Template JSON</Button>
          </BtnRow>

          <List>
            {pagedRows.map((r) => (
              <Item key={r.question_key} $active={r.question_key === activeKey} onClick={() => loadIntoEditor(r)}>
                <ItemTop>
                  <div>
                    <strong>{r.question_key}</strong>{" "}
                    {r.is_published ? <Pill $tone="ok">Published</Pill> : <Pill $tone="warn">Draft</Pill>}
                  </div>

                  <ItemActions>
                    <MiniBtn
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePublishInline(r);
                      }}
                    >
                      {r.is_published ? "Unpublish" : "Publish"}
                    </MiniBtn>
                  </ItemActions>
                </ItemTop>

                <ItemMeta>
                  {r.type} • {r.domain} • {(r.tags ?? []).slice(0, 3).join(", ")}
                </ItemMeta>
              </Item>
            ))}
          </List>

          <BtnRow>
            <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
            <Button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * pageSize >= filteredRows.length}>Next</Button>
          </BtnRow>

          <Msg>
            Page {page + 1} of {Math.max(1, Math.ceil(filteredRows.length / pageSize))} • {filteredRows.length} total
          </Msg>
        </Row>
      </Card>

      <Card>
        <Title>Editor</Title>

        <Row>
          <Label>
            Question key (unique)
            <Input value={questionKey} onChange={(e) => setQuestionKey(e.target.value)} />
          </Label>

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
              <option value="people">people</option>
              <option value="process">process</option>
              <option value="business_environment">business_environment</option>
            </Select>
          </Label>

          <Label>
            Publish status
            <Select value={isPublished ? "published" : "draft"} onChange={(e) => setIsPublished(e.target.value === "published")}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </Label>

          <Label>
            Prompt
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </Label>

          <Label>
            Scenario (optional)
            <Select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              <option value="">(none)</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title ?? s.id}
                </option>
              ))}
            </Select>
          </Label>

          <Label>
            Difficulty (1–5)
            <Input value={String(difficulty)} onChange={(e) => setDifficulty(Number(e.target.value || "2"))} />
          </Label>

          <Label>
            Tags (comma-separated)
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </Label>

          <Label>
            Access tier
            <Select value={accessTier} onChange={(e) => setAccessTier(e.target.value as any)}>
              <option value="free">free</option>
              <option value="premium">premium</option>
            </Select>
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

          <Label>
            Hotspot image URL (only for hotspot)
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/images/..." />
          </Label>

          <Label>
            Image alt text
            <Input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Describe the image…" />
          </Label>

          <Divider />

          <BtnRow>
            <Button onClick={() => setAdvancedJsonMode((v) => !v)}>
              {advancedJsonMode ? "Hide JSON (use forms)" : "Advanced JSON mode"}
            </Button>

            <Button onClick={duplicateCurrent} disabled={!questionKey}>Duplicate</Button>

            {type === "hotspot" ? (
              <>
                <Button onClick={openHotspotImage} disabled={!imageUrl}>Open image</Button>
                {!imageUrl ? <Pill $tone="warn">Hotspot needs imageUrl</Pill> : null}
              </>
            ) : null}
          </BtnRow>

          {!advancedJsonMode ? (
            <>
              {type === "mcq_single" ? <McqSingleForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} /> : null}
              {type === "mcq_multi" ? <McqMultiForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} /> : null}
              {type === "dnd_match" ? <DndMatchForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} /> : null}
              {type === "dnd_order" ? <DndOrderForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} /> : null}
              {type === "fill_blank" ? <FillBlankForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} /> : null}
              {type === "hotspot" ? <HotspotForm payloadJson={payloadJson} answerKeyJson={answerKeyJson} onChange={setPayloadAndAnswerKey} imageUrl={imageUrl} /> : null}
            </>
          ) : (
            <>
              <Label>
                Payload (JSON)
                <JsonArea value={payloadJson} onChange={(e) => setPayloadJson(e.target.value)} />
              </Label>

              <Label>
                Answer key (JSON)
                <JsonArea value={answerKeyJson} onChange={(e) => setAnswerKeyJson(e.target.value)} />
              </Label>
            </>
          )}

          <Label>
            Explanation (optional)
            <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </Label>

          {validationErrors.length ? (
            <ErrorBox>
              <strong>Fix these before saving:</strong>
              <ul>
                {validationErrors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </ErrorBox>
          ) : (
            <Pill $tone="ok">Valid ✓</Pill>
          )}

          <BtnRow>
            <Button onClick={save} disabled={!preview}>Save / Update</Button>
            <Button $danger onClick={remove} disabled={!activeKey}>Delete</Button>
          </BtnRow>

          <Divider />

          <ImportBox>
            <SmallTitle>Bulk Import</SmallTitle>

            <FileInput
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
              }}
            />

            {importFileName ? (
              <Msg>
                File: <strong>{importFileName}</strong> • Loaded: {importRaw.length} • Ready: {importReadyCount} • Errors:{" "}
                {importErrors.length}
              </Msg>
            ) : (
              <Msg>Select a JSON file containing an array of questions.</Msg>
            )}

            {importErrors.length ? (
              <ErrorBox>
                <strong>Import errors (first 10):</strong>
                <SmallList>
                  {importErrors.slice(0, 10).map((e) => (
                    <li key={`${e.idx}-${e.key ?? "no-key"}`}>
                      Row {e.idx + 1} ({e.key ?? "no question_key"}): {e.errors[0]}
                    </li>
                  ))}
                </SmallList>
                <Msg>Fix your JSON and re-upload. Import is blocked until errors are resolved.</Msg>
              </ErrorBox>
            ) : null}

            <BtnRow>
              <Button onClick={runBulkImport} disabled={!importRaw.length || importErrors.length > 0}>Import Now</Button>
              <Button onClick={clearImportBuffer} $danger disabled={!importRaw.length}>Clear Import</Button>
            </BtnRow>
          </ImportBox>
        </Row>
      </Card>

      <Card>
        <Title>Live Preview</Title>
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
          <Msg>Fix JSON / required fields to preview.</Msg>
        )}
      </Card>
    </Layout>
  );
}
