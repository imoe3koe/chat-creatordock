import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GalleryItem } from "@/lib/types";

export async function getGalleryItems(userId: string): Promise<GalleryItem[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[gallery] getGalleryItems:", error.message);
    return [];
  }

  return (data ?? []) as GalleryItem[];
}
