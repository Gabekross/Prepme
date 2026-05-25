import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock fns ──────────────────────────────────────────────────────

const {
  mockGetUser,
  mockSelectAdminRole,
  mockListUsers,
  mockSelectRolesIn,
  mockSelectExisting,
  mockInsertRole,
  mockDeleteRole,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSelectAdminRole: vi.fn(),
  mockListUsers: vi.fn(),
  mockSelectRolesIn: vi.fn(),
  mockSelectExisting: vi.fn(),
  mockInsertRole: vi.fn(),
  mockDeleteRole: vi.fn(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  supabaseFromToken: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
  supabaseAdmin: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "user_roles") {
        return {
          select: vi.fn((cols: string) => {
            // admin role check: .select("role").eq(uid).eq("admin")
            if (cols === "role") {
              return {
                eq: vi.fn(() => ({
                  eq: mockSelectAdminRole,
                })),
              };
            }
            // roles by user_id list: .select("user_id, role").in(...)
            if (cols === "user_id, role") {
              return { in: mockSelectRolesIn };
            }
            // existing check: .select("id").eq().eq().maybeSingle()
            if (cols === "id") {
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: mockSelectExisting,
                  })),
                })),
              };
            }
            return { eq: vi.fn(() => ({ eq: mockSelectAdminRole })) };
          }),
          insert: mockInsertRole,
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: mockDeleteRole,
            })),
          })),
        };
      }
      return {};
    }),
    auth: {
      admin: { listUsers: mockListUsers },
    },
  })),
}));

// ── Import after mocks ────────────────────────────────────────────────────

import { GET, POST } from "../route";
import { NextRequest } from "next/server";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeGetRequest(email?: string, token?: string): NextRequest {
  const url = email
    ? `http://localhost:3000/api/admin/users?email=${encodeURIComponent(email)}`
    : "http://localhost:3000/api/admin/users";
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return new NextRequest(url, { method: "GET", headers });
}

function makePostRequest(
  body: Record<string, unknown>,
  token?: string
): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return new NextRequest("http://localhost:3000/api/admin/users", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function setupAdmin() {
  mockGetUser.mockResolvedValueOnce({
    data: { user: { id: "admin-1" } },
    error: null,
  });
  mockSelectAdminRole.mockResolvedValueOnce({
    data: [{ role: "admin" }],
    error: null,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("GET /api/admin/users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without token", async () => {
    const res = await GET(makeGetRequest("test@example.com"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSelectAdminRole.mockResolvedValueOnce({ data: [], error: null });

    const res = await GET(makeGetRequest("test@example.com", "token"));
    expect(res.status).toBe(403);
  });

  it("returns 400 for short query", async () => {
    setupAdmin();
    const res = await GET(makeGetRequest("a", "token"));
    expect(res.status).toBe(400);
  });

  it("returns matched users with roles", async () => {
    setupAdmin();

    mockListUsers.mockResolvedValueOnce({
      data: {
        users: [
          { id: "u1", email: "test@example.com", created_at: "2025-01-01", last_sign_in_at: null },
        ],
      },
      error: null,
    });

    mockSelectRolesIn.mockResolvedValueOnce({
      data: [{ user_id: "u1", role: "pro" }],
      error: null,
    });

    const res = await GET(makeGetRequest("test@example.com", "token"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.users).toHaveLength(1);
    expect(json.users[0].email).toBe("test@example.com");
    expect(json.users[0].roles).toEqual(["pro"]);
  });
});

describe("POST /api/admin/users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without token", async () => {
    const res = await POST(
      makePostRequest({ userId: "u1", role: "admin", action: "grant" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid role", async () => {
    setupAdmin();
    const res = await POST(
      makePostRequest(
        { userId: "u1", role: "superadmin", action: "grant" },
        "token"
      )
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("admin");
  });

  it("prevents self-lockout (cannot revoke own admin)", async () => {
    setupAdmin();
    const res = await POST(
      makePostRequest(
        { userId: "admin-1", role: "admin", action: "revoke" },
        "token"
      )
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("cannot revoke your own");
  });

  it("grants a role successfully", async () => {
    setupAdmin();
    mockSelectExisting.mockResolvedValueOnce({ data: null });
    mockInsertRole.mockResolvedValueOnce({ error: null });

    const res = await POST(
      makePostRequest(
        { userId: "u2", role: "admin", action: "grant" },
        "token"
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockInsertRole).toHaveBeenCalledWith({
      user_id: "u2",
      role: "admin",
    });
  });

  it("returns ok if role already assigned", async () => {
    setupAdmin();
    mockSelectExisting.mockResolvedValueOnce({ data: { id: "existing" } });

    const res = await POST(
      makePostRequest(
        { userId: "u2", role: "pro", action: "grant" },
        "token"
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.message).toContain("already");
  });

  it("revokes a role successfully", async () => {
    setupAdmin();
    mockDeleteRole.mockResolvedValueOnce({ error: null });

    const res = await POST(
      makePostRequest(
        { userId: "u2", role: "pro", action: "revoke" },
        "token"
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.message).toContain("Revoked");
  });
});
