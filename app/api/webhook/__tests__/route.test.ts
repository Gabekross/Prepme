import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock fns ──────────────────────────────────────────────────────

const {
  mockConstructEvent,
  mockCustomersRetrieve,
  mockListUsers,
  mockInsert,
  mockDelete,
  mockSelectRole,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockCustomersRetrieve: vi.fn(),
  mockListUsers: vi.fn(),
  mockInsert: vi.fn(),
  mockDelete: vi.fn(),
  mockSelectRole: vi.fn(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────

vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent: mockConstructEvent };
    customers = { retrieve: mockCustomersRetrieve };
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "user_roles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: mockSelectRole,
              })),
            })),
          })),
          insert: mockInsert,
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: mockDelete,
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

import { POST } from "../route";
import { NextRequest } from "next/server";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeWebhookRequest(body: string = "{}"): NextRequest {
  return new NextRequest("http://localhost:3000/api/webhook", {
    method: "POST",
    headers: {
      "stripe-signature": "sig_test_valid",
      "Content-Type": "application/json",
    },
    body,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_xxx";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhook", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing signature");
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error("Signature verification failed");
    });

    const req = makeWebhookRequest();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid signature");
  });

  describe("resolveUserId — paginated user lookup", () => {
    it("uses listUsers with page:1/perPage:1 filter instead of fetching all users", async () => {
      mockConstructEvent.mockReturnValueOnce({
        type: "customer.subscription.deleted",
        data: { object: { customer: "cus_test_123" } },
      });

      mockCustomersRetrieve.mockResolvedValueOnce({
        deleted: false,
        email: "user@example.com",
      });

      mockListUsers.mockResolvedValueOnce({
        data: {
          users: [{ id: "user-abc", email: "user@example.com" }],
        },
        error: null,
      });

      mockDelete.mockResolvedValueOnce({ error: null });

      const req = makeWebhookRequest();
      await POST(req);

      // Verify paginated call with filter — NOT a full enumeration
      expect(mockListUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 1,
        filter: "user@example.com",
      });
    });

    it("performs case-insensitive email matching", async () => {
      mockConstructEvent.mockReturnValueOnce({
        type: "customer.subscription.deleted",
        data: { object: { customer: "cus_test_456" } },
      });

      mockCustomersRetrieve.mockResolvedValueOnce({
        deleted: false,
        email: "User@Example.COM",
      });

      mockListUsers.mockResolvedValueOnce({
        data: {
          users: [{ id: "user-xyz", email: "user@example.com" }],
        },
        error: null,
      });

      mockDelete.mockResolvedValueOnce({ error: null });

      const req = makeWebhookRequest();
      const res = await POST(req);
      const json = await res.json();

      // Should succeed — case-insensitive match found
      expect(json.received).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it("handles deleted Stripe customer gracefully", async () => {
      mockConstructEvent.mockReturnValueOnce({
        type: "customer.subscription.deleted",
        data: { object: { customer: "cus_deleted" } },
      });

      mockCustomersRetrieve.mockResolvedValueOnce({
        deleted: true,
        email: null,
      });

      const req = makeWebhookRequest();
      const res = await POST(req);
      const json = await res.json();

      // Should return success but not attempt user lookup
      expect(json.received).toBe(true);
      expect(mockListUsers).not.toHaveBeenCalled();
    });

    it("handles no matching Supabase user gracefully", async () => {
      mockConstructEvent.mockReturnValueOnce({
        type: "customer.subscription.deleted",
        data: { object: { customer: "cus_orphan" } },
      });

      mockCustomersRetrieve.mockResolvedValueOnce({
        deleted: false,
        email: "nobody@example.com",
      });

      mockListUsers.mockResolvedValueOnce({
        data: { users: [] },
        error: null,
      });

      const req = makeWebhookRequest();
      const res = await POST(req);
      const json = await res.json();

      // Should not crash, just log and return received
      expect(json.received).toBe(true);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe("checkout.session.completed", () => {
    it("grants pro role when metadata contains supabase_user_id", async () => {
      mockConstructEvent.mockReturnValueOnce({
        type: "checkout.session.completed",
        data: {
          object: { metadata: { supabase_user_id: "user-new-pro" } },
        },
      });

      mockSelectRole.mockResolvedValueOnce({ data: null });
      mockInsert.mockResolvedValueOnce({ error: null });

      const req = makeWebhookRequest();
      const res = await POST(req);
      const json = await res.json();

      expect(json.received).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-new-pro",
        role: "pro",
      });
    });

    it("returns 400 when supabase_user_id is missing from metadata", async () => {
      mockConstructEvent.mockReturnValueOnce({
        type: "checkout.session.completed",
        data: {
          object: { metadata: {} },
        },
      });

      const req = makeWebhookRequest();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("No user ID");
    });
  });
});
