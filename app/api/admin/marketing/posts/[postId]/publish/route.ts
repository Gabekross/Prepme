import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/src/admin/verifyAdminRequest";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const verified = await verifyAdminRequest(req);
  if (!verified.ok) return verified.response;

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode === "schedule" ? "schedule" : "now";
    const now = new Date().toISOString();
    const scheduledFor = typeof body.scheduledFor === "string" ? body.scheduledFor : null;

    const update =
      mode === "schedule"
        ? { status: "scheduled", scheduled_for: scheduledFor, updated_by: verified.userId }
        : { status: "published", published_at: now, scheduled_for: null, updated_by: verified.userId };

    if (mode === "schedule" && !scheduledFor) {
      return NextResponse.json({ error: "scheduledFor is required" }, { status: 400 });
    }

    const { data, error } = await verified.admin
      .from("blog_posts")
      .update(update)
      .eq("id", params.postId)
      .select("*")
      .single();

    if (error) throw error;

    await Promise.all([
      verified.admin.from("publish_history").insert({
        entity_type: "blog_post",
        entity_id: params.postId,
        channel: "blog",
        action: mode === "schedule" ? "scheduled" : "published",
        performed_by: verified.userId,
        details: { slug: data.slug, scheduledFor },
      }),
      verified.admin.from("marketing_events").insert({
        event_name: mode === "schedule" ? "blog_post_scheduled" : "blog_post_published",
        entity_type: "blog_post",
        entity_id: params.postId,
        blog_post_id: params.postId,
        actor_id: verified.userId,
        properties: { slug: data.slug, scheduledFor },
      }),
    ]);

    return NextResponse.json({ post: data });
  } catch (err: any) {
    console.error("[marketing/publish] Error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
