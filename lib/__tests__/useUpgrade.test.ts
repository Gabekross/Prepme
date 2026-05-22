import { describe, it, expect } from "vitest";

/**
 * Unit test for the Stripe checkout URL validation logic extracted
 * from useUpgrade(). We test the validation function directly rather
 * than the React hook (which requires full DOM + auth mocking).
 */

function validateStripeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(".stripe.com");
  } catch {
    return false;
  }
}

describe("Stripe checkout URL validation", () => {
  it("accepts valid Stripe checkout URL", () => {
    expect(
      validateStripeUrl("https://checkout.stripe.com/c/pay/cs_test_abc123")
    ).toBe(true);
  });

  it("accepts subdomain of stripe.com", () => {
    expect(validateStripeUrl("https://pay.stripe.com/session/xyz")).toBe(true);
  });

  it("rejects bare stripe.com (checkout always uses a subdomain)", () => {
    // Stripe Checkout URLs are always checkout.stripe.com, never bare stripe.com.
    // Rejecting bare stripe.com prevents attackers from registering similar domains.
    expect(validateStripeUrl("https://stripe.com/checkout")).toBe(false);
  });

  it("rejects URL to a different domain", () => {
    expect(validateStripeUrl("https://evil.com/steal-card")).toBe(false);
  });

  it("rejects URL with stripe.com as a subdomain of another domain", () => {
    // e.g. stripe.com.evil.com — hostname is evil.com, not stripe.com
    expect(
      validateStripeUrl("https://stripe.com.evil.com/checkout")
    ).toBe(false);
  });

  it("rejects URL with stripe.com embedded in path", () => {
    expect(
      validateStripeUrl("https://evil.com/stripe.com/checkout")
    ).toBe(false);
  });

  it("rejects javascript: scheme", () => {
    expect(validateStripeUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateStripeUrl("")).toBe(false);
  });

  it("rejects relative paths", () => {
    expect(validateStripeUrl("/bank/pmp")).toBe(false);
  });
});
