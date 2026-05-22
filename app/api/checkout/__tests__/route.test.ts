import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock fns (available inside vi.mock factories) ──────────────────

const { mockGetUser, mockCheckoutCreate, mockGetUserById } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCheckoutCreate: vi.fn(),
  mockGetUserById: vi.fn(),
}));

// ── Module mocks ───────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  supabaseFromToken: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: mockCheckoutCreate } };
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: { getUserById: mockGetUserById },
    },
  })),
}));

// ── Import after mocks ─────────────────────────────────────────────────────

import { POST } from "../route";
import { NextRequest } from "next/server";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(opts: {
  token?: string;
  body?: Record<string, unknown>;
  origin?: string;
}): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  if (opts.origin) headers["Origin"] = opts.origin;

  return new NextRequest("http://localhost:3000/api/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body ?? {}),
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    process.env.STRIPE_PRO_PRICE_ID = "price_test_123";
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
    expect(json.error).toBe("userId is required");
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

  it("returns 404 when user does not exist in Supabase", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockGetUserById.mockResolvedValueOnce({
      data: { user: null },
    });

    const req = makeRequest({
      token: "valid-token",
      body: { userId: "user-123" },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("User not found");
  });

  it("creates a checkout session and returns the URL for valid request", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockGetUserById.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });

    mockCheckoutCreate.mockResolvedValueOnce({
      url: "https://checkout.stripe.com/session/test_session",
    });

    const req = makeRequest({
      token: "valid-token",
      body: { userId: "user-123" },
      origin: "https://pmp-app.com",
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe("https://checkout.stripe.com/session/test_session");

    // Verify Stripe was called with the correct user metadata
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { supabase_user_id: "user-123" },
        customer_email: "test@example.com",
      })
    );
  });

  it("does not leak internal error messages on server error", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    mockGetUserById.mockRejectedValueOnce(
      new Error("Database connection refused at 10.0.0.5:5432")
    );

    const req = makeRequest({
      token: "valid-token",
      body: { userId: "user-123" },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
    expect(json.error).not.toContain("Database connection");
    expect(json.error).not.toContain("10.0.0.5");
  });
});
