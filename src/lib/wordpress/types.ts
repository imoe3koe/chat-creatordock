export type WPRendered = {
  rendered: string;
};

export type WPPage = {
  id: number;
  slug: string;
  date: string;
  modified: string;
  link: string;
  title: WPRendered;
  content: WPRendered;
  excerpt: WPRendered;
  featured_media?: number;
  yoast_head_json?: {
    title?: string;
    description?: string;
    og_title?: string;
    og_description?: string;
    og_image?: { url: string; width?: number; height?: number }[];
    canonical?: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      alt_text?: string;
      media_details?: { width?: number; height?: number };
    }>;
  };
};

export type WPPost = WPPage & {
  categories?: number[];
  author?: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      alt_text?: string;
      media_details?: { width?: number; height?: number };
    }>;
    author?: Array<{ name?: string; avatar_urls?: Record<string, string> }>;
  };
};

export type WPTerm = {
  id: number;
  name: string;
  slug: string;
};
