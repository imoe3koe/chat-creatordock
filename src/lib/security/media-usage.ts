import type { SupabaseClient } from "@supabase/supabase-js";

type CountResult = { count: number | null; error: unknown };

/**
 * Checks whether a public storage URL is still referenced by any table.
 *
 * Storage objects in `feed-media` are shared by design: a gallery image can be
 * reposted to the feed, a feed image can be saved into an article, and a promo
 * may point at the same file. Before deleting the underlying object we must be
 * sure no other row still needs it.
 *
 * Fails closed: if a lookup errors, the URL is treated as still in use.
 */
export async function isMediaUrlReferenced(
  supabase: SupabaseClient,
  url: string,
): Promise<boolean> {
  const results: CountResult[] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("media_url", url),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("file_url", url),
    supabase
      .from("gallery_items")
      .select("id", { count: "exact", head: true })
      .eq("public_url", url),
    supabase
      .from("saved_articles")
      .select("id", { count: "exact", head: true })
      .eq("media_url", url),
    supabase
      .from("promos")
      .select("id", { count: "exact", head: true })
      .eq("image_url", url),
  ]);

  if (results.some((result) => result.error)) return true;

  return results.some((result) => (result.count ?? 0) > 0);
}
