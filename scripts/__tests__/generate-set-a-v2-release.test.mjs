import { execFileSync } from "node:child_process";
import { strict as assert } from "node:assert";

const sql = execFileSync(process.execPath, ["scripts/generate-set-a-v2-release.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});

assert.match(sql, /media = CASE[\s\S]*ELSE q\.media[\s\S]*END,/);
assert.doesNotMatch(sql, /media = r\.item->'media',/);
assert.match(sql, /staged_count <> 180/);
console.log("Set A v2 release SQL generator checks passed.");
