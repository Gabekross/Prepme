import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedEvents = new Set([
  "blog_view",
  "blog_cta_click",
  "blog_scroll_depth",
  "blog_practice_answer",
  "blog_practice_check",
]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanProperties(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" || entry === null)
    .slice(0, 24);
  return Object.fromEntries(entries);
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const eventName = typeof body?.eventName === "string" ? body.eventName : "";
    const blogPostId = typeof body?.blogPostId === "string" ? body.blogPostId : "";

    if (!allowedEvents.has(eventName)) {
      return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
    }

    if (!uuidPattern.test(blogPostId)) {
      return NextResponse.json({ error: "Invalid blog post" }, { status: 400 });
    }

    const properties = {
      ...cleanProperties(body?.properties),
      endpoint_path: req.nextUrl.pathname,
      source: "first_party_blog",
    };

    const { error } = await supabaseAdmin().from("marketing_events").insert({
      event_name: eventName,
      entity_type: "blog_post",
      entity_id: blogPostId,
      blog_post_id: blogPostId,
      properties,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[marketing/events] Error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
