import { supabaseAdmin } from "@/lib/supabase/server";
import type { BlogPost } from "./types";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pmpmasterylab.com").replace(/\/$/, "");
}

export async function listPublishedPosts(limit = 50): Promise<BlogPost[]> {
  const { data, error } = await supabaseAdmin()
    .from("blog_posts")
    .select("*, blog_categories(id,name,slug,description)")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[blog] Failed to list posts:", error.message);
    return [];
  }

  return (data ?? []) as BlogPost[];
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabaseAdmin()
    .from("blog_posts")
    .select("*, blog_categories(id,name,slug,description)")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("[blog] Failed to load post:", error.message);
    return null;
  }

  return (data as BlogPost | null) ?? null;
}

export async function listRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const now = new Date().toISOString();
  let posts: BlogPost[] = [];

  if (post.category_id) {
    const { data, error } = await supabaseAdmin()
      .from("blog_posts")
      .select("*, blog_categories(id,name,slug,description)")
      .eq("status", "published")
      .lte("published_at", now)
      .eq("category_id", post.category_id)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[blog] Failed to list related category posts:", error.message);
    } else {
      posts = (data ?? []) as BlogPost[];
    }
  }

  if (posts.length < limit) {
    const { data, error } = await supabaseAdmin()
      .from("blog_posts")
      .select("*, blog_categories(id,name,slug,description)")
      .eq("status", "published")
      .lte("published_at", now)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[blog] Failed to list fallback related posts:", error.message);
      return posts;
    }

    const seen = new Set(posts.map((item) => item.id));
    for (const item of (data ?? []) as BlogPost[]) {
      if (!seen.has(item.id)) posts.push(item);
      if (posts.length >= limit) break;
    }
  }

  return posts;
}
