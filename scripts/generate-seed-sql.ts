#!/usr/bin/env npx tsx
/**
 * generate-seed-sql.ts
 *
 * Reads the TypeScript seed banks (setABank, etc.) and generates a Supabase-
 * compatible SQL file that can be appended to supabase/seed.sql.
 *
 * Usage:  npx tsx scripts/generate-seed-sql.ts > supabase/seed-set-a.sql
 */
import { setABank } from "../src/exam-engine/data/seed.set-a";
import type { Question } from "../src/exam-engine/core/types";

function esc(s: string): string {
  // Escape single quotes for SQL strings using $$ quoting would be complex;
  // instead double single-quotes inside a standard string literal.
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
const sql = generateBlock("set_a", "PMP SET A — 180 Questions", setABank);
process.stdout.write(sql + "\n");
