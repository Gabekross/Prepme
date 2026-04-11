import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/verify-upgrade
 *
 * Backup verification: searches recent Stripe checkout sessions for one
 * matching this user, then grants pro role if found. Covers cases where
 * the webhook is delayed or misconfigured.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // List recent completed checkout sessions (last 20)
    const sessions = await stripe.checkout.sessions.list({
      status: "complete",
      limit: 20,
    });

    // Find one that matches this user via metadata
    const match = sessions.data.find(
      (s) => s.metadata?.supabase_user_id === userId && s.payment_status === "paid"
    );

    if (!match) {
      return NextResponse.json({ isPro: false });
    }

    // Grant pro role in Supabase
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await sb
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "pro")
      .maybeSingle();

    if (!existing) {
      const { error } = await sb
        .from("user_roles")
        .insert({ user_id: userId, role: "pro" });

      if (error) {
        console.error("Failed to insert pro role:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      console.log(`Pro role granted to user ${userId} via verify-upgrade`);
    }

    return NextResponse.json({ isPro: true });
  } catch (err: any) {
    console.error("Verify upgrade error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
