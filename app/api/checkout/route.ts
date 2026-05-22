import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabaseFromToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session for the Premium subscription ($29.99 / 3 months).
 * Requires the user to be signed in (passes userId in metadata for webhook).
 *
 * SECURITY: Requires Bearer token auth. The authenticated user's ID must
 * match the userId in the request body to prevent checkout spoofing.
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
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Ensure the caller can only create checkout for themselves
    if (userId !== userData.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Verify the user exists via admin client ────────────────────────
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: user } = await sb.auth.admin.getUserById(userId);
    if (!user?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      customer_email: user.user.email,
      metadata: {
        supabase_user_id: userId,
      },
      success_url: `${origin}/bank/pmp?upgraded=true`,
      cancel_url: `${origin}/bank/pmp`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
