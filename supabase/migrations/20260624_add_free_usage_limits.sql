-- Track free-plan usage so practice limits and the one-time Set A trial can be
-- enforced without repeatedly scanning large attempt state JSON.

CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_practice_questions_used INTEGER NOT NULL DEFAULT 0 CHECK (free_practice_questions_used >= 0),
  free_set_a_started_at TIMESTAMPTZ,
  free_set_a_attempt_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS free_practice_counted_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.update_user_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_usage_updated_at ON public.user_usage;
CREATE TRIGGER trg_user_usage_updated_at
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_usage_updated_at();

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
CREATE POLICY "Users can view own usage"
  ON public.user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Writes are performed through server routes with the service role key so free
-- usage cannot be reset or inflated from the browser.

CREATE OR REPLACE FUNCTION public.increment_free_practice_usage(
  p_user_id UUID,
  p_count INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, free_practice_questions_used)
  VALUES (p_user_id, GREATEST(0, p_count))
  ON CONFLICT (user_id)
  DO UPDATE SET
    free_practice_questions_used = public.user_usage.free_practice_questions_used + GREATEST(0, p_count),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
