import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/src/admin/verifyAdminRequest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const verified = await verifyAdminRequest(req);
  if (!verified.ok) return verified.response;

  try {
    const { admin } = verified;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [posts, topics, assets, events, categories] = await Promise.all([
      admin.from("blog_posts").select("id,title,slug,status", { count: "exact", head: false }),
      admin.from("marketing_topics").select("id,status", { count: "exact", head: false }),
      admin.from("content_assets").select("id,channel,status", { count: "exact", head: false }),
      admin
        .from("marketing_events")
        .select("event_name,blog_post_id,created_at,properties")
        .in("event_name", ["blog_view", "blog_cta_click", "blog_scroll_depth", "blog_practice_answer", "blog_practice_check"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
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

    const postLookup = new Map((posts.data ?? []).map((post: any) => [post.id, post]));
    const blogEvents = events.data ?? [];
    const blogAnalytics = blogEvents.reduce(
      (acc: any, event: any) => {
        const eventName = event.event_name as string;
        if (eventName === "blog_view") acc.totals.views += 1;
        if (eventName === "blog_cta_click") acc.totals.ctaClicks += 1;
        if (eventName === "blog_practice_answer" || eventName === "blog_practice_check") acc.totals.practiceInteractions += 1;
        if (eventName === "blog_scroll_depth" && Number(event.properties?.depth ?? 0) >= 75) acc.totals.deepReads += 1;

        const postId = event.blog_post_id;
        if (postId) {
          const post = postLookup.get(postId);
          const row = acc.byPost[postId] ?? {
            blogPostId: postId,
            title: post?.title ?? event.properties?.title ?? "Untitled blog post",
            slug: post?.slug ?? event.properties?.slug ?? "",
            views: 0,
            ctaClicks: 0,
            practiceInteractions: 0,
            deepReads: 0,
          };
          if (eventName === "blog_view") row.views += 1;
          if (eventName === "blog_cta_click") row.ctaClicks += 1;
          if (eventName === "blog_practice_answer" || eventName === "blog_practice_check") row.practiceInteractions += 1;
          if (eventName === "blog_scroll_depth" && Number(event.properties?.depth ?? 0) >= 75) row.deepReads += 1;
          acc.byPost[postId] = row;
        }

        return acc;
      },
      {
        periodDays: 30,
        sessionIds: new Set<string>(),
        totals: { views: 0, uniqueSessions: 0, ctaClicks: 0, practiceInteractions: 0, deepReads: 0 },
        byPost: {} as Record<string, any>,
      }
    );
    for (const event of blogEvents) {
      const sessionId = typeof event.properties?.sessionId === "string" ? event.properties.sessionId : null;
      if (sessionId) blogAnalytics.sessionIds.add(sessionId);
    }
    blogAnalytics.totals.uniqueSessions = blogAnalytics.sessionIds.size;
    const topPosts = Object.values(blogAnalytics.byPost)
      .sort((a: any, b: any) => b.views - a.views || b.ctaClicks - a.ctaClicks)
      .slice(0, 5);

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
      blogAnalytics: {
        periodDays: blogAnalytics.periodDays,
        totals: blogAnalytics.totals,
        topPosts,
      },
      recentEvents: blogEvents.slice(0, 20),
      categories: categories.data ?? [],
    });
  } catch (err: any) {
    console.error("[marketing/overview] Error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
