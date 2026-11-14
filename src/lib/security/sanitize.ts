import DOMPurify from "isomorphic-dompurify";

/**
 * User-authored text is stored as plain text and rendered through React
 * (which escapes automatically). These helpers additionally strip HTML and
 * control characters before text reaches the database or an attribute.
 */
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

  const withoutTags = DOMPurify.sanitize(withoutControl, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

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

const ALLOWED_RICH_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "code",
  "pre",
  "span",
  "div",
  "video",
  "source",
];

const ALLOWED_RICH_ATTR = [
  "href",
  "src",
  "alt",
  "title",
  "target",
  "rel",
  "width",
  "height",
  "loading",
  "class",
  "controls",
  "poster",
  "type",
  "colspan",
  "rowspan",
];

/** Sanitise trusted-ish CMS HTML before rendering it with dangerouslySetInnerHTML. */
export function sanitizeRichHtml(html: string): string {
  if (!html) return "";

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_RICH_TAGS,
    ALLOWED_ATTR: ALLOWED_RICH_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "style"],
    ADD_ATTR: ["target", "rel"],
  });

  // Force every external link to be safe and avoid tab-nabbing.
  return clean.replace(
    /<a\s+([^>]*?)>/gi,
    (_match, attrs: string) => {
      const cleanedAttrs = attrs
        .replace(/\s+target=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/\s+rel=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
      return `<a ${cleanedAttrs} target="_blank" rel="noopener noreferrer nofollow">`;
    },
  );
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
