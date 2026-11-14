import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWordPressPageLinks, type PageLink } from "@/lib/wordpress/client";
import type { Discussion, GalleryItem, Profile, Promo } from "@/lib/types";

export type LayoutData = {
  discussions: Discussion[];
  gallery: GalleryItem[];
  promos: Promo[];
  recentUsers: Profile[];
  pages: PageLink[];
  savedCount: number;
  galleryCount: number;
  postCount: number;
  pendingApprovals: number;
};

const emptyLayoutData: LayoutData = {
  discussions: [],
  gallery: [],
  promos: [],
  recentUsers: [],
  pages: [],
  savedCount: 0,
  galleryCount: 0,
  postCount: 0,
  pendingApprovals: 0,
};

export async function getLayoutData(userId: string): Promise<LayoutData> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return emptyLayoutData;

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const [
    membershipsResult,
    ownedResult,
    galleryResult,
    galleryCountResult,
    savedCountResult,
    postCountResult,
    promoResult,
    usersResult,
    pendingResult,
    pages,
  ] = await Promise.all([
    supabase
      .from("discussion_members")
      .select("discussion_id")
      .eq("user_id", userId)
      .eq("status", "approved"),
    supabase
      .from("discussions")
      .select("id")
      .eq("owner_id", userId),
    supabase
      .from("gallery_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("gallery_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("saved_articles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId),
    supabase
      .from("promos")
      .select(
        "*, author:profiles!promos_user_id_fkey(id,username,full_name,avatar_url)",
      )
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("profiles")
      .select("*")
      .gte("last_seen_at", tenMinutesAgo)
      .neq("id", userId)
      .order("last_seen_at", { ascending: false })
      .limit(12),
    supabase
      .from("discussion_members")
      .select("discussion_id, discussions!inner(owner_id)")
      .eq("status", "pending"),
    getWordPressPageLinks(),
  ]);

  const discussionIds = new Set<string>();
  (membershipsResult.data ?? []).forEach((row) => {
    if (row.discussion_id) discussionIds.add(row.discussion_id);
  });
  (ownedResult.data ?? []).forEach((row) => {
    if (row.id) discussionIds.add(row.id);
  });

  let discussions: Discussion[] = [];
  if (discussionIds.size > 0) {
    const { data } = await supabase
      .from("discussions")
      .select(
        "*, owner:profiles!discussions_owner_id_fkey(id,username,full_name,avatar_url)",
      )
      .in("id", Array.from(discussionIds))
      .order("updated_at", { ascending: false });

    discussions = (data ?? []) as unknown as Discussion[];
  }

  const pendingApprovals = (pendingResult.data ?? []).filter((row) => {
    const relation = row.discussions as unknown as { owner_id?: string } | null;
    return relation?.owner_id === userId;
  }).length;

  return {
    discussions,
    gallery: (galleryResult.data ?? []) as GalleryItem[],
    promos: (promoResult.data ?? []) as unknown as Promo[],
    recentUsers: (usersResult.data ?? []) as Profile[],
    pages,
    savedCount: savedCountResult.count ?? 0,
    galleryCount: galleryCountResult.count ?? 0,
    postCount: postCountResult.count ?? 0,
    pendingApprovals,
  };
}
