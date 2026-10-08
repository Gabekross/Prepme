/** Applies the seven approved domain-rebalance payloads to local staging. */
import { readFileSync, writeFileSync } from "node:fs";

const packagePath = "docs/2026-set-a-domain-rebalance-sme-package.md";
const stagingPath = "staging/set-a-replacements.json";
const selected = new Set([
  "pma-ppl-017", "pma-ppl-024", "pma-ppl-033", "pma-ppl-046",
  "pma-ppl-057", "pma-ppl-049", "pma-ppl-076",
]);
const source = readFileSync(packagePath, "utf8");
const staged = JSON.parse(readFileSync(stagingPath, "utf8"));
const replacements = [...source.matchAll(/^### \d+\. `([^`]+)`[\s\S]*?```json\r?\n([\s\S]*?)\r?\n```\r?\n\r?\n\*\*Explanation:\*\* ([\s\S]*?)(?=\r?\n\r?\n\*\*Accessibility|\r?\n\r?\n###|\r?\n\r?\n##)/gm)].map((match) => ({
  ...JSON.parse(match[2]),
  id: match[1],
  explanation: match[3].trim(),
}));
const byId = new Map(replacements.map((item) => [item.id, item]));

if (staged.length !== 180) throw new Error(`Expected 180 staged questions, found ${staged.length}`);
if (replacements.length !== selected.size || [...selected].some((id) => !byId.has(id))) {
  throw new Error("SME package does not contain exactly the approved seven payloads.");
}
for (const id of selected) {
  const old = staged.find((item) => item.id === id);
  const replacement = byId.get(id);
  if (!old) throw new Error(`Missing staged target ${id}`);
  if (old.domain !== "people" && old.domain !== replacement.domain) {
    throw new Error(`${id} is neither the original People item nor this replacement domain`);
  }
  if (!replacement?.metadata?.primaryEcoTask || !replacement?.metadata?.sourceLocator) {
    throw new Error(`${id} lacks required SME metadata`);
  }
  if (replacement.explanation.length < 250) throw new Error(`${id} explanation is too short`);
}
const next = staged.map((item) => byId.get(item.id) ?? item);
const domains = next.reduce((counts, item) => ({ ...counts, [item.domain]: (counts[item.domain] ?? 0) + 1 }), {});
if (domains.people !== 59 || domains.process !== 74 || domains.business_environment !== 47) {
  throw new Error(`Unexpected domain totals: ${JSON.stringify(domains)}`);
}
if (!process.argv.includes("--dry-run")) writeFileSync(stagingPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(JSON.stringify({ replaced: [...selected], domains, total: next.length }, null, 2));
