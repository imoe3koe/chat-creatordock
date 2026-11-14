import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SavedArticle } from "@/lib/types";

export async function getSavedArticles(userId: string): Promise<SavedArticle[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("saved_articles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[articles] getSavedArticles:", error.message);
    return [];
  }

  return (data ?? []) as SavedArticle[];
}
