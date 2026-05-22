import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/webhook
 *
 * Stripe webhook endpoint.
 * - checkout.session.completed  → grant pro role
 * - customer.subscription.updated → revoke if status becomes past_due/unpaid/canceled
 * - customer.subscription.deleted → revoke pro role
 * - invoice.payment_failed → revoke pro role
 * - invoice.paid → re-grant pro role (covers renewal recovery)
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

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;

    if (!userId) {
      console.error("No supabase_user_id in session metadata");
      return NextResponse.json({ error: "No user ID" }, { status: 400 });
    }

    await grantPro(sb, userId);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const status = subscription.status;
    const userId = await resolveUserId(stripe, sb, subscription.customer as string);
    if (userId) {
      if (status === "active" || status === "trialing") {
        await grantPro(sb, userId);
      } else if (status === "past_due" || status === "unpaid" || status === "canceled") {
        await revokePro(sb, userId);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = await resolveUserId(stripe, sb, subscription.customer as string);
    if (userId) await revokePro(sb, userId);
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const userId = await resolveUserId(stripe, sb, invoice.customer as string);
    if (userId) await revokePro(sb, userId);
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_update") {
      const userId = await resolveUserId(stripe, sb, invoice.customer as string);
      if (userId) await grantPro(sb, userId);
    }
  }

  return NextResponse.json({ received: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function grantPro(sb: any, userId: string) {
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
      return;
    }
    console.log(`Pro role granted to user ${userId}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function revokePro(sb: any, userId: string) {
  const { error } = await sb
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", "pro");

  if (error) {
    console.error("Failed to revoke pro role:", error);
    return;
  }
  console.log(`Pro role revoked for user ${userId}`);
}

/**
 * Resolve a Stripe customer ID to a Supabase user ID.
 *
 * SECURITY: Uses paginated listUsers with a per_page limit of 1 instead of
 * loading ALL users into memory. This prevents memory exhaustion as the user
 * base grows and reduces the blast radius of any logging/error bugs.
 */
async function resolveUserId(
  stripeClient: Stripe,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  customerId: string
): Promise<string | null> {
  const customer = await stripeClient.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) return null;

  // Look up by email using a targeted filter instead of fetching all users
  const { data, error } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 1,
    filter: customer.email,
  });

  if (error) {
    console.error("Failed to look up user by email:", error.message);
    return null;
  }

  // The filter may return partial matches — verify exact email match
  const match = (data?.users ?? []).find(
    (u: any) => u.email?.toLowerCase() === customer.email!.toLowerCase()
  );

  if (!match) {
    console.error("No Supabase user found for Stripe customer");
    return null;
  }
  return match.id;
}
