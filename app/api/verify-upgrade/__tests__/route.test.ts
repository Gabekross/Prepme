import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock fns (available inside vi.mock factories) ──────────────────

const { mockGetUser, mockSessionsList, mockMaybeSingle, mockInsert } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSessionsList: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockInsert: vi.fn(),
}));

// ── Module mocks ───────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  supabaseFromToken: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { list: mockSessionsList } };
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
      insert: mockInsert,
    })),
  })),
}));

// ── Import after mocks ─────────────────────────────────────────────────────

import { POST } from "../route";
import { NextRequest } from "next/server";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(opts: {
  token?: string;
  body?: Record<string, unknown>;
}): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  return new NextRequest("http://localhost:3000/api/verify-upgrade", {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body ?? {}),
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/verify-upgrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
  });

  it("returns 401 when no Authorization header is provided", async () => {
    const req = makeRequest({ body: { userId: "user-123" } });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when the token is invalid", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid JWT" },
    });

    const req = makeRequest({
      token: "bad-token",
      body: { userId: "user-123" },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid token");
  });

  it("returns 400 when userId is missing from body", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const req = makeRequest({ token: "valid-token", body: {} });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("userId required");
  });

  it("returns 403 when userId does not match authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const req = makeRequest({
      token: "valid-token",
      body: { userId: "different-user-456" },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe("Forbidden");
  });

  it("returns { isPro: false } when no matching Stripe session found", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockSessionsList.mockResolvedValueOnce({
      data: [
        {
          metadata: { supabase_user_id: "other-user" },
          payment_status: "paid",
        },
      ],
    });

    const req = makeRequest({
      token: "valid-token",
      body: { userId: "user-123" },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isPro).toBe(false);
  });

  it("returns { isPro: true } when matching Stripe session is found", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockSessionsList.mockResolvedValueOnce({
      data: [
        {
          metadata: { supabase_user_id: "user-123" },
          payment_status: "paid",
        },
      ],
    });

    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "existing-role" },
    });

    const req = makeRequest({
      token: "valid-token",
      body: { userId: "user-123" },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isPro).toBe(true);
  });

  it("does not leak internal error messages", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockSessionsList.mockRejectedValueOnce(
      new Error("Stripe API key expired: sk_test_REDACTED")
    );

    const req = makeRequest({
      token: "valid-token",
      body: { userId: "user-123" },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
    expect(json.error).not.toContain("Stripe API key");
    expect(json.error).not.toContain("sk_test");
  });
});
