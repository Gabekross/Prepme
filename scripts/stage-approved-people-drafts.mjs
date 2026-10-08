/** Converts SME-approved People drafts to local Set A staging only. */
import { readFileSync, writeFileSync } from "node:fs";

const draftPath = "docs/2026-set-a-remaining-people.md";
const stagingPath = "staging/set-a-replacements.json";
const approachNeutral = new Set([
  "pma-ppl-060", "pma-ppl-065", "pma-ppl-067", "pma-ppl-068", "pma-ppl-069",
  "pma-ppl-070", "pma-ppl-071", "pma-ppl-073", "pma-ppl-074", "pma-ppl-006",
  "pma-ppl-007", "pma-ppl-010", "pma-ppl-011", "pma-ppl-014", "pma-ppl-019",
  "pma-ppl-020", "pma-ppl-024", "pma-ppl-028", "pma-ppl-029",
]);
const source = readFileSync(draftPath, "utf8");
const staged = JSON.parse(readFileSync(stagingPath, "utf8"));
const sections = source.split(/^## /m).slice(1).flatMap((chunk) => {
  const newline = chunk.indexOf("\n");
  const id = chunk.slice(0, newline).match(/^`([^`]+)`/)?.[1];
  return id ? [[id, chunk.slice(newline + 1)]] : [];
});
const clean = (text) => text.replace(/\*\*/g, "").replace(/`/g, "").trim();
const domainFor = (label) => ({ People: "people", Process: "process", "Business Environment": "business_environment" })[label];

if (sections.length !== 30) throw new Error(`Expected 30 draft sections, found ${sections.length}`);
if (staged.length !== 136) throw new Error(`Expected 136 staged questions, found ${staged.length}`);

function headerFor(id, body) {
  const line = body.match(/^\*\*Primary ECO:\*\* ([\s\S]*?)$/m)?.[1];
  const match = line?.match(/^(People|Process|Business Environment) Task (\d+),[\s\S]*?\*\*Approach:\*\* ([^.]+)\. \*\*Proposed type:\*\* ([^.]+)\. \*\*Source locator:\*\* ([\s\S]*?) \*\*Topic retained:\*\* ([\s\S]*?)\. \*\*Errata:\*\* ([\s\S]*)$/);
  if (!match) throw new Error(`${id}: cannot parse metadata`);
  const [, domain, task, approach, typeLabel, sourceLocator, topic, errata] = match;
  return { domain: domainFor(domain), primaryEcoTask: `${domain} Task ${task}`, approach: approachNeutral.has(id) ? "Approach-neutral" : clean(approach), typeLabel: clean(typeLabel).toLowerCase(), sourceLocator: clean(`${sourceLocator} Topic: ${topic}. Errata: ${errata}`) };
}

function explanationFor(id, body) {
  const keyLine = body.match(/^\*\*Key:\*?\*?\s*([^\n]+)$/m)?.[1];
  if (!keyLine) throw new Error(`${id}: missing key line`);
  const keyText = keyLine.match(/^([A-F](?:, [A-F])*(?:,? and [A-F])?(?: \(exactly [^)]+\))?|P\d+-A\d+(?:; P\d+-A\d+)*|I\d+(?:, I\d+)*)/)?.[1];
  if (!keyText) throw new Error(`${id}: cannot parse key`);
  const explanation = clean(keyLine.slice(keyText.length).replace(/^\.?\s*/, ""));
  if (explanation.length < 250) throw new Error(`${id}: explanation unexpectedly short`);
  return { keyText, explanation };
}

function questionFor(id, body) {
  const metadata = headerFor(id, body);
  const prompt = clean(body.match(/\*\*Stem:\*\* ([\s\S]*?)\n\n/)?.[1] ?? "");
  if (!prompt) throw new Error(`${id}: missing stem`);
  const { keyText, explanation } = explanationFor(id, body);
  let type;
  if (metadata.typeLabel.includes("multiple response")) type = "mcq_multi";
  else if (metadata.typeLabel.includes("matching")) type = "dnd_match";
  else if (metadata.typeLabel.includes("ordering")) type = "dnd_order";
  else if (metadata.typeLabel.includes("single response")) type = "mcq_single";
  else throw new Error(`${id}: unsupported type ${metadata.typeLabel}`);
  let payload; let answerKey;
  if (type === "mcq_single" || type === "mcq_multi") {
    const choices = [...body.matchAll(/^([A-F])\. (.+)$/gm)].map((m) => ({ id: m[1].toLowerCase(), text: clean(m[2]) }));
    if (choices.length < 4) throw new Error(`${id}: too few choices`);
    payload = { choices };
    if (type === "mcq_single") {
      const correctChoiceId = keyText.match(/^[A-E]/)?.[0]?.toLowerCase();
      if (!correctChoiceId) throw new Error(`${id}: invalid key`);
      answerKey = { correctChoiceId };
    } else {
      const correctChoiceIds = [...keyText.matchAll(/[A-F]/g)].map((m) => m[0].toLowerCase());
      payload.minSelections = correctChoiceIds.length; payload.maxSelections = correctChoiceIds.length;
      answerKey = { correctChoiceIds, scoring: "strict" };
    }
  } else if (type === "dnd_match") {
    const prompts = [...(body.match(/\*\*Prompts:\*\*\s*\n\n([\s\S]*?)\n\n\*\*Answers:/)?.[1] ?? "").matchAll(/^- (P\d+)[:.] (.+)$/gm)].map((m) => ({ id: m[1].toLowerCase(), text: clean(m[2]) }));
    const answers = [...(body.match(/\*\*Answers:\*\*\s*\n\n([\s\S]*?)\n\n\*\*Key:/)?.[1] ?? "").matchAll(/^- (A\d+)[:.] (.+)$/gm)].map((m) => ({ id: m[1].toLowerCase(), text: clean(m[2]) }));
    const mapping = Object.fromEntries([...keyText.matchAll(/P(\d+)-A(\d+)/g)].map((m) => [`p${m[1]}`, `a${m[2]}`]));
    if (!prompts.length || prompts.length !== answers.length || Object.keys(mapping).length !== prompts.length) throw new Error(`${id}: malformed matching item`);
    payload = { prompts, answers }; answerKey = { mapping };
  } else {
    const items = [...body.matchAll(/^- (I\d+)[:.] (.+)$/gm)].map((m) => ({ id: m[1].toLowerCase(), text: clean(m[2]) }));
    const orderedIds = [...keyText.matchAll(/I\d+/g)].map((m) => m[0].toLowerCase());
    if (!items.length || orderedIds.length !== items.length) throw new Error(`${id}: malformed ordering item`);
    payload = { items }; answerKey = { orderedIds };
  }
  return { id, type, domain: metadata.domain, prompt, payload, answerKey, explanation, metadata: { primaryEcoTask: metadata.primaryEcoTask, approach: metadata.approach, sourceLocator: metadata.sourceLocator, editorialStatus: "provisionally_approved", sourceDraft: draftPath } };
}

const additions = sections.map(([id, body]) => questionFor(id, body));
const duplicates = additions.filter((q) => staged.some((existing) => existing.id === q.id)).map((q) => q.id);
if (duplicates.length) throw new Error(`Already staged: ${duplicates.join(", ")}`);
if (!process.argv.includes("--dry-run")) writeFileSync(stagingPath, `${JSON.stringify([...staged, ...additions], null, 2)}\n`);
console.log(JSON.stringify({ before: staged.length, added: additions.length, after: staged.length + additions.length }, null, 2));
