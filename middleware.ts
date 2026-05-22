import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — adds security headers to all responses.
 *
 * Auth protection is handled client-side via the <RequireAuth> wrapper
 * because the Supabase JS client stores sessions in localStorage (not cookies),
 * making server-side session checks unreliable without @supabase/ssr.
 */

// ── Content-Security-Policy ────────────────────────────────────────────────
// Built from the app's actual external dependencies:
//   - Google Fonts (fonts.googleapis.com, fonts.gstatic.com)
//   - Supabase Auth + API (*.supabase.co)
//   - styled-components injects <style> tags → requires 'unsafe-inline' for style-src
//   - Next.js injects inline scripts → requires 'unsafe-inline' for script-src
//   - Data URIs used in CSS background-image for inline SVGs
//
// NOTE: 'unsafe-inline' for script-src weakens XSS protection. When the app
// migrates to @next/headers nonce support, replace with 'nonce-<value>'.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://*.supabase.co",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  // ── Content-Security-Policy ───────────────────────────────────────────
  res.headers.set("Content-Security-Policy", cspDirectives);

  // Prevent MIME-type sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking (CSP frame-ancestors supersedes this, but kept for
  // older browsers that don't support CSP level 2)
  res.headers.set("X-Frame-Options", "DENY");

  // Control referrer leakage
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Force HTTPS (browsers cache this for 1 year)
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Prevent XSS reflection (legacy header, still useful for older browsers)
  res.headers.set("X-XSS-Protection", "1; mode=block");

  return res;
}

export const config = {
  // Apply to all routes except static assets and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
