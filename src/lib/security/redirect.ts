const FALLBACK_PATH = "/";

const CONTROL_OR_INVALID = /[\u0000-\u001f\u007f\\]/;

/**
 * Accept only same-origin absolute paths.
 *
 * Rejects protocol-relative URLs (`//evil.com`), backslash tricks that browsers
 * normalise to slashes (`/\\evil.com`), encoded variants (`/%2f%2fevil.com`),
 * control characters and overly long values. Always falls back to `/`.
 */
export function safeInternalPath(value: string | null | undefined): string {
  if (!value || value.length > 2048) return FALLBACK_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) return FALLBACK_PATH;
  if (CONTROL_OR_INVALID.test(value)) return FALLBACK_PATH;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return FALLBACK_PATH;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) return FALLBACK_PATH;
  if (CONTROL_OR_INVALID.test(decoded)) return FALLBACK_PATH;

  return value;
}
