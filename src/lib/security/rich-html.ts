import sanitizeHtml from "sanitize-html";

/**
 * Server-safe rich HTML sanitizer for headless WordPress content.
 *
 * Uses `sanitize-html` (pure JavaScript) instead of DOMPurify/jsdom because
 * jsdom's ESM-only dependency chain crashes Vercel's Node runtime with
 * `ERR_REQUIRE_ESM`, taking down every dynamic route that imports it.
 *
 * WordPress markup is treated as untrusted: scripts, event handlers, iframes,
 * forms, styles, and protocol-relative URLs are stripped before it reaches
 * `dangerouslySetInnerHTML`.
 */
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

const ALLOWED_RICH_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  video: ["src", "controls", "poster", "width", "height"],
  source: ["src", "type"],
  th: ["colspan", "rowspan"],
  td: ["colspan", "rowspan"],
  "*": ["class"],
};

export function sanitizeRichHtml(html: string): string {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_RICH_TAGS,
    allowedAttributes: ALLOWED_RICH_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      video: ["http", "https"],
      source: ["http", "https"],
    },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const next: Record<string, string> = { ...attribs };
        delete next.target;
        delete next.rel;

        // In-page anchors must not open a new tab. Links without an allowed
        // scheme are stripped of their href by sanitize-html, so skip those.
        const isExternal =
          !href.startsWith("#") && /^(https?:|mailto:|tel:)/i.test(href);
        if (isExternal) {
          next.target = "_blank";
          next.rel = "noopener noreferrer nofollow";
        }

        return { tagName, attribs: next };
      },
    },
  });
}
