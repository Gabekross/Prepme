/**
 * Read-only Set A worklist reconciliation. Does not contact the database.
 * Usage: node scripts/report-set-a-progress.mjs
 */
import { readFileSync, existsSync } from "node:fs";

const seed = readFileSync("src/exam-engine/data/seed.set-a.ts", "utf8");
const seedIds = [...seed.matchAll(/\bid:\s*"(pma-[^"]+)"/g)].map((match) => match[1]);
const liveOnlyFillBlankIds = ["pma-ppl-075", "pma-ppl-076", "pma-prc-088", "pma-prc-089", "pma-prc-090", "pma-env-014"];
const legacyIds = new Set([...seedIds, ...liveOnlyFillBlankIds]);
if (seedIds.length !== 174 || legacyIds.size !== 180) {
  throw new Error(`Unexpected baseline inventory: ${seedIds.length} seed IDs and ${legacyIds.size} total IDs`);
}

const staged = JSON.parse(readFileSync("staging/set-a-replacements.json", "utf8"));
const stagedIds = new Set(staged.map((question) => question.id));
const draftFiles = [
  "docs/2026-set-a-batch4-solo-drafts.md",
  "docs/2026-set-a-batch4-people.md",
  "docs/2026-set-a-batch4-business.md",
  "docs/2026-set-a-gap-people-quality.md",
  "docs/2026-set-a-gap-status-external.md",
  "docs/2026-set-a-batch6-people.md",
  "docs/2026-set-a-batch6-other.md",
  "docs/2026-set-a-remaining-people.md",
  "docs/2026-set-a-remaining-process-1.md",
  "docs/2026-set-a-remaining-final.md",
];
const drafts = {};
for (const path of draftFiles) {
  if (!existsSync(path)) continue;
  const source = readFileSync(path, "utf8");
  drafts[path] = [...source.matchAll(/^##\s+`?(pma-[a-z]+-\d+)`?/gm)].map((match) => match[1]);
}
const draftIds = Object.values(drafts).flat();
const draftsAlreadyStaged = draftIds.filter((id) => stagedIds.has(id));
const draftsPendingStaging = draftIds.filter((id) => !stagedIds.has(id));
const unknown = [...stagedIds, ...draftIds].filter((id) => !legacyIds.has(id));
const duplicateDrafts = draftIds.filter((id, index) => draftIds.indexOf(id) !== index);
const remaining = [...legacyIds].filter((id) => !stagedIds.has(id) && !draftIds.includes(id));

console.log(JSON.stringify({
  legacyTotal: legacyIds.size,
  staged: stagedIds.size,
  draftsByFile: Object.fromEntries(Object.entries(drafts).map(([path, ids]) => [path, ids.length])),
  draftIdsAlreadyStaged: draftsAlreadyStaged.length,
  draftsPendingStaging: draftsPendingStaging.length,
  remainingNotDrafted: remaining.length,
  duplicateDrafts,
  unknown,
}, null, 2));
if (duplicateDrafts.length || unknown.length) process.exitCode = 1;
