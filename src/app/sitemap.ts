import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import {
  getWordPressPages,
  getWordPressPostIndex,
} from "@/lib/wordpress/client";
import {
  getFallbackPage,
  getFallbackPageSlugs,
} from "@/modules/wordpress/content";

export const revalidate = 3600;

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts] = await Promise.all([
    getWordPressPages(),
    getWordPressPostIndex(100),
  ]);

  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  for (const page of pages) {
    if (!page.slug || seen.has(page.slug)) continue;
    seen.add(page.slug);
    entries.push({
      url: `${SITE_URL}/p/${page.slug}`,
      lastModified: toDate(page.modified || page.date),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const slug of getFallbackPageSlugs()) {
    if (seen.has(slug)) continue;
    const fallback = getFallbackPage(slug);
    seen.add(slug);
    entries.push({
      url: `${SITE_URL}/p/${slug}`,
      lastModified: toDate(fallback?.updatedAt),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  const seenPosts = new Set<string>();
  for (const post of posts) {
    if (!post.slug || seenPosts.has(post.slug)) continue;
    seenPosts.add(post.slug);
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: toDate(post.modified || post.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
