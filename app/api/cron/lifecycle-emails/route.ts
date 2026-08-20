import { NextRequest, NextResponse } from "next/server";
import { runLifecycleEmailAutomation } from "@/lib/email/lifecycle";

export const dynamic = "force-dynamic";

async function handleLifecycleEmailCron(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runLifecycleEmailAutomation();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[cron/lifecycle-emails] Error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleLifecycleEmailCron(req);
}

export async function POST(req: NextRequest) {
  return handleLifecycleEmailCron(req);
}
