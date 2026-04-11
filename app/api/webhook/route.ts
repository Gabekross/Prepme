import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/webhook
 *
 * Stripe webhook endpoint. Handles checkout.session.completed events.
 * On successful payment, inserts "pro" role into user_roles table.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;

    if (!userId) {
      console.error("No supabase_user_id in session metadata");
      return NextResponse.json({ error: "No user ID" }, { status: 400 });
    }

    // Grant Pro role
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if already has pro role (idempotent)
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

      console.log(`Pro role granted to user ${userId}`);
    } else {
      console.log(`User ${userId} already has pro role`);
    }
  }

  return NextResponse.json({ received: true });
}
