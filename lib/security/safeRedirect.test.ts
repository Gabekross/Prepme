import { describe, it, expect } from "vitest";
import { safeRedirect } from "./safeRedirect";

describe("safeRedirect", () => {
  // ── Valid relative paths (should pass through) ──────────────────────────
  describe("allows safe relative paths", () => {
    it("returns a simple relative path", () => {
      expect(safeRedirect("/bank/pmp")).toBe("/bank/pmp");
    });

    it("returns root path", () => {
      expect(safeRedirect("/")).toBe("/");
    });

    it("returns a path with query params", () => {
      expect(safeRedirect("/bank/pmp?upgraded=true")).toBe("/bank/pmp?upgraded=true");
    });

    it("returns a path with hash", () => {
      expect(safeRedirect("/dashboard#results")).toBe("/dashboard#results");
    });

    it("returns a deeply nested path", () => {
      expect(safeRedirect("/bank/pmp/exam/set_a/instructions")).toBe(
        "/bank/pmp/exam/set_a/instructions"
      );
    });

    it("returns /reset-password", () => {
      expect(safeRedirect("/reset-password")).toBe("/reset-password");
    });

    it("returns /admin/questions", () => {
      expect(safeRedirect("/admin/questions")).toBe("/admin/questions");
    });
  });

  // ── Absolute URLs to other domains (should be blocked) ──────────────────
  describe("blocks absolute URLs to other origins", () => {
    it("blocks https://evil.com", () => {
      expect(safeRedirect("https://evil.com")).toBe("/");
    });

    it("blocks http://evil.com/path", () => {
      expect(safeRedirect("http://evil.com/path")).toBe("/");
    });

    it("blocks https://evil.com/bank/pmp", () => {
      expect(safeRedirect("https://evil.com/bank/pmp")).toBe("/");
    });
  });

  // ── Protocol-relative URLs (should be blocked) ──────────────────────────
  describe("blocks protocol-relative URLs", () => {
    it("blocks //evil.com", () => {
      expect(safeRedirect("//evil.com")).toBe("/");
    });

    it("blocks //evil.com/path", () => {
      expect(safeRedirect("//evil.com/path")).toBe("/");
    });
  });

  // ── Dangerous schemes (should be blocked) ───────────────────────────────
  describe("blocks dangerous URI schemes", () => {
    it("blocks javascript: URIs", () => {
      expect(safeRedirect("javascript:alert(1)")).toBe("/");
    });

    it("blocks JavaScript: (mixed case)", () => {
      expect(safeRedirect("JavaScript:alert(1)")).toBe("/");
    });

    it("blocks data: URIs", () => {
      expect(safeRedirect("data:text/html,<h1>evil</h1>")).toBe("/");
    });

    it("blocks vbscript: URIs", () => {
      expect(safeRedirect("vbscript:MsgBox")).toBe("/");
    });

    it("blocks mailto: URIs", () => {
      expect(safeRedirect("mailto:attacker@evil.com")).toBe("/");
    });
  });

  // ── Null / undefined / empty (should return fallback) ───────────────────
  describe("handles null, undefined, and empty values", () => {
    it("returns fallback for null", () => {
      expect(safeRedirect(null)).toBe("/");
    });

    it("returns fallback for undefined", () => {
      expect(safeRedirect(undefined)).toBe("/");
    });

    it("returns fallback for empty string", () => {
      expect(safeRedirect("")).toBe("/");
    });

    it("returns fallback for whitespace-only string", () => {
      expect(safeRedirect("   ")).toBe("/");
    });
  });

  // ── Custom fallback ─────────────────────────────────────────────────────
  describe("uses custom fallback", () => {
    it("returns custom fallback for invalid URL", () => {
      expect(safeRedirect("https://evil.com", "/bank/pmp")).toBe("/bank/pmp");
    });

    it("returns custom fallback for null", () => {
      expect(safeRedirect(null, "/dashboard")).toBe("/dashboard");
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("blocks bare domain without protocol", () => {
      expect(safeRedirect("evil.com")).toBe("/");
    });

    it("allows path that looks like a domain but starts with /", () => {
      expect(safeRedirect("/evil.com")).toBe("/evil.com");
    });

    it("blocks URL with backslash (some browsers interpret \\ as /)", () => {
      // \\evil.com could be interpreted as //evil.com by some parsers
      // Our check handles this because it doesn't start with /
      expect(safeRedirect("\\evil.com")).toBe("/");
    });
  });
});
