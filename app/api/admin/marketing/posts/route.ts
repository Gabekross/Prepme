import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/src/admin/verifyAdminRequest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const verified = await verifyAdminRequest(req);
  if (!verified.ok) return verified.response;

  try {
    const status = req.nextUrl.searchParams.get("status");
    let query = verified.admin
      .from("blog_posts")
      .select("*, blog_categories(id,name,slug)")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ posts: data ?? [] });
  } catch (err: any) {
    console.error("[marketing/posts] GET error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
