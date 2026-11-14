import { WORDPRESS_FALLBACK_LINKS } from "@/lib/constants";
import { stripHtmlTags } from "@/lib/utils";
import type { WPPage, WPPost, WPTerm } from "./types";

const DEFAULT_API_URL = "https://creatordock.online/wp-json/wp/v2";
const REVALIDATE_SECONDS = 300;

export function getWordPressApiUrl(): string {
  const configured =
    process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WP_API_URL;
  if (configured) return configured.replace(/\/$/, "");

  const siteUrl = process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL;
  if (siteUrl) return `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2`;

  return DEFAULT_API_URL;
}

export function getWordPressSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL?.replace(/\/$/, "") ||
    "https://creatordock.online"
  );
}

class WordPressError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "WordPressError";
  }
}

async function wpFetch<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${getWordPressApiUrl()}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const headers: HeadersInit = {
    Accept: "application/json",
    "User-Agent": "CreatorChat/1.0 (+https://creatordock.online)",
  };

  if (process.env.WORDPRESS_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.WORDPRESS_API_TOKEN}`;
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers,
      next: { revalidate: REVALIDATE_SECONDS, tags: ["wordpress"] },
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    throw new WordPressError("Tidak dapat terhubung ke WordPress.");
  }

  if (!response.ok) {
    throw new WordPressError(
      `WordPress merespons dengan status ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

/**
 * Light field list for index/sitemap requests. WordPress does not return
 * `_embedded` when `_fields` is present, so detail and feed requests omit
 * `_fields` altogether to keep featured images and author data.
 */
const INDEX_FIELDS = [
  "id",
  "slug",
  "date",
  "modified",
  "link",
  "title",
].join(",");

export async function getWordPressPages(): Promise<WPPage[]> {
  try {
    const pages = await wpFetch<WPPage[]>("/pages", {
      per_page: "100",
      status: "publish",
      orderby: "menu_order",
      order: "asc",
      _fields: INDEX_FIELDS,
    });
    return pages.filter((page) => page?.slug && page?.title);
  } catch (error) {
    console.error("[wordpress] getWordPressPages:", error);
    return [];
  }
}

export async function getWordPressPage(slug: string): Promise<WPPage | null> {
  try {
    const pages = await wpFetch<WPPage[]>("/pages", {
      slug,
      status: "publish",
      _embed: "wp:featuredmedia",
    });
    return pages[0] ?? null;
  } catch (error) {
    console.error("[wordpress] getWordPressPage:", error);
    return null;
  }
}

export async function getWordPressPosts(limit = 12): Promise<WPPost[]> {
  try {
    const posts = await wpFetch<WPPost[]>("/posts", {
      per_page: String(Math.min(Math.max(limit, 1), 50)),
      status: "publish",
      _embed: "wp:featuredmedia,author",
    });
    return posts.filter((post) => post?.slug && post?.title);
  } catch (error) {
    console.error("[wordpress] getWordPressPosts:", error);
    return [];
  }
}

export async function getWordPressPost(slug: string): Promise<WPPost | null> {
  try {
    const posts = await wpFetch<WPPost[]>("/posts", {
      slug,
      status: "publish",
      _embed: "wp:featuredmedia,author",
    });
    return posts[0] ?? null;
  } catch (error) {
    console.error("[wordpress] getWordPressPost:", error);
    return null;
  }
}

/** Minimal post index for sitemaps; avoids downloading full post bodies. */
export async function getWordPressPostIndex(
  limit = 100,
): Promise<Pick<WPPost, "id" | "slug" | "date" | "modified" | "link" | "title">[]> {
  try {
    const posts = await wpFetch<WPPost[]>("/posts", {
      per_page: String(Math.min(Math.max(limit, 1), 100)),
      status: "publish",
      _fields: INDEX_FIELDS,
    });
    return posts.filter((post) => post?.slug && post?.title);
  } catch (error) {
    console.error("[wordpress] getWordPressPostIndex:", error);
    return [];
  }
}

export async function getWordPressCategories(): Promise<WPTerm[]> {
  try {
    return await wpFetch<WPTerm[]>("/categories", {
      per_page: "50",
      _fields: "id,name,slug",
    });
  } catch {
    return [];
  }
}

export type PageLink = { slug: string; title: string };

export async function getWordPressPageLinks(): Promise<PageLink[]> {
  const pages = await getWordPressPages();

  if (pages.length > 0) {
    return pages.map((page) => ({
      slug: page.slug,
      title: stripHtmlTags(page.title.rendered) || page.slug,
    }));
  }

  return WORDPRESS_FALLBACK_LINKS.map((page) => ({ ...page }));
}

export function getFeaturedImage(post: WPPost | WPPage): string | null {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  return media?.source_url ?? post.yoast_head_json?.og_image?.[0]?.url ?? null;
}

export function getPageTitle(page: WPPage): string {
  return stripHtmlTags(page.title?.rendered ?? "") || page.slug;
}

export function getPageExcerpt(page: WPPage, max = 165): string {
  const description =
    page.yoast_head_json?.description ||
    page.yoast_head_json?.og_description ||
    stripHtmlTags(page.excerpt?.rendered ?? "") ||
    stripHtmlTags(page.content?.rendered ?? "");
  return description.length > max
    ? `${description.slice(0, max - 1).trimEnd()}…`
    : description;
}

export function getPostAuthor(post: WPPost): string {
  return post._embedded?.author?.[0]?.name || "Creatordock";
}

export { WordPressError };
