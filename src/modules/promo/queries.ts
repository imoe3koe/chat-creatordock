import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Promo } from "@/lib/types";

export async function getPromos(): Promise<Promo[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("promos")
    .select(
      "*, author:profiles!promos_user_id_fkey(id,username,full_name,avatar_url)",
    )
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[promo] getPromos:", error.message);
    return [];
  }

  return (data ?? []) as unknown as Promo[];
}
