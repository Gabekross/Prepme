import { NextRequest, NextResponse } from "next/server";
import { supabaseFromToken, supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Verify the caller is an admin. Returns { admin, userId } or an error response.
 */
async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userSb = supabaseFromToken(token);
  const { data: userData, error: userError } = await userSb.auth.getUser();

  if (userError || !userData.user) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }

  const admin = supabaseAdmin();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin");

  if (!roles?.length) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { admin, userId: userData.user.id };
}

/**
 * GET /api/admin/users?email=search@term
 *
 * Search users by email (partial match). Returns user info + roles.
 * Requires admin auth.
 */
export async function GET(req: NextRequest) {
  try {
    const result = await verifyAdmin(req);
    if ("error" in result) return result.error;
    const { admin } = result;

    const email = req.nextUrl.searchParams.get("email")?.trim();

    if (!email || email.length < 2) {
      return NextResponse.json(
        { error: "Provide at least 2 characters to search" },
        { status: 400 }
      );
    }

    // Fetch users matching the email filter
    // Cast to any to use the undocumented 'filter' param (works at runtime,
    // same pattern as webhook/route.ts resolveUserId)
    const { data: usersData, error: listErr } = await (admin.auth.admin as any).listUsers({
      page: 1,
      perPage: 20,
      filter: email,
    });

    if (listErr) {
      console.error("Admin user search error:", listErr.message);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const users = usersData?.users ?? [];

    // Filter for exact substring match (Supabase filter can be loose)
    const matched = users.filter(
      (u: any) => u.email?.toLowerCase().includes(email.toLowerCase())
    );

    if (matched.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Fetch roles for matched users
    const userIds = matched.map((u: any) => u.id);
    const { data: roles } = await admin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const roleMap: Record<string, string[]> = {};
    for (const r of roles ?? []) {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    }

    const result2 = matched.map((u: any) => ({
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
      roles: roleMap[u.id] ?? [],
    }));

    return NextResponse.json({ users: result2 });
  } catch (err: any) {
    console.error("Admin users GET error:", err?.message ?? "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 *
 * Grant or revoke a role for a user.
 * Body: { userId: string, role: "admin" | "pro", action: "grant" | "revoke" }
 * Requires admin auth.
 *
 * SAFETY: An admin cannot revoke their own admin role (prevents lockout).
 */
export async function POST(req: NextRequest) {
  try {
    const result = await verifyAdmin(req);
    if ("error" in result) return result.error;
    const { admin, userId: callerUserId } = result;

    const body = await req.json();
    const { userId, role, action } = body as {
      userId?: string;
      role?: string;
      action?: string;
    };

    if (!userId || !role || !action) {
      return NextResponse.json(
        { error: "userId, role, and action are required" },
        { status: 400 }
      );
    }

    if (!["admin", "pro"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'pro'" },
        { status: 400 }
      );
    }

    if (!["grant", "revoke"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'grant' or 'revoke'" },
        { status: 400 }
      );
    }

    // Prevent self-lockout
    if (action === "revoke" && role === "admin" && userId === callerUserId) {
      return NextResponse.json(
        { error: "You cannot revoke your own admin role" },
        { status: 400 }
      );
    }

    if (action === "grant") {
      // Check if role already exists
      const { data: existing } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", role)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ ok: true, message: "Role already assigned" });
      }

      const { error: insertErr } = await admin
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (insertErr) {
        console.error("Grant role error:", insertErr.message);
        return NextResponse.json({ error: "Failed to grant role" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, message: `Granted ${role} to user` });
    }

    if (action === "revoke") {
      const { error: deleteErr } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (deleteErr) {
        console.error("Revoke role error:", deleteErr.message);
        return NextResponse.json({ error: "Failed to revoke role" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, message: `Revoked ${role} from user` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin users POST error:", err?.message ?? "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
