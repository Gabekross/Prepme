/**
 * One-time, deterministic conversion of the independently approved Process batch.
 * Refuses to append duplicates or malformed draft sections.
 */
import { readFileSync, writeFileSync } from "node:fs";

const draftPath = "docs/2026-set-a-remaining-process-1.md";
const stagingPath = "staging/set-a-replacements.json";
const source = readFileSync(draftPath, "utf8");
const staged = JSON.parse(readFileSync(stagingPath, "utf8"));

const sections = source.split(/^## /m).slice(1).flatMap((chunk) => {
  const newline = chunk.indexOf("\n");
  const heading = chunk.slice(0, newline);
  const id = heading.match(/^`([^`]+)`/)?.[1];
  return id ? [[id, chunk.slice(newline + 1)]] : [];
});
if (sections.length !== 39) throw new Error(`Expected 39 draft sections, found ${sections.length}`);

const clean = (text) => text.replace(/\*\*/g, "").replace(/`/g, "").trim();
const domainFor = (label) => ({
  People: "people",
  Process: "process",
  "Business Environment": "business_environment",
})[label];

function parseHeader(id, body) {
  const line = body.match(/^\*\*Primary ECO:\*\* ([\s\S]*?)$/m)?.[1];
  if (!line) throw new Error(`${id}: missing metadata line`);
  const match = line.match(/^(People|Process|Business Environment) Task (\d+),[\s\S]*?\*\*Approach \/ type:\*\* ([\s\S]*?)\. \*\*Source:\*\* ([\s\S]*?) Errata: ([\s\S]*)$/);
  if (!match) throw new Error(`${id}: cannot parse metadata line`);
  const [, ecoDomain, task, approachAndType, sourceLocator, errata] = match;
  const semicolon = approachAndType.indexOf(";");
  if (semicolon < 0) throw new Error(`${id}: missing approach/type separator`);
  return {
    domain: domainFor(ecoDomain),
    primaryEcoTask: `${ecoDomain} Task ${task}`,
    approach: approachAndType.slice(0, semicolon).trim(),
    typeLabel: approachAndType.slice(semicolon + 1).trim(),
    sourceLocator: clean(`${sourceLocator} Errata: ${errata}`),
  };
}

function parseStem(id, body) {
  const stem = body.match(/\*\*Stem\.\*\* ([\s\S]*?)\n\n/)?.[1];
  if (!stem) throw new Error(`${id}: missing stem`);
  return clean(stem);
}

function parseKeyParagraph(id, body) {
  const inline = body.match(/^\*\*Key:\s*([^*]+?)\.\*\*\s*([^\n]+)$/m);
  if (inline) return { keyText: clean(inline[1]), explanation: clean(inline[2]) };
  const labelOnly = body.match(/^\*\*Key:\*\*\s*([^\.]+)\.\s*([^\n]+)$/m);
  if (labelOnly) return { keyText: clean(labelOnly[1]), explanation: clean(labelOnly[2]) };
  throw new Error(`${id}: missing key paragraph`);
}

function parseQuestion(id, body) {
  const header = parseHeader(id, body);
  const prompt = parseStem(id, body);
  const { keyText, explanation } = parseKeyParagraph(id, body);
  const typeLabel = header.typeLabel.toLowerCase();
  let type;
  if (typeLabel.includes("multiple response")) type = "mcq_multi";
  else if (typeLabel.includes("matching") || typeLabel.includes("dnd_match")) type = "dnd_match";
  else if (typeLabel.includes("ordering") || typeLabel.includes("dnd_order")) type = "dnd_order";
  else if (typeLabel.includes("single response")) type = "mcq_single";
  else throw new Error(`${id}: unsupported type label ${header.typeLabel}`);

  let payload;
  let answerKey;
  if (type === "mcq_single" || type === "mcq_multi") {
    const choices = [...body.matchAll(/^([A-E])\. (.+)$/gm)].map((match) => ({ id: match[1].toLowerCase(), text: clean(match[2]) }));
    if (choices.length < 4) throw new Error(`${id}: expected at least four choices`);
    payload = { choices };
    if (type === "mcq_single") {
      const key = keyText.match(/^([A-E])\.?$/)?.[1]?.toLowerCase();
      if (!key) throw new Error(`${id}: invalid single-response key ${keyText}`);
      answerKey = { correctChoiceId: key };
    } else {
      const keys = [...keyText.matchAll(/[A-E]/g)].map((match) => match[0].toLowerCase());
      if (keys.length < 2) throw new Error(`${id}: invalid multiple-response key ${keyText}`);
      payload.minSelections = keys.length;
      payload.maxSelections = keys.length;
      answerKey = { correctChoiceIds: keys, scoring: "strict" };
    }
  } else if (type === "dnd_match") {
    const promptBlock = body.match(/\*\*Prompts\*\*\s*\n\n([\s\S]*?)\n\n\*\*Answers\*\*/)?.[1];
    const answerBlock = body.match(/\*\*Answers\*\*\s*\n\n([\s\S]*?)\n\n\*\*Key/)?.[1];
    if (!promptBlock || !answerBlock) throw new Error(`${id}: missing matching blocks`);
    const prompts = [...promptBlock.matchAll(/^- (P\d+)\. (.+)$/gm)].map((match) => ({ id: match[1].toLowerCase(), text: clean(match[2]) }));
    const answers = [...answerBlock.matchAll(/^- (A\d+)\. (.+)$/gm)].map((match) => ({ id: match[1].toLowerCase(), text: clean(match[2]) }));
    const mapping = Object.fromEntries([...keyText.matchAll(/P(\d+)-A(\d+)/g)].map((match) => [`p${match[1]}`, `a${match[2]}`]));
    if (!prompts.length || prompts.length !== answers.length || Object.keys(mapping).length !== prompts.length) throw new Error(`${id}: invalid matching content`);
    payload = { prompts, answers };
    answerKey = { mapping };
  } else {
    const itemBlock = body.match(/\*\*Items\*\*\s*\n\n([\s\S]*?)\n\n\*\*Key/)?.[1];
    if (!itemBlock) throw new Error(`${id}: missing ordering items`);
    const items = [...itemBlock.matchAll(/^- (I\d+)\. (.+)$/gm)].map((match) => ({ id: match[1].toLowerCase(), text: clean(match[2]) }));
    const orderedIds = [...keyText.matchAll(/I\d+/g)].map((match) => match[0].toLowerCase());
    if (!items.length || orderedIds.length !== items.length) throw new Error(`${id}: invalid ordering content`);
    payload = { items };
    answerKey = { orderedIds };
  }

  if (explanation.length < 250) throw new Error(`${id}: explanation unexpectedly short (${explanation.length})`);
  return {
    id,
    type,
    domain: header.domain,
    prompt,
    payload,
    answerKey,
    explanation,
    metadata: {
      primaryEcoTask: header.primaryEcoTask,
      approach: header.approach,
      sourceLocator: header.sourceLocator,
      editorialStatus: "provisionally_approved",
      sourceDraft: draftPath,
    },
  };
}

const additions = sections.map(([id, body]) => parseQuestion(id, body));
const existing = new Set(staged.map((question) => question.id));
const duplicates = additions.filter((question) => existing.has(question.id)).map((question) => question.id);
if (duplicates.length) throw new Error(`Already staged: ${duplicates.join(", ")}`);
if (staged.length !== 97) throw new Error(`Expected 97 existing staged questions, found ${staged.length}`);

if (!process.argv.includes("--dry-run")) {
  writeFileSync(stagingPath, `${JSON.stringify([...staged, ...additions], null, 2)}\n`);
}
console.log(JSON.stringify({ before: staged.length, added: additions.length, after: staged.length + additions.length }, null, 2));
