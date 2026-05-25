import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock fns ──────────────────────────────────────────────────────

const {
  mockGetUser,
  mockSelectRoles,
  mockListUsers,
  mockSelectAttempts,
  mockSelectProRoles,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSelectRoles: vi.fn(),
  mockListUsers: vi.fn(),
  mockSelectAttempts: vi.fn(),
  mockSelectProRoles: vi.fn(),
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
            // Admin role check uses .eq().eq() chain
            if (cols === "role") {
              return {
                eq: vi.fn(() => ({
                  eq: mockSelectRoles,
                })),
              };
            }
            // Pro roles query uses .eq() single
            if (cols === "user_id") {
              return {
                eq: mockSelectProRoles,
              };
            }
            return { eq: vi.fn(() => ({ eq: mockSelectRoles })) };
          }),
        };
      }
      if (table === "attempts") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: mockSelectAttempts,
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

import { GET } from "../route";
import { NextRequest } from "next/server";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return new NextRequest("http://localhost:3000/api/admin/dashboard", {
    method: "GET",
    headers,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("GET /api/admin/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no Authorization header is provided", async () => {
    const req = makeRequest();
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid JWT" },
    });

    const req = makeRequest("bad-token");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not an admin", async () => {
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
    expect(res.status).toBe(403);
  });

  it("returns full dashboard data for admin user", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "admin-1" } },
      error: null,
    });

    // Admin role check
    mockSelectRoles.mockResolvedValueOnce({
      data: [{ role: "admin" }],
      error: null,
    });

    // listUsers (paginated)
    mockListUsers.mockResolvedValueOnce({
      data: {
        users: [
          { id: "u1", created_at: new Date().toISOString() },
          { id: "u2", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
          { id: "u3", created_at: new Date(Date.now() - 86400000 * 40).toISOString() },
        ],
      },
      error: null,
    });

    // Pro roles
    mockSelectProRoles.mockResolvedValueOnce({
      data: [{ user_id: "u1" }],
      error: null,
    });

    // Attempts
    const now = new Date().toISOString();
    mockSelectAttempts.mockResolvedValueOnce({
      data: [
        {
          id: "a1",
          user_id: "u1",
          mode: "practice",
          set_id: "free",
          status: "submitted",
          score_percent: 85,
          passed: true,
          created_at: now,
          submitted_at: now,
        },
        {
          id: "a2",
          user_id: "u2",
          mode: "exam",
          set_id: "set_a",
          status: "submitted",
          score_percent: 60,
          passed: false,
          created_at: now,
          submitted_at: now,
        },
        {
          id: "a3",
          user_id: "u1",
          mode: "practice",
          set_id: "free",
          status: "abandoned",
          score_percent: null,
          passed: null,
          created_at: now,
          submitted_at: null,
        },
      ],
      error: null,
    });

    const req = makeRequest("valid-token");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);

    // Users
    expect(json.users.total).toBe(3);
    expect(json.users.new7d).toBe(2); // u1 and u2
    expect(json.users.active7d).toBeGreaterThanOrEqual(1);

    // Revenue
    expect(json.revenue.totalPro).toBe(1);
    expect(json.revenue.conversionRate).toBeGreaterThan(0);

    // Engagement
    expect(json.engagement.totalSubmitted).toBe(2);
    expect(json.engagement.totalAbandoned).toBe(1);
    expect(json.engagement.practiceSubmitted).toBe(1);
    expect(json.engagement.examSubmitted).toBe(1);
    expect(json.engagement.avgScore).toBe(72.5); // (85 + 60) / 2
    expect(json.engagement.passRate).toBe(50); // 1 of 2 passed
    expect(json.engagement.completionRate).toBeCloseTo(66.67, 0); // 2 / 3

    // Set breakdown
    expect(json.setBreakdown).toBeInstanceOf(Array);
    expect(json.setBreakdown.length).toBeGreaterThan(0);

    // Trends
    expect(json.trends.dailyActivity).toBeInstanceOf(Array);
    expect(json.trends.dailyActivity.length).toBe(30);
  });

  it("does not leak internal errors", async () => {
    mockGetUser.mockRejectedValueOnce(new Error("DB connection failed"));

    const req = makeRequest("valid-token");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
    expect(JSON.stringify(json)).not.toContain("DB connection");
  });
});
