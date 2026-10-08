/**
 * Read-only audit of the live question bank.
 *
 * Usage: node scripts/audit-question-bank.mjs [set_a|set_b|set_c|free]
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Never logs credentials or full question/answer text.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const validSets = new Set(["set_a", "set_b", "set_c", "free"]);
const requestedSet = process.argv[2];
if (requestedSet && !validSets.has(requestedSet)) {
  console.error("Set must be one of: set_a, set_b, set_c, free.");
  process.exit(2);
}

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith("#"))
    .map((line) => {
      const split = line.indexOf("=");
      return [line.slice(0, split), line.slice(split + 1)];
    })
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase URL or service role key in .env.local.");
  process.exit(2);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const allQuestions = [];
for (let from = 0; ; from += 1000) {
  let query = client
    .from("questions")
    .select("question_key,set_id,type,domain,prompt,payload,answer_key,explanation,scenario_key,media,is_published")
    .order("question_key")
    .range(from, from + 999);
  if (requestedSet) query = query.eq("set_id", requestedSet);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  allQuestions.push(...data);
  if (data.length < 1000) break;
}

const issues = [];
function issue(q, code) {
  issues.push({ set: q.set_id, id: q.question_key, published: !!q.is_published, code });
}
function ids(items) {
  return new Set(items.map((item) => item.id));
}

for (const q of allQuestions) {
  const payload = q.payload ?? {};
  const key = q.answer_key ?? {};
  const choices = Array.isArray(payload.choices) ? payload.choices : [];

  if (!q.prompt?.trim()) issue(q, "missing_prompt");
  if (!q.explanation?.trim()) issue(q, "missing_explanation");
  else if (q.explanation.trim().length < 250) issue(q, "short_explanation_review");

  if (q.type === "mcq_single" || q.type === "mcq_multi" || q.type === "pull_down") {
    if (choices.length < 2) issue(q, "missing_choices");
    const choiceIds = ids(choices);
    if (choiceIds.size !== choices.length) issue(q, "duplicate_choice_id");
    const normalized = choices.map((c) => String(c.text ?? "").trim().toLowerCase().replace(/\s+/g, " "));
    if (normalized.some((text) => !text)) issue(q, "empty_choice_text");
    if (new Set(normalized).size !== normalized.length) issue(q, "duplicate_choice_text");
    if ((q.type === "mcq_single" || q.type === "pull_down") && !choiceIds.has(key.correctChoiceId)) issue(q, "invalid_answer_key");
    if (q.type === "mcq_multi") {
      const correct = key.correctChoiceIds;
      if (!Array.isArray(correct) || !correct.length || correct.some((id) => !choiceIds.has(id))) {
        issue(q, "invalid_answer_key");
      }
    }
  } else if (q.type === "dnd_match") {
    const prompts = Array.isArray(payload.prompts) ? payload.prompts : [];
    const answers = Array.isArray(payload.answers) ? payload.answers : [];
    const answerIds = ids(answers);
    if (!prompts.length || !answers.length) issue(q, "missing_matching_items");
    if (prompts.some((p) => !answerIds.has(key.mapping?.[p.id]))) issue(q, "invalid_answer_key");
  } else if (q.type === "dnd_order") {
    const items = Array.isArray(payload.items) ? payload.items : [];
    const ordered = key.orderedIds;
    if (!items.length) issue(q, "missing_ordering_items");
    if (!Array.isArray(ordered) || ordered.length !== items.length || ordered.some((id) => !ids(items).has(id))) {
      issue(q, "invalid_answer_key");
    }
  } else if (q.type === "hotspot") {
    const regions = Array.isArray(payload.regions) ? payload.regions : [];
    if (!q.media?.imageUrl) issue(q, "missing_image");
    if (!regions.length || !ids(regions).has(key.correctRegionId)) issue(q, "invalid_answer_key");
  } else {
    issue(q, "unsupported_type");
  }
}

const bySet = {};
const byType = {};
const byDomain = {};
const byPublished = {};
const byCode = {};
for (const q of allQuestions) {
  bySet[q.set_id] = (bySet[q.set_id] ?? 0) + 1;
  const type = `${q.set_id}:${q.type}`;
  byType[type] = (byType[type] ?? 0) + 1;
  const domain = `${q.set_id}:${q.domain}`;
  byDomain[domain] = (byDomain[domain] ?? 0) + 1;
  const publication = `${q.set_id}:${q.is_published ? "published" : "draft"}`;
  byPublished[publication] = (byPublished[publication] ?? 0) + 1;
}
for (const entry of issues) byCode[entry.code] = (byCode[entry.code] ?? 0) + 1;

const structuralCodes = new Set([
  "missing_prompt", "missing_choices", "duplicate_choice_id", "empty_choice_text",
  "duplicate_choice_text", "invalid_answer_key", "missing_matching_items",
  "missing_ordering_items", "missing_image", "unsupported_type",
]);
const structuralIssues = issues.filter((entry) => structuralCodes.has(entry.code));
const expectedDomains = { people: 59, process: 74, business_environment: 47 };
const releaseGate = Object.fromEntries(
  ["set_a", "set_b", "set_c"].map((setId) => {
    const rows = allQuestions.filter((q) => q.set_id === setId);
    const publishedRows = rows.filter((q) => q.is_published);
    const actualDomains = Object.fromEntries(
      Object.keys(expectedDomains).map((domain) => [domain, publishedRows.filter((q) => q.domain === domain).length])
    );
    return [setId, {
      has180Published: publishedRows.length === 180,
      domainTargetMet: Object.entries(expectedDomains).every(([domain, count]) => actualDomains[domain] === count),
      structuralIssues: structuralIssues.filter((entry) => entry.set === setId && entry.published).length,
      editorialReviewRequired: issues.filter((entry) => entry.set === setId && entry.published && entry.code === "short_explanation_review").length,
      actualDomains,
    }];
  })
);

console.log(JSON.stringify({
  total: allQuestions.length,
  bySet,
  byType,
  byDomain,
  byPublished,
  releaseGate,
  withScenario: allQuestions.filter((q) => q.scenario_key).length,
  withMedia: allQuestions.filter((q) => q.media && Object.keys(q.media).length).length,
  byCode,
  issues,
}, null, 2));
