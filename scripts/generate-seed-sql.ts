#!/usr/bin/env npx tsx
/**
 * generate-seed-sql.ts
 *
 * Reads the TypeScript seed banks and generates Supabase-compatible SQL files.
 *
 * Usage:
 *   npx tsx scripts/generate-seed-sql.ts set_a > supabase/seed-set-a.sql
 *   npx tsx scripts/generate-seed-sql.ts set_b > supabase/seed-set-b.sql
 */
import { setABank } from "../src/exam-engine/data/seed.set-a";
import { setBBank } from "../src/exam-engine/data/seed.set-b";
import { setCBank } from "../src/exam-engine/data/seed.set-c";
import type { Question } from "../src/exam-engine/core/types";

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function toJsonbLiteral(obj: unknown): string {
  return `'${esc(JSON.stringify(obj))}'::jsonb`;
}

function toTagsArray(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return "ARRAY[]::text[]";
  return `ARRAY[${tags.map((t) => `'${esc(t)}'`).join(",")}]`;
}

function questionToInsert(q: Question, bankIdVar: string): string {
  const vals = [
    bankIdVar,
    `'${esc(q.id)}'`,
    `'${esc(q.type)}'`,
    `'${esc(q.domain)}'`,
    `'${esc(q.prompt)}'`,
    String(q.difficulty ?? 2),
    toTagsArray(q.tags),
    `'${q.accessTier ?? "free"}'`,
    `'${q.setId ?? "free"}'`,
    String(q.version ?? 1),
    toJsonbLiteral(q.payload),
    toJsonbLiteral(q.answerKey),
    q.explanation ? `'${esc(q.explanation)}'` : "NULL",
  ];

  return `  INSERT INTO questions (bank_id, question_key, type, domain, prompt, difficulty, tags, access_tier, set_id, version, payload, answer_key, explanation) VALUES
  (${vals.join(",\n   ")});`;
}

function generateBlock(setId: string, label: string, questions: Question[]): string {
  const lines: string[] = [];
  lines.push(`-- =============================================================================`);
  lines.push(`-- ${label}`);
  lines.push(`-- ${questions.length} questions · set_id = '${setId}'`);
  lines.push(`-- =============================================================================`);
  lines.push(``);
  lines.push(`DO $do$`);
  lines.push(`DECLARE`);
  lines.push(`  v_bank_id UUID;`);
  lines.push(`BEGIN`);
  lines.push(`  SELECT id INTO v_bank_id FROM question_banks WHERE slug = 'pmp';`);
  lines.push(``);
  lines.push(`  -- Wipe existing ${setId} questions so the seed is idempotent`);
  lines.push(`  DELETE FROM questions WHERE bank_id = v_bank_id AND set_id = '${setId}';`);
  lines.push(``);

  for (const q of questions) {
    lines.push(questionToInsert(q, "v_bank_id"));
    lines.push(``);
  }

  lines.push(`END $do$;`);
  return lines.join("\n");
}

// ── main ──────────────────────────────────────────────────────────────────────
const BANKS: Record<string, { label: string; questions: Question[] }> = {
  set_a: { label: "PMP SET A — 180 Questions", questions: setABank },
  set_b: { label: "PMP SET B — 180 Questions", questions: setBBank },
  set_c: { label: "PMP SET C — 180 Questions", questions: setCBank },
};

const target = process.argv[2] ?? "set_a";
const bank = BANKS[target];
if (!bank) {
  console.error(`Unknown set: ${target}. Available: ${Object.keys(BANKS).join(", ")}`);
  process.exit(1);
}

const sql = generateBlock(target, bank.label, bank.questions);
process.stdout.write(sql + "\n");
