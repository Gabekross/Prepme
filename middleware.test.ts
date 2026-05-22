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
});
