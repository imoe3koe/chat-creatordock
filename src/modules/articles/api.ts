"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ActionResult } from "@/lib/types";

export async function deleteSavedArticle(id: string): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("saved_articles").delete().eq("id", id);
  if (error) return { ok: false, error: "Artikel gagal dihapus." };
  return { ok: true, message: "Artikel dihapus dari pustaka." };
}
