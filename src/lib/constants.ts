export const APP_NAME = "CreatorChat";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  feed: "feed-media",
  promo: "promo-media",
} as const;

export const UPLOAD_LIMITS = {
  image: {
    maxBytes: 2 * 1024 * 1024,
    extensions: ["jpg", "jpeg", "png", "webp"],
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "JPG, PNG, atau WEBP (maks. 2MB)",
  },
  document: {
    maxBytes: 5 * 1024 * 1024,
    extensions: ["pdf", "doc", "docx", "zip"],
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-zip-compressed",
    ],
    label: "PDF, DOC, DOCX, atau ZIP (maks. 5MB)",
  },
} as const;

export const FEED_MAX_LENGTH = 5000;
export const COMMENT_MAX_LENGTH = 1500;
export const DISCUSSION_MESSAGE_MAX_LENGTH = 3000;
export const PROMO_MAX_LENGTH = 1200;
export const ARTICLE_MAX_TITLE = 140;

export const WORDPRESS_FALLBACK_LINKS = [
  { slug: "tentang-kami", title: "Tentang Kami" },
  { slug: "panduan", title: "Panduan" },
  { slug: "kebijakan-privasi", title: "Kebijakan Privasi" },
  { slug: "syarat-ketentuan", title: "Syarat & Ketentuan" },
] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  "/gallery",
  "/articles",
  "/promo",
  "/discussions",
  "/settings",
] as const;

export const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/register",
  "/reset-password",
  "/auth",
  "/p",
  "/blog",
  "/offline",
] as const;
