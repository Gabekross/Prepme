import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/src/admin/verifyAdminRequest";
import { generateMarketingContent } from "@/src/marketing/generator";
import { withFallbackSlug } from "@/src/marketing/slug";

export const dynamic = "force-dynamic";

async function uniqueSlug(admin: any, table: string, base: string) {
  const cleanBase = withFallbackSlug(base);
  let candidate = cleanBase;
  let suffix = 2;

  while (true) {
    const { data, error } = await admin
      .from(table)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;
    candidate = `${cleanBase}-${suffix}`;
    suffix += 1;
  }
}

async function ensureTags(admin: any, postId: string, tags: string[]) {
  const normalized = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 12);
  for (const tag of normalized) {
    const slug = withFallbackSlug(tag);
    const { data: existing } = await admin
      .from("blog_tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    let tagId = existing?.id;
    if (!tagId) {
      const { data: inserted, error } = await admin
        .from("blog_tags")
        .insert({ name: tag, slug })
        .select("id")
        .single();
      if (error) throw error;
      tagId = inserted.id;
    }

    await admin
      .from("blog_post_tags")
      .upsert({ post_id: postId, tag_id: tagId }, { onConflict: "post_id,tag_id" });
  }
}

export async function POST(req: NextRequest) {
  const verified = await verifyAdminRequest(req);
  if (!verified.ok) return verified.response;

  try {
    const body = await req.json();
    const topicInput = String(body.topic ?? "").trim();
    if (topicInput.length < 3) {
      return NextResponse.json({ error: "Topic must be at least 3 characters" }, { status: 400 });
    }

    const primaryKeyword = typeof body.primaryKeyword === "string" ? body.primaryKeyword.trim() : "";
    const theme = typeof body.theme === "string" ? body.theme.trim() : "";
    const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null;

    const { content, model, promptVersion, usedFallback } = await generateMarketingContent({
      topic: topicInput,
      primaryKeyword,
      theme,
    });

    const admin = verified.admin;
    const topicSlug = await uniqueSlug(admin, "marketing_topics", content.topic.title);
    const postSlug = await uniqueSlug(admin, "blog_posts", content.blog.slug || content.blog.title);

    const { data: topic, error: topicError } = await admin
      .from("marketing_topics")
      .insert({
        title: content.topic.title,
        slug: topicSlug,
        theme: content.topic.theme,
        primary_keyword: content.topic.primaryKeyword,
        secondary_keywords: content.topic.secondaryKeywords,
        intent: content.topic.intent,
        status: "generated",
        created_by: verified.userId,
      })
      .select("*")
      .single();

    if (topicError) throw topicError;

    const { data: post, error: postError } = await admin
      .from("blog_posts")
      .insert({
        topic_id: topic.id,
        category_id: categoryId,
        title: content.blog.title,
        slug: postSlug,
        excerpt: content.blog.excerpt,
        content_markdown: content.blog.contentMarkdown,
        status: "review",
        seo_title: content.blog.seoTitle,
        seo_description: content.blog.seoDescription,
        focus_keyword: content.blog.focusKeyword,
        og_title: content.blog.seoTitle,
        og_description: content.blog.seoDescription,
        canonical_url: `/blog/${postSlug}`,
        created_by: verified.userId,
        updated_by: verified.userId,
      })
      .select("*")
      .single();

    if (postError) throw postError;

    await ensureTags(admin, post.id, content.blog.tags);

    const assets = content.assets.map((asset) => ({
      topic_id: topic.id,
      blog_post_id: post.id,
      channel: asset.channel,
      variant: asset.variant,
      title: asset.title ?? null,
      body: asset.body,
      status: "review",
      metadata: {
        model,
        promptVersion,
        usedFallback,
        source: "content_pyramid",
      },
      created_by: verified.userId,
      updated_by: verified.userId,
    }));

    const { data: insertedAssets, error: assetsError } = await admin
      .from("content_assets")
      .insert(assets)
      .select("*");

    if (assetsError) throw assetsError;

    await Promise.all([
      admin.from("blog_post_versions").insert({
        post_id: post.id,
        version_number: 1,
        title: post.title,
        excerpt: post.excerpt,
        content_markdown: post.content_markdown,
        seo_title: post.seo_title,
        seo_description: post.seo_description,
        prompt_version: promptVersion,
        model,
        created_by: verified.userId,
      }),
      admin.from("marketing_events").insert({
        event_name: "content_pyramid_generated",
        entity_type: "blog_post",
        entity_id: post.id,
        blog_post_id: post.id,
        actor_id: verified.userId,
        properties: {
          topic: topic.title,
          model,
          promptVersion,
          usedFallback,
          assetCount: insertedAssets?.length ?? 0,
        },
      }),
    ]);

    return NextResponse.json({
      topic,
      post,
      assets: insertedAssets ?? [],
      generation: { model, promptVersion, usedFallback },
    });
  } catch (err: any) {
    console.error("[marketing/generate] Error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
