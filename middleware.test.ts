import { describe, it, expect } from "vitest";
import { middleware } from "./middleware";
import { NextRequest } from "next/server";

function makeRequest(path: string = "/"): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, { method: "GET" });
}

describe("Security headers middleware", () => {
  it("sets X-Content-Type-Options: nosniff", () => {
    const res = middleware(makeRequest());
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets X-Frame-Options: DENY", () => {
    const res = middleware(makeRequest());
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("sets Referrer-Policy", () => {
    const res = middleware(makeRequest());
    expect(res.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  it("sets Permissions-Policy to deny sensitive features", () => {
    const res = middleware(makeRequest());
    const policy = res.headers.get("Permissions-Policy")!;
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
    expect(policy).toContain("payment=()");
  });

  it("sets Strict-Transport-Security with 1 year max-age", () => {
    const res = middleware(makeRequest());
    const hsts = res.headers.get("Strict-Transport-Security")!;
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
  });

  it("sets X-XSS-Protection", () => {
    const res = middleware(makeRequest());
    expect(res.headers.get("X-XSS-Protection")).toBe("1; mode=block");
  });

  it("applies to API routes", () => {
    const res = middleware(makeRequest("/api/checkout"));
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  describe("Content-Security-Policy", () => {
    it("sets CSP header", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toBeTruthy();
    });

    it("restricts default-src to self", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("default-src 'self'");
    });

    it("allows Supabase in connect-src", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("connect-src 'self' https://*.supabase.co");
    });

    it("allows Google Fonts in style-src and font-src", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("https://fonts.googleapis.com");
      expect(csp).toContain("https://fonts.gstatic.com");
    });

    it("blocks framing (frame-src none, frame-ancestors none)", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("frame-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("blocks object/embed (object-src none)", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("object-src 'none'");
    });

    it("restricts base-uri to self", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("base-uri 'self'");
    });

    it("restricts form-action to self", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("form-action 'self'");
    });

    it("upgrades insecure requests", () => {
      const res = middleware(makeRequest());
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("upgrade-insecure-requests");
    });
  });
});
