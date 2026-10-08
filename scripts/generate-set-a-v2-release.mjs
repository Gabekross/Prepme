#!/usr/bin/env node
/**
 * Emits a single, transactional SQL release for the reviewed Set A fixture.
 * It never connects to Supabase. Review the generated SQL and run it only
 * after the versioning migration is present in the target database.
 */
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
const output = outputIndex >= 0 ? args[outputIndex + 1] : null;
if (outputIndex >= 0 && !output) throw new Error("--output requires a path");

const questions = JSON.parse(readFileSync("staging/set-a-replacements.json", "utf8"));
if (!Array.isArray(questions) || questions.length !== 180) {
  throw new Error(`Expected exactly 180 reviewed Set A questions; found ${Array.isArray(questions) ? questions.length : "invalid data"}.`);
}
const ids = questions.map((question) => question.id);
if (new Set(ids).size !== ids.length || ids.some((id) => typeof id !== "string" || !id.trim())) {
  throw new Error("The reviewed Set A fixture must contain 180 unique stable question ids.");
}

const payload = JSON.stringify(questions).replaceAll("$release$", "\\u0024release\\u0024");
const sql = `-- Generated from staging/set-a-replacements.json. Do not hand-edit question JSON.
-- Preconditions: the version_question_bank_content migration has succeeded.
BEGIN;

CREATE TEMP TABLE release_set_a_v2 (item JSONB NOT NULL) ON COMMIT DROP;
INSERT INTO release_set_a_v2 (item)
SELECT value FROM jsonb_array_elements($release$${payload}$release$::jsonb);

DO $$
DECLARE
  staged_count INTEGER;
  live_count INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT count(*) INTO staged_count FROM release_set_a_v2;
  SELECT count(*) INTO live_count
  FROM public.questions q
  JOIN public.question_banks b ON b.id = q.bank_id
  WHERE b.slug = 'pmp' AND q.set_id = 'set_a' AND q.is_current = true;
  SELECT count(*) INTO missing_count
  FROM release_set_a_v2 r
  LEFT JOIN public.questions q
    ON q.question_key = r.item->>'id'
   AND q.set_id = 'set_a'
   AND q.is_current = true
  LEFT JOIN public.question_banks b ON b.id = q.bank_id AND b.slug = 'pmp'
  WHERE b.id IS NULL;

  IF staged_count <> 180 OR live_count <> 180 OR missing_count <> 0 THEN
    RAISE EXCEPTION 'Set A v2 preflight failed (staged %, live %, missing %)', staged_count, live_count, missing_count;
  END IF;
END $$;

-- Snapshot the exact v1 rows first. Existing snapshots are never overwritten.
INSERT INTO public.question_versions (bank_id, question_key, version, content)
SELECT
  q.bank_id, q.question_key, COALESCE(q.version, 1),
  jsonb_build_object(
    'id', q.question_key, 'type', q.type, 'domain', q.domain, 'prompt', q.prompt,
    'scenarioId', q.scenario_key, 'difficulty', q.difficulty,
    'tags', COALESCE(to_jsonb(q.tags), '[]'::jsonb), 'accessTier', q.access_tier,
    'setId', q.set_id, 'version', COALESCE(q.version, 1), 'media', q.media,
    'payload', q.payload, 'answerKey', q.answer_key, 'explanation', q.explanation
  )
FROM public.questions q
JOIN public.question_banks b ON b.id = q.bank_id AND b.slug = 'pmp'
JOIN release_set_a_v2 r ON r.item->>'id' = q.question_key
WHERE q.set_id = 'set_a' AND q.is_current = true
ON CONFLICT (bank_id, question_key, version) DO NOTHING;

UPDATE public.questions q
SET
  type = r.item->>'type',
  domain = r.item->>'domain',
  prompt = r.item->>'prompt',
  -- Most reviewed replacements have no new exhibit. Preserve the current
  -- non-null media JSON in that case; overwrite it only when the fixture
  -- supplies a real table/image exhibit.
  media = CASE
    WHEN r.item ? 'media' AND r.item->'media' <> 'null'::jsonb THEN r.item->'media'
    ELSE q.media
  END,
  payload = r.item->'payload',
  answer_key = r.item->'answerKey',
  explanation = r.item->>'explanation',
  version = COALESCE(q.version, 1) + 1,
  is_current = true,
  is_published = true,
  content_released_at = now()
FROM release_set_a_v2 r
JOIN public.question_banks b ON b.slug = 'pmp'
WHERE q.question_key = r.item->>'id'
  AND q.bank_id = b.id
  AND q.set_id = 'set_a'
  AND q.is_current = true;

-- Persist the exact v2 content that new learners will receive.
INSERT INTO public.question_versions (bank_id, question_key, version, content)
SELECT
  q.bank_id, q.question_key, q.version,
  jsonb_build_object(
    'id', q.question_key, 'type', q.type, 'domain', q.domain, 'prompt', q.prompt,
    'scenarioId', q.scenario_key, 'difficulty', q.difficulty,
    'tags', COALESCE(to_jsonb(q.tags), '[]'::jsonb), 'accessTier', q.access_tier,
    'setId', q.set_id, 'version', q.version, 'media', q.media,
    'payload', q.payload, 'answerKey', q.answer_key, 'explanation', q.explanation
  )
FROM public.questions q
JOIN public.question_banks b ON b.id = q.bank_id AND b.slug = 'pmp'
JOIN release_set_a_v2 r ON r.item->>'id' = q.question_key
WHERE q.set_id = 'set_a' AND q.is_current = true
ON CONFLICT (bank_id, question_key, version) DO NOTHING;

DO $$
DECLARE released_count INTEGER;
BEGIN
  SELECT count(*) INTO released_count
  FROM public.questions q
  JOIN public.question_banks b ON b.id = q.bank_id
  WHERE b.slug = 'pmp' AND q.set_id = 'set_a' AND q.is_current = true
    AND q.is_published = true AND q.content_released_at IS NOT NULL;
  IF released_count <> 180 THEN
    RAISE EXCEPTION 'Set A v2 post-release verification failed: expected 180 released rows, found %', released_count;
  END IF;
END $$;

COMMIT;
`;

if (output) {
  writeFileSync(output, sql, "utf8");
  console.log(`Wrote reviewed Set A v2 release SQL to ${output}`);
} else {
  process.stdout.write(sql);
}
