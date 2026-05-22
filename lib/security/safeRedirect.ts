/**
 * Validates a redirect URL to prevent open-redirect attacks.
 *
 * Only allows same-origin relative paths. Rejects:
 *  - Absolute URLs to other domains (https://evil.com)
 *  - Protocol-relative URLs (//evil.com)
 *  - javascript: URIs
 *  - Data URIs
 *
 * @param url - The candidate redirect URL (e.g. from a query parameter)
 * @param fallback - Where to redirect if the URL is invalid (default: "/")
 * @returns A safe relative path string
 */
export function safeRedirect(url: string | null | undefined, fallback: string = "/"): string {
  if (!url || typeof url !== "string") return fallback;

  const trimmed = url.trim();

  // Block empty strings
  if (!trimmed) return fallback;

  // Block protocol-relative URLs (//evil.com)
  if (trimmed.startsWith("//")) return fallback;

  // Block javascript:, data:, vbscript:, and other dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("mailto:")
  ) {
    return fallback;
  }

  // Must start with a single "/" (relative path) — reject absolute URLs
  if (!trimmed.startsWith("/")) return fallback;

  // Parse against a dummy origin to validate structure
  try {
    const parsed = new URL(trimmed, "http://safe.internal");
    // If parsing changed the hostname somehow, reject
    if (parsed.hostname !== "safe.internal") return fallback;
    // Return only the pathname + search + hash (no origin)
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}
