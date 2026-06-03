-- ============================================================================
-- Marketing Hub: blog-first content, SEO, and repurposed channel assets
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.marketing_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE TABLE IF NOT EXISTS marketing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'archived')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES content_campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  theme TEXT,
  primary_keyword TEXT,
  secondary_keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  audience TEXT NOT NULL DEFAULT 'PMP candidates',
  intent TEXT,
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'generated', 'approved', 'published', 'archived')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES marketing_topics(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES content_campaigns(id) ON DELETE SET NULL,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content_markdown TEXT NOT NULL DEFAULT '',
  content_html_cache TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'published', 'archived')),
  featured_image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  focus_keyword TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  related_post_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content_markdown, '')), 'C')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_post_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_markdown TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  prompt_version TEXT,
  model TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, version_number)
);

CREATE TABLE IF NOT EXISTS marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES marketing_topics(id) ON DELETE SET NULL,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('master_article', 'blog', 'threads', 'linkedin', 'x', 'facebook', 'newsletter')),
  variant INTEGER NOT NULL DEFAULT 1,
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'approved', 'copied', 'manual_published', 'scheduled', 'published', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_at TIMESTAMPTZ,
  copied_at TIMESTAMPTZ,
  manual_published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blog_post_id, channel, variant)
);

CREATE TABLE IF NOT EXISTS publish_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('blog_post', 'content_asset')),
  entity_id UUID NOT NULL,
  channel TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'succeeded'
    CHECK (status IN ('succeeded', 'failed')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  content_asset_id UUID REFERENCES content_assets(id) ON DELETE SET NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_topics_status ON marketing_topics(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_topics_keyword ON marketing_topics(primary_keyword);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_content_assets_post_channel ON content_assets(blog_post_id, channel, status);
CREATE INDEX IF NOT EXISTS idx_marketing_events_entity ON marketing_events(entity_type, entity_id, created_at DESC);

CREATE TRIGGER trg_marketing_settings_updated_at
  BEFORE UPDATE ON marketing_settings
  FOR EACH ROW EXECUTE FUNCTION public.marketing_touch_updated_at();

CREATE TRIGGER trg_content_campaigns_updated_at
  BEFORE UPDATE ON content_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.marketing_touch_updated_at();

CREATE TRIGGER trg_marketing_topics_updated_at
  BEFORE UPDATE ON marketing_topics
  FOR EACH ROW EXECUTE FUNCTION public.marketing_touch_updated_at();

CREATE TRIGGER trg_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.marketing_touch_updated_at();

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.marketing_touch_updated_at();

CREATE TRIGGER trg_marketing_templates_updated_at
  BEFORE UPDATE ON marketing_templates
  FOR EACH ROW EXECUTE FUNCTION public.marketing_touch_updated_at();

CREATE TRIGGER trg_content_assets_updated_at
  BEFORE UPDATE ON content_assets
  FOR EACH ROW EXECUTE FUNCTION public.marketing_touch_updated_at();

ALTER TABLE marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage marketing settings" ON marketing_settings
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins manage campaigns" ON content_campaigns
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins manage topics" ON marketing_topics
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Public reads blog categories" ON blog_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins manage blog categories" ON blog_categories
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Public reads blog tags" ON blog_tags
  FOR SELECT USING (true);
CREATE POLICY "Admins manage blog tags" ON blog_tags
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Public reads published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published' AND published_at <= now());
CREATE POLICY "Admins manage blog posts" ON blog_posts
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Public reads published blog post tags" ON blog_post_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_tags.post_id
        AND blog_posts.status = 'published'
        AND blog_posts.published_at <= now()
    )
  );
CREATE POLICY "Admins manage blog post tags" ON blog_post_tags
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins manage blog post versions" ON blog_post_versions
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins manage marketing templates" ON marketing_templates
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins manage content assets" ON content_assets
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins manage publish history" ON publish_history
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins manage marketing events" ON marketing_events
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

INSERT INTO blog_categories (name, slug, description)
VALUES
  ('PMP Exam Prep', 'pmp-exam-prep', 'Study strategies, exam readiness, and PMP preparation guidance.'),
  ('PMI Mindset', 'pmi-mindset', 'Decision-making patterns and professional judgment for PMP candidates.'),
  ('Agile and Hybrid', 'agile-hybrid', 'Agile, hybrid, and adaptive delivery topics for the PMP exam.'),
  ('Leadership', 'leadership', 'Servant leadership, team performance, and stakeholder engagement.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO marketing_settings (key, value)
VALUES (
  'brand_voice',
  '{
    "audience": "PMP candidates preparing for the exam",
    "tone": "clear, confident, practical, supportive",
    "rules": [
      "Do not imply PMI endorsement.",
      "Do not guarantee exam results.",
      "Prefer practical examples and PMP-style decision framing.",
      "Make the blog article the source of truth for derived channel content."
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
