import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/src/admin/verifyAdminRequest";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const verified = await verifyAdminRequest(req);
  if (!verified.ok) return verified.response;

  try {
    const body = await req.json();
    const action = body.action as string | undefined;
    const update: Record<string, unknown> = { updated_by: verified.userId };

    if (typeof body.body === "string") update.body = body.body;
    if (typeof body.title === "string") update.title = body.title;

    if (action === "approve") {
      update.status = "approved";
      update.approved_at = new Date().toISOString();
    } else if (action === "copied") {
      update.status = "copied";
      update.copied_at = new Date().toISOString();
    } else if (action === "manual_published") {
      update.status = "manual_published";
      update.manual_published_at = new Date().toISOString();
    }

    const { data, error } = await verified.admin
      .from("content_assets")
      .update(update)
      .eq("id", params.assetId)
      .select("*")
      .single();

    if (error) throw error;

    await verified.admin.from("marketing_events").insert({
      event_name: action ? `content_asset_${action}` : "content_asset_updated",
      entity_type: "content_asset",
      entity_id: params.assetId,
      blog_post_id: data.blog_post_id,
      content_asset_id: params.assetId,
      actor_id: verified.userId,
      properties: { channel: data.channel, variant: data.variant },
    });

    return NextResponse.json({ asset: data });
  } catch (err: any) {
    console.error("[marketing/asset] PATCH error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
