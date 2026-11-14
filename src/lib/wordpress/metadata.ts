import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import {
  getFeaturedImage,
  getPageExcerpt,
  getPageTitle,
} from "./client";
import type { WPPage, WPPost } from "./types";

export function buildWordPressMetadata(
  content: WPPage | WPPost,
  type: "page" | "article" = "page",
): Metadata {
  const title = getPageTitle(content);
  const description = getPageExcerpt(content);
  const image = getFeaturedImage(content);
  const url =
    type === "page"
      ? `${SITE_URL}/p/${content.slug}`
      : `${SITE_URL}/blog/${content.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: content.yoast_head_json?.og_title || title,
      description,
      url,
      siteName: "CreatorChat",
      type: type === "article" ? "article" : "website",
      locale: "id_ID",
      publishedTime: type === "article" ? content.date : undefined,
      modifiedTime: content.modified,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
