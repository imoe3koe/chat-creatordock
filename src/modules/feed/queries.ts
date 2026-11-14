import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostWithRelations } from "@/lib/types";
import { normalizePosts, POST_SELECT } from "./normalize";

export async function getFeedPosts(limit = 30): Promise<PostWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[feed] getFeedPosts:", error.message);
    return [];
  }

  return normalizePosts(data);
}

export async function getSavedPostIds(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("saved_articles")
    .select("post_id")
    .eq("user_id", userId)
    .not("post_id", "is", null);

  return (data ?? [])
    .map((row) => row.post_id as string | null)
    .filter((value): value is string => Boolean(value));
}
