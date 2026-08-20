import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();

  if (!token || token.length < 24) {
    return new NextResponse("Invalid unsubscribe link.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const { error } = await supabaseAdmin()
    .from("email_subscriptions")
    .update({
      marketing_opted_out_at: new Date().toISOString(),
      lifecycle_opted_out_at: new Date().toISOString(),
    })
    .eq("unsubscribe_token", token);

  if (error) {
    console.error("[email/unsubscribe] Error:", error.message);
    return new NextResponse("Unable to unsubscribe right now.", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse("You have been unsubscribed from marketing and lifecycle emails.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
