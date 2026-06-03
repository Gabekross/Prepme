import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/src/admin/verifyAdminRequest";
import { withFallbackSlug } from "@/src/marketing/slug";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const verified = await verifyAdminRequest(req);
  if (!verified.ok) return verified.response;

  try {
    const [postRes, assetsRes] = await Promise.all([
      verified.admin
        .from("blog_posts")
        .select("*, blog_categories(id,name,slug)")
        .eq("id", params.postId)
        .single(),
      verified.admin
        .from("content_assets")
        .select("*")
        .eq("blog_post_id", params.postId)
        .order("channel")
        .order("variant"),
    ]);

    if (postRes.error) throw postRes.error;
    if (assetsRes.error) throw assetsRes.error;

    return NextResponse.json({ post: postRes.data, assets: assetsRes.data ?? [] });
  } catch (err: any) {
    console.error("[marketing/post] GET error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const verified = await verifyAdminRequest(req);
  if (!verified.ok) return verified.response;

  try {
    const body = await req.json();
    const update: Record<string, unknown> = {
      updated_by: verified.userId,
    };

    for (const key of [
      "title",
      "excerpt",
      "content_markdown",
      "category_id",
      "featured_image_url",
      "seo_title",
      "seo_description",
      "focus_keyword",
      "canonical_url",
      "og_title",
      "og_description",
      "og_image_url",
    ]) {
      if (key in body) update[key] = body[key];
    }

    if (typeof body.slug === "string") update.slug = withFallbackSlug(body.slug);
    if (body.status === "approved") {
      update.status = "approved";
      update.approved_at = new Date().toISOString();
    }

    const { data, error } = await verified.admin
      .from("blog_posts")
      .update(update)
      .eq("id", params.postId)
      .select("*")
      .single();

    if (error) throw error;

    await verified.admin.from("marketing_events").insert({
      event_name: "blog_post_updated",
      entity_type: "blog_post",
      entity_id: params.postId,
      blog_post_id: params.postId,
      actor_id: verified.userId,
      properties: { status: data.status },
    });

    return NextResponse.json({ post: data });
  } catch (err: any) {
    console.error("[marketing/post] PATCH error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
