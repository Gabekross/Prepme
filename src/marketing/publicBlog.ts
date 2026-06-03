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
