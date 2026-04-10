import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — currently a pass-through.
 *
 * Auth protection is handled client-side via the <RequireAuth> wrapper
 * because the Supabase JS client stores sessions in localStorage (not cookies),
 * making server-side session checks unreliable without @supabase/ssr.
 *
 * This middleware is kept as a placeholder for future needs (rate limiting,
 * geo-blocking, cookie-based auth when @supabase/ssr is added, etc.).
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
