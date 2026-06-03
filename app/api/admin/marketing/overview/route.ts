import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/src/admin/verifyAdminRequest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const verified = await verifyAdminRequest(req);
  if (!verified.ok) return verified.response;

  try {
    const { admin } = verified;
    const [posts, topics, assets, events, categories] = await Promise.all([
      admin.from("blog_posts").select("id,status", { count: "exact", head: false }),
      admin.from("marketing_topics").select("id,status", { count: "exact", head: false }),
      admin.from("content_assets").select("id,channel,status", { count: "exact", head: false }),
      admin
        .from("marketing_events")
        .select("event_name,created_at,properties")
        .order("created_at", { ascending: false })
        .limit(20),
      admin.from("blog_categories").select("id,name,slug").order("name"),
    ]);

    if (posts.error || topics.error || assets.error || events.error || categories.error) {
      throw new Error("Failed to load marketing overview");
    }

    const byStatus = (rows: any[] = []) =>
      rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1;
        return acc;
      }, {});

    return NextResponse.json({
      posts: {
        total: posts.count ?? posts.data?.length ?? 0,
        byStatus: byStatus(posts.data ?? []),
      },
      topics: {
        total: topics.count ?? topics.data?.length ?? 0,
        byStatus: byStatus(topics.data ?? []),
      },
      assets: {
        total: assets.count ?? assets.data?.length ?? 0,
        byStatus: byStatus(assets.data ?? []),
      },
      recentEvents: events.data ?? [],
      categories: categories.data ?? [],
    });
  } catch (err: any) {
    console.error("[marketing/overview] Error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
