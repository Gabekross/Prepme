export type BlogStatus = "draft" | "review" | "approved" | "scheduled" | "published" | "archived";

export type ContentAssetChannel =
  | "master_article"
  | "blog"
  | "threads"
  | "linkedin"
  | "x"
  | "facebook"
  | "newsletter";

export type ContentAssetStatus =
  | "draft"
  | "review"
  | "approved"
  | "copied"
  | "manual_published"
  | "scheduled"
  | "published"
  | "archived";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type BlogPost = {
  id: string;
  topic_id: string | null;
  category_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content_markdown: string;
  status: BlogStatus;
  featured_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  related_post_ids: string[];
  scheduled_for: string | null;
  published_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  blog_categories?: BlogCategory | null;
};

export type ContentAsset = {
  id: string;
  topic_id: string | null;
  blog_post_id: string | null;
  channel: ContentAssetChannel;
  variant: number;
  title: string | null;
  body: string;
  status: ContentAssetStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GeneratedMarketingContent = {
  topic: {
    title: string;
    theme: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    intent: string;
  };
  blog: {
    title: string;
    slug: string;
    excerpt: string;
    contentMarkdown: string;
    seoTitle: string;
    seoDescription: string;
    focusKeyword: string;
    tags: string[];
  };
  assets: Array<{
    channel: ContentAssetChannel;
    variant: number;
    title?: string | null;
    body: string;
  }>;
};
