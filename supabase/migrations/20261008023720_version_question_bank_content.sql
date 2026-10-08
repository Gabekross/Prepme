-- Immutable question-content snapshots make historical attempts reproducible.
-- The `questions` table continues to hold exactly one current row per question_key;
-- revisions are captured here before the current row is changed.
CREATE TABLE IF NOT EXISTS public.question_versions (
  bank_id UUID NOT NULL REFERENCES public.question_banks(id) ON DELETE RESTRICT,
  question_key TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bank_id, question_key, version)
);

ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.question_versions FROM anon, authenticated;

-- Existing questions are the first immutable version. This is idempotent so a
-- later migration/recovery run cannot overwrite an already-captured snapshot.
INSERT INTO public.question_versions (bank_id, question_key, version, content)
SELECT
  q.bank_id,
  q.question_key,
  COALESCE(q.version, 1),
  jsonb_build_object(
    'id', q.question_key,
    'type', q.type,
    'domain', q.domain,
    'prompt', q.prompt,
    'scenarioId', q.scenario_key,
    'difficulty', q.difficulty,
    'tags', COALESCE(to_jsonb(q.tags), '[]'::jsonb),
    'accessTier', q.access_tier,
    'setId', q.set_id,
    'version', COALESCE(q.version, 1),
    'media', q.media,
    'payload', q.payload,
    'answerKey', q.answer_key,
    'explanation', q.explanation
  )
FROM public.questions q
ON CONFLICT (bank_id, question_key, version) DO NOTHING;

-- These lifecycle fields are intentionally separate from question_versions:
-- they identify the one row available to a learner beginning a new attempt.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS content_released_at TIMESTAMPTZ;

UPDATE public.questions
SET is_current = true
WHERE is_current IS NULL;

CREATE INDEX IF NOT EXISTS question_versions_bank_key_version_idx
  ON public.question_versions (bank_id, question_key, version);

-- Matches the new-attempt loader: only a currently published item is eligible.
CREATE INDEX IF NOT EXISTS questions_current_published_bank_set_idx
  ON public.questions (bank_id, set_id)
  WHERE is_current = true AND is_published = true;
