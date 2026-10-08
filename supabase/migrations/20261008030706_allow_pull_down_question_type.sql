-- The 2026 PMP delivery engine types plus the legacy fill_blank type. The prior
-- constraint predated pull_down, so valid Set A v2 content was rejected.
-- Add first as NOT VALID so PostgreSQL immediately protects new writes, then
-- validate all existing rows before this migration completes.
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_type_check;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_type_check
  CHECK (type IN (
    'mcq_single',
    'mcq_multi',
    -- Legacy production questions use this type; retain it while the
    -- delivery engine's fill-in interaction is evaluated separately.
    'fill_blank',
    'pull_down',
    'dnd_match',
    'dnd_order',
    'hotspot'
  )) NOT VALID;

ALTER TABLE public.questions
  VALIDATE CONSTRAINT questions_type_check;
