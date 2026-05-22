import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabaseFromToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/verify-upgrade
 *
 * Backup verification: searches recent Stripe checkout sessions for one
 * matching this user, then grants pro role if found. Covers cases where
 * the webhook is delayed or misconfigured.
 *
 * SECURITY: Requires Bearer token auth. The authenticated user's ID must
 * match the userId in the request body to prevent privilege escalation.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth gate ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userSb = supabaseFromToken(token);
    const { data: userData, error: userError } = await userSb.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ── Parse & validate body ──────────────────────────────────────────
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Ensure the caller can only verify their own upgrade status
    if (userId !== userData.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Stripe lookup ──────────────────────────────────────────────────
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

    // ── Grant pro role in Supabase ─────────────────────────────────────
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
        console.error("Failed to insert pro role:", error?.message ?? "unknown");
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    return NextResponse.json({ isPro: true });
  } catch (err: any) {
    console.error("Verify upgrade error:", err?.message ?? "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
