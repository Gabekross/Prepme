import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — adds security headers to all responses.
 *
 * Auth protection is handled client-side via the <RequireAuth> wrapper
 * because the Supabase JS client stores sessions in localStorage (not cookies),
 * making server-side session checks unreliable without @supabase/ssr.
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  // Prevent MIME-type sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
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
