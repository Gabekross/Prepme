/**
 * Offline structural/editorial gate for the versioned Set A staging file.
 * Usage: node scripts/validate-staged-set-a.mjs [path] [--complete]
 * This does not access or change the live question bank.
 */
import { readFileSync } from "node:fs";

const path = process.argv.find((arg, index) => index > 1 && !arg.startsWith("--")) ?? "staging/set-a-replacements.json";
const complete = process.argv.includes("--complete");
const questions = JSON.parse(readFileSync(path, "utf8"));
if (!Array.isArray(questions)) throw new Error("Staging file must contain a JSON array.");

const allowedTypes = new Set(["mcq_single", "mcq_multi", "pull_down", "dnd_match", "dnd_order", "hotspot"]);
const taskLimits = { people: 8, process: 10, business_environment: 8 };
const targetDomains = { people: 59, process: 74, business_environment: 47 };
const domainNames = { people: "people", process: "process", "business environment": "business_environment" };
const issues = [];
const warnings = [];
const seen = new Set();
const counts = { people: 0, process: 0, business_environment: 0 };
const typeCounts = {};
const approachCounts = { predictive: 0, adaptive: 0, hybrid: 0, unclassified: 0 };
const tasks = new Set();

function problem(id, message) { issues.push({ id, message }); }
function warn(id, message) { warnings.push({ id, message }); }
function uniqueItems(items, field = "id") {
  return Array.isArray(items) && items.every((item) => item && typeof item[field] === "string" && item[field].trim())
    && new Set(items.map((item) => item[field])).size === items.length;
}

for (const [index, q] of questions.entries()) {
  const id = q?.id ?? `row-${index + 1}`;
  if (!q || typeof q !== "object") { problem(id, "Question must be an object"); continue; }
  if (typeof q.id !== "string" || !q.id.trim()) problem(id, "Missing stable id");
  if (seen.has(q.id)) problem(id, "Duplicate id");
  seen.add(q.id);
  if (!allowedTypes.has(q.type)) problem(id, `Unsupported type: ${q.type}`);
  typeCounts[q.type] = (typeCounts[q.type] ?? 0) + 1;
  if (!(q.domain in taskLimits)) problem(id, `Invalid domain: ${q.domain}`);
  else counts[q.domain]++;
  if (typeof q.prompt !== "string" || !q.prompt.trim()) problem(id, "Missing prompt");
  else {
    if (/\baccording to (?:the )?(?:pmbok|pmi)\b/i.test(q.prompt)) problem(id, "Source-recall stem");
    if (/_{3,}|\[\s*blank\s*\]|fill in the blank/i.test(q.prompt)) problem(id, "Fill-blank stem");
    if (/^\s*(?:what is|define|which term)\b/i.test(q.prompt)) warn(id, "Possible definition-recall stem; review context");
  }
  if (typeof q.explanation !== "string" || q.explanation.trim().length < 250) {
    problem(id, "Explanation missing or too short for detailed editorial review");
  }
  const metadata = q.metadata ?? {};
  if (metadata.editorialStatus !== "provisionally_approved") problem(id, "Not provisionally approved");
  if (typeof metadata.approach !== "string" || !metadata.approach.trim()) problem(id, "Missing approach");
  else {
    const approach = metadata.approach.toLowerCase();
    const category = approach.startsWith("predictive") ? "predictive"
      : approach.startsWith("adaptive") || approach.startsWith("agile") ? "adaptive"
      : approach.startsWith("hybrid") ? "hybrid" : "unclassified";
    approachCounts[category]++;
    if (category === "unclassified") warn(id, `Unclassified approach: ${metadata.approach}`);
  }
  if (typeof metadata.sourceLocator !== "string" || !metadata.sourceLocator.trim()) problem(id, "Missing source locator");
  if (typeof metadata.sourceDraft !== "string" || !metadata.sourceDraft.trim()) problem(id, "Missing draft provenance");
  const taskMatch = typeof metadata.primaryEcoTask === "string"
    ? metadata.primaryEcoTask.match(/^\s*(People|Process|Business Environment)\s+Task\s+(\d+)\b/i)
    : null;
  if (!taskMatch) problem(id, "Missing primary 2026 ECO task");
  else {
    const taskDomain = domainNames[taskMatch[1].toLowerCase()];
    const taskNumber = Number(taskMatch[2]);
    if (taskDomain !== q.domain) problem(id, "Primary ECO task disagrees with domain");
    if (taskNumber < 1 || taskNumber > taskLimits[taskDomain]) problem(id, "Primary ECO task number out of range");
    tasks.add(`${taskDomain}:${taskNumber}`);
  }

  const payload = q.payload ?? {};
  const answerKey = q.answerKey ?? {};
  if (q.media?.table) {
    const table = q.media.table;
    if (typeof table.caption !== "string" || !table.caption.trim()
      || !Array.isArray(table.columns) || table.columns.length < 2
      || table.columns.some((column) => typeof column !== "string" || !column.trim())
      || !Array.isArray(table.rows) || !table.rows.length
      || table.rows.some((row) => !Array.isArray(row) || row.length !== table.columns.length
        || row.some((cell) => typeof cell !== "string" || !cell.trim()))) {
      problem(id, "Invalid accessible table exhibit");
    }
  }
  if (["mcq_single", "mcq_multi", "pull_down"].includes(q.type)) {
    const choices = payload.choices;
    if (!Array.isArray(choices) || choices.length < 2 || !uniqueItems(choices)) {
      problem(id, "Choices need at least two unique nonempty ids");
      continue;
    }
    const choiceIds = new Set(choices.map((choice) => choice.id));
    const normalizedTexts = choices.map((choice) => String(choice.text ?? "").trim().replace(/\s+/g, " ").toLowerCase());
    if (normalizedTexts.some((text) => !text) || new Set(normalizedTexts).size !== normalizedTexts.length) {
      problem(id, "Choice text missing or duplicated");
    }
    if (q.type === "mcq_multi") {
      const correct = answerKey.correctChoiceIds;
      if (!Array.isArray(correct) || !correct.length || new Set(correct).size !== correct.length || correct.some((choiceId) => !choiceIds.has(choiceId))) {
        problem(id, "Invalid multi-response key");
      }
      if (payload.minSelections != null && payload.maxSelections != null && payload.minSelections > payload.maxSelections) {
        problem(id, "Selection bounds are reversed");
      }
      for (const [name, bound] of [["minSelections", payload.minSelections], ["maxSelections", payload.maxSelections]]) {
        if (bound != null && (!Number.isInteger(bound) || bound < 1 || bound > choices.length)) {
          problem(id, `${name} must be an integer between 1 and the choice count`);
        }
      }
      if (Array.isArray(correct) && ((payload.minSelections != null && correct.length < payload.minSelections)
        || (payload.maxSelections != null && correct.length > payload.maxSelections))) {
        problem(id, "Correct-choice count conflicts with selection bounds");
      }
    } else if (!choiceIds.has(answerKey.correctChoiceId)) {
      problem(id, "Correct choice id does not exist");
    }
  } else if (q.type === "dnd_match") {
    if (!uniqueItems(payload.prompts) || !uniqueItems(payload.answers) || !payload.prompts.length || !payload.answers.length) {
      problem(id, "Invalid matching prompts/answers");
    } else if (payload.prompts.some((prompt) => !payload.answers.some((answer) => answer.id === answerKey.mapping?.[prompt.id]))) {
      problem(id, "Matching key is incomplete or invalid");
    }
  } else if (q.type === "dnd_order") {
    const items = payload.items;
    if (!uniqueItems(items) || items.length < 2 || !Array.isArray(answerKey.orderedIds)
      || answerKey.orderedIds.length !== items.length
      || new Set(answerKey.orderedIds).size !== items.length
      || answerKey.orderedIds.some((itemId) => !items.some((item) => item.id === itemId))) {
      problem(id, "Invalid ordering items/key");
    }
  } else if (q.type === "hotspot") {
    if (!q.media?.imageUrl || !q.media?.alt) problem(id, "Hotspot needs image and alt text");
    if (!uniqueItems(payload.regions) || !payload.regions.some((region) => region.id === answerKey.correctRegionId)) {
      problem(id, "Invalid hotspot regions/key");
    }
  }
}

if (complete) {
  if (questions.length !== 180) problem("form", `Expected 180 questions, found ${questions.length}`);
  for (const [domain, target] of Object.entries(targetDomains)) {
    if (counts[domain] !== target) problem("form", `${domain}: expected ${target}, found ${counts[domain]}`);
    for (let task = 1; task <= taskLimits[domain]; task++) {
      if (!tasks.has(`${domain}:${task}`)) problem("form", `Missing ${domain} Task ${task}`);
    }
  }
  if (approachCounts.predictive < 63 || approachCounts.predictive > 81) {
    warn("form", `Predictive count ${approachCounts.predictive} is outside an approximate 35-45% planning band for 180 items`);
  }
}

console.log(JSON.stringify({ path, mode: complete ? "complete-form" : "partial-staging", total: questions.length, domains: counts, types: typeCounts, approaches: approachCounts, taskCoverage: tasks.size, issues, warnings }, null, 2));
if (issues.length) process.exitCode = 1;
