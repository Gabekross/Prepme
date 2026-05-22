import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock fns ──────────────────────────────────────────────────────

const { mockGetUser, mockSelectRoles } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSelectRoles: vi.fn(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  supabaseFromToken: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
  supabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: mockSelectRoles,
        })),
      })),
    })),
  })),
}));

// ── Import after mocks ────────────────────────────────────────────────────

import { GET } from "../route";
import { NextRequest } from "next/server";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return new NextRequest("http://localhost:3000/api/admin/verify", {
    method: "GET",
    headers,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("GET /api/admin/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no Authorization header is provided", async () => {
    const req = makeRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when the token is invalid", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid JWT" },
    });

    const req = makeRequest("bad-token");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid token");
  });

  it("returns 403 when user has no admin role", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockSelectRoles.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const req = makeRequest("valid-token");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe("Forbidden");
  });

  it("returns 200 with isAdmin: true when user has admin role", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockSelectRoles.mockResolvedValueOnce({
      data: [{ role: "admin" }],
      error: null,
    });

    const req = makeRequest("valid-token");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isAdmin).toBe(true);
  });

  it("returns 500 when role query fails (does not leak error details)", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockSelectRoles.mockResolvedValueOnce({
      data: null,
      error: { message: "connection timeout at 10.0.0.5:5432" },
    });

    const req = makeRequest("valid-token");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
    expect(JSON.stringify(json)).not.toContain("10.0.0.5");
    expect(JSON.stringify(json)).not.toContain("connection timeout");
  });

  it("returns 500 on unexpected thrown error (does not leak details)", async () => {
    mockGetUser.mockRejectedValueOnce(
      new Error("Supabase SDK internal failure")
    );

    const req = makeRequest("valid-token");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
    expect(JSON.stringify(json)).not.toContain("Supabase SDK");
  });

  it("uses service-role client (supabaseAdmin) for role check, not user client", async () => {
    const { supabaseAdmin } = await import("@/lib/supabase/server");

    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockSelectRoles.mockResolvedValueOnce({
      data: [{ role: "admin" }],
      error: null,
    });

    const req = makeRequest("valid-token");
    await GET(req);

    // supabaseAdmin() should have been called to bypass RLS
    expect(supabaseAdmin).toHaveBeenCalled();
  });
});
