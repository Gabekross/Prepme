/**
 * One-time, deterministic conversion of the 16 independently approved final
 * Set A drafts. The companion review is the authority for the allowlist and
 * the two approach metadata corrections. This writes local staging only.
 */
import { readFileSync, writeFileSync } from "node:fs";

const draftPath = "docs/2026-set-a-remaining-final.md";
const stagingPath = "staging/set-a-replacements.json";
const approvedIds = new Set([
  "pma-prc-049", "pma-prc-050", "pma-prc-051", "pma-prc-053",
  "pma-prc-054", "pma-prc-055", "pma-prc-056", "pma-ppl-035",
  "pma-ppl-040", "pma-ppl-043", "pma-env-006", "pma-env-011",
  "pma-env-012", "pma-env-013",
]);
const approachCorrections = new Map();
const taskCorrections = new Map([
  ["pma-prc-054", { domain: "business_environment", primaryEcoTask: "Business Environment Task 3" }],
]);

const source = readFileSync(draftPath, "utf8");
const staged = JSON.parse(readFileSync(stagingPath, "utf8"));
const sections = source.split(/^## /m).slice(1).flatMap((chunk) => {
  const newline = chunk.indexOf("\n");
  const heading = chunk.slice(0, newline);
  const id = heading.match(/^`([^`]+)`/)?.[1];
  return id ? [[id, chunk.slice(newline + 1)]] : [];
});
const clean = (text) => text.replace(/\*\*/g, "").replace(/`/g, "").trim();
const domainFor = (label) => ({
  People: "people", Process: "process", "Business Environment": "business_environment",
})[label];

if (sections.length !== 29) throw new Error(`Expected 29 draft sections, found ${sections.length}`);
if (staged.length !== 166) throw new Error(`Expected 166 staged questions, found ${staged.length}`);

function parseHeader(id, body) {
  const line = body.match(/^\*\*Primary ECO:\*\* ([\s\S]*?)$/m)?.[1];
  const match = line?.match(/^(People|Process|Business Environment) Task (\d+),[\s\S]*?\*\*Approach \/ type:\*\* ([\s\S]*?)\. \*\*Source locator:\*\* ([\s\S]*?) \*\*Topic retained:\*\* ([\s\S]*?)\. \*\*Errata:\*\* ([\s\S]*)$/);
  if (!match) throw new Error(`${id}: cannot parse metadata`);
  const [, ecoDomain, task, approachAndType, sourceLocator, topic, errata] = match;
  const semicolon = approachAndType.indexOf(";");
  if (semicolon < 0) throw new Error(`${id}: missing approach/type separator`);
  return {
    domain: domainFor(ecoDomain),
    primaryEcoTask: `${ecoDomain} Task ${task}`,
    approach: approachCorrections.get(id) ?? approachAndType.slice(0, semicolon).trim(),
    typeLabel: approachAndType.slice(semicolon + 1).trim().toLowerCase(),
    sourceLocator: clean(`${sourceLocator} Topic: ${topic}. Errata: ${errata}`),
  };
}

function parseQuestion(id, body) {
  const header = parseHeader(id, body);
  const prompt = clean(body.match(/\*\*Stem\.\*\* ([\s\S]*?)\n\n/)?.[1] ?? "");
  if (!prompt) throw new Error(`${id}: missing stem`);
  const key = body.match(/^\*\*Key:\s*([^*]+?)\.\*\*\s*([^\n]+)$/m);
  if (!key) throw new Error(`${id}: missing key paragraph`);
  const keyText = clean(key[1]);
  const explanation = clean(key[2]);
  if (explanation.length < 250) throw new Error(`${id}: explanation unexpectedly short`);

  if (header.typeLabel.includes("single response")) {
    const choices = [...body.matchAll(/^([A-E])\. (.+)$/gm)].map((m) => ({ id: m[1].toLowerCase(), text: clean(m[2]) }));
    const correctChoiceId = keyText.match(/^([A-E])\.?$/)?.[1]?.toLowerCase();
    if (choices.length < 4 || !correctChoiceId) throw new Error(`${id}: malformed single-response item`);
    return { id, type: "mcq_single", domain: header.domain, prompt, payload: { choices }, answerKey: { correctChoiceId }, explanation, metadata: header };
  }
  if (header.typeLabel.includes("multiple response")) {
    const choices = [...body.matchAll(/^([A-E])\. (.+)$/gm)].map((m) => ({ id: m[1].toLowerCase(), text: clean(m[2]) }));
    const correctChoiceIds = [...keyText.matchAll(/[A-E]/g)].map((m) => m[0].toLowerCase());
    if (choices.length < 4 || correctChoiceIds.length < 2) throw new Error(`${id}: malformed multiple-response item`);
    return { id, type: "mcq_multi", domain: header.domain, prompt, payload: { choices, minSelections: correctChoiceIds.length, maxSelections: correctChoiceIds.length }, answerKey: { correctChoiceIds, scoring: "strict" }, explanation, metadata: header };
  }
  if (header.typeLabel.includes("ordering")) {
    const itemBlock = body.match(/\*\*Items\*\*\s*\n\n([\s\S]*?)\n\n\*\*Key/)?.[1];
    const items = [...(itemBlock ?? "").matchAll(/^- (I\d+)\. (.+)$/gm)].map((m) => ({ id: m[1].toLowerCase(), text: clean(m[2]) }));
    const orderedIds = [...keyText.matchAll(/I\d+/g)].map((m) => m[0].toLowerCase());
    if (!items.length || orderedIds.length !== items.length) throw new Error(`${id}: malformed ordering item`);
    return { id, type: "dnd_order", domain: header.domain, prompt, payload: { items }, answerKey: { orderedIds }, explanation, metadata: header };
  }
  throw new Error(`${id}: unsupported item type ${header.typeLabel}`);
}

const additions = sections.filter(([id]) => approvedIds.has(id)).map(([id, body]) => {
  const q = parseQuestion(id, body);
  q.metadata = { ...q.metadata, editorialStatus: "provisionally_approved", sourceDraft: draftPath };
  const correction = taskCorrections.get(id);
  if (correction) {
    q.domain = correction.domain;
    q.metadata.primaryEcoTask = correction.primaryEcoTask;
  }
  return q;
});
if (additions.length !== approvedIds.size) throw new Error(`Expected ${approvedIds.size} approved items, found ${additions.length}`);
const existing = new Set(staged.map((q) => q.id));
const duplicates = additions.filter((q) => existing.has(q.id)).map((q) => q.id);
if (duplicates.length) throw new Error(`Already staged: ${duplicates.join(", ")}`);

if (!process.argv.includes("--dry-run")) {
  writeFileSync(stagingPath, `${JSON.stringify([...staged, ...additions], null, 2)}\n`);
}
console.log(JSON.stringify({ before: staged.length, added: additions.length, after: staged.length + additions.length, approachCorrections: [...approachCorrections.keys()] }, null, 2));
