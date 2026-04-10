import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /auth/callback
 *
 * Handles Supabase email confirmation and password reset redirects.
 *
 * When a user clicks a confirmation or reset link in their email,
 * Supabase redirects to this route with either:
 *   - A `code` param (PKCE flow — preferred, used by newer Supabase)
 *   - Hash fragments with `access_token` and `refresh_token` (implicit flow)
 *
 * This route exchanges the code for a session, then redirects the user
 * to the appropriate page.
 *
 * Query params:
 *   - code: The auth code from Supabase email link
 *   - next: Where to redirect after successful auth (default: /bank/pmp)
 *   - error: Error from Supabase (if any)
 *   - error_description: Human-readable error message
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/bank/pmp";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // If Supabase sent an error, redirect to login with the error
  if (error) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", errorDescription ?? error);
    return NextResponse.redirect(loginUrl);
  }

  // Exchange the code for a session
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { flowType: "pkce" },
    });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }

    // Success — redirect to the intended destination
    const destination = new URL(next, req.url);
    return NextResponse.redirect(destination);
  }

  // No code provided — this might be the implicit flow where tokens are in
  // the hash fragment. The hash is not sent to the server, so we need a
  // client-side page to handle it. Redirect to a client handler.
  // For most Supabase setups with PKCE, the code path above handles it.
  const destination = new URL(next, req.url);
  return NextResponse.redirect(destination);
}
