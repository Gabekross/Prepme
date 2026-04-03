import type { Question, Scenario } from "../core/types";
import { supabaseBrowser } from "@/lib/supabase/browser";

type DbBank = {
  id: string;
  slug: string;
  duration_minutes: number | null;
  pass_threshold_pct: number | null;
};

export type BankConfig = {
  id: string;
  slug: string;
  /** Exam time limit in minutes. Null = untimed. */
  durationMinutes: number | null;
  /** Pass threshold percentage 0-100. Default: 70. */
  passThreshold: number;
};
type DbScenario = { scenario_key: string; title: string | null; text: string };
type DbQuestion = {
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
  media: any;
  payload: any;
  answer_key: any;
  explanation: string | null;
};

export async function loadBankBySlug(slug: string): Promise<BankConfig> {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("question_banks")
    .select("id,slug,duration_minutes,pass_threshold_pct")
    .eq("slug", slug)
    .single<DbBank>();
  if (error) throw error;
  return {
    id: data.id,
    slug: data.slug,
    durationMinutes: data.duration_minutes ?? null,
    passThreshold: data.pass_threshold_pct ?? 70,
  };
}

export async function loadScenarios(bankId: string): Promise<Scenario[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("scenarios").select("scenario_key,title,text").eq("bank_id", bankId);
  if (error) throw error;

  return (data as DbScenario[]).map((s) => ({
    id: s.scenario_key,
    title: s.title ?? undefined,
    text: s.text,
  }));
}

export async function loadQuestions(bankId: string): Promise<Question[]> {
  const sb = supabaseBrowser();

  // RLS already limits anon to free questions
  const { data, error } = await sb
    .from("questions")
    .select(
      "question_key,type,domain,prompt,scenario_key,difficulty,tags,access_tier,set_id,version,media,payload,answer_key,explanation"
    )
    .eq("bank_id", bankId);

  if (error) throw error;

  return (data as DbQuestion[]).map((q) => ({
    id: q.question_key, // engine uses stable id string
    type: q.type,
    domain: q.domain,
    prompt: q.prompt,
    scenarioId: q.scenario_key ?? undefined,
    difficulty: (q.difficulty ?? undefined) as any,
    tags: q.tags ?? [],
    accessTier: q.access_tier,
    setId: q.set_id,
    version: q.version,
    media: q.media ?? undefined,
    payload: q.payload,
    answerKey: q.answer_key,
    explanation: q.explanation ?? undefined,
  })) as Question[];
}
