/**
 * User-authored text is stored as plain text and rendered through React
 * (which escapes automatically). These helpers additionally strip HTML and
 * control characters before text reaches the database or an attribute.
 *
 * Deliberately dependency-free: DOMPurify/jsdom must not be imported into
 * server bundles because jsdom's ESM dependency chain crashes on Vercel's
 * runtime. Rich CMS HTML is sanitised separately in `rich-html.ts`.
 */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&#x0*27;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : "";
    })
    .replace(/&#(\d+);/g, (_, decimal: string) => {
      const code = Number.parseInt(decimal, 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : "";
    })
    .replace(/&amp;/gi, "&");
}

function stripHtml(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ");
}

export function sanitizePlainText(
  input: string,
  maxLength = 5000,
  options: { preserveNewlines?: boolean } = {},
): string {
  if (typeof input !== "string") return "";

  const withoutControl = input
    .normalize("NFC")
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

  const withoutTags = decodeEntities(stripHtml(withoutControl));

  const normalized = options.preserveNewlines
    ? withoutTags.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim()
    : withoutTags.replace(/\s+/g, " ").trim();

  return normalized.slice(0, maxLength);
}

export function sanitizeSingleLine(input: string, maxLength = 200): string {
  return sanitizePlainText(input, maxLength).replace(/[\r\n]+/g, " ");
}

export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

export function sanitizeEmail(input: string): string {
  const value = input.trim().toLowerCase().slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? value : "";
}

export function sanitizePhone(input: string): string {
  const value = input.trim().replace(/[^\d+\-()\s]/g, "");
  return value.slice(0, 24);
}

export function sanitizeHttpUrl(input?: string | null): string | null {
  if (!input) return null;
  let value = input.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
    value = `https://${value}`;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    url.username = "";
    url.password = "";
    return url.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

export function sanitizeFileName(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?? "file";
  const cleaned = base
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/^\.+/, "")
    .replace(/\.{2,}/g, ".")
    .slice(0, 120);
  return cleaned || "file";
}

export function extractMentions(text: string): string[] {
  const matches = text.matchAll(/(?:^|[\s(])@([a-zA-Z0-9_]{3,30})\b/g);
  return Array.from(new Set(Array.from(matches, (match) => match[1].toLowerCase())));
}

export function hasUnsafeProtocol(value: string): boolean {
  return /^\s*(javascript|data|vbscript|file):/i.test(value);
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(3, name.length - 2))}@${domain}`;
}
