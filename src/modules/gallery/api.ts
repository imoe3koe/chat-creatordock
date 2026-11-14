"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { buildStoragePath, validateUpload } from "@/lib/security/upload";
import { sanitizePlainText, sanitizeSingleLine } from "@/lib/security/sanitize";
import { isMediaUrlReferenced } from "@/lib/security/media-usage";
import type { ActionResult, GalleryItem } from "@/lib/types";
import { sanitizeFileName } from "@/lib/security/sanitize";

export async function uploadGalleryImage(
  userId: string,
  file: File,
  caption: string,
): Promise<ActionResult<GalleryItem>> {
  const check = validateUpload(file, "image");
  if (!check.valid) return { ok: false, error: check.error };

  const supabase = createSupabaseBrowserClient();
  const path = buildStoragePath(userId, "gallery", file.name);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.feed)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return { ok: false, error: "Foto gagal diunggah. Periksa koneksi lalu coba lagi." };
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.feed)
    .getPublicUrl(path);

  const { data, error } = await supabase
    .from("gallery_items")
    .insert({
      user_id: userId,
      storage_path: path,
      public_url: urlData.publicUrl,
      caption: caption ? sanitizePlainText(caption, 500, { preserveNewlines: true }) : null,
      file_size: file.size,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(STORAGE_BUCKETS.feed).remove([path]);
    return { ok: false, error: "Metadata foto gagal disimpan." };
  }

  return {
    ok: true,
    data: data as GalleryItem,
    message: "Foto ditambahkan ke galeri.",
  };
}

export async function deleteGalleryItem(item: GalleryItem): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("gallery_items").delete().eq("id", item.id);

  if (error) return { ok: false, error: "Foto gagal dihapus." };

  try {
    // The same public URL may be reused by a reposted feed item, a saved
    // article or a promo; only delete the object when nothing else needs it.
    if (!(await isMediaUrlReferenced(supabase, item.public_url))) {
      await supabase.storage.from(STORAGE_BUCKETS.feed).remove([item.storage_path]);
    }
  } catch {
    // Best-effort storage cleanup.
  }

  return { ok: true, message: "Foto dihapus dari galeri." };
}

export async function repostToFeed(
  userId: string,
  item: GalleryItem,
): Promise<ActionResult> {
  const caption = sanitizePlainText(item.caption ?? "", 500, { preserveNewlines: true });
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.from("posts").insert({
    author_id: userId,
    content: caption
      ? caption
      : "Posting ulang dari galeri pribadi.",
    media_url: item.public_url,
    media_type: "image",
  });

  if (error) return { ok: false, error: "Foto gagal diposting ulang." };
  return { ok: true, message: "Foto diposting ulang ke Beranda." };
}

export async function downloadImage(item: GalleryItem): Promise<ActionResult> {
  try {
    const response = await fetch(item.public_url, { mode: "cors" });
    if (!response.ok) throw new Error("download failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = sanitizeFileName(
      item.caption ? `${sanitizeSingleLine(item.caption, 60)}.jpg` : "creatorchat-foto.jpg",
    );
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, message: "Unduhan dimulai." };
  } catch {
    window.open(item.public_url, "_blank", "noopener,noreferrer");
    return { ok: true, message: "Foto dibuka di tab baru." };
  }
}

export function getGalleryShareUrl(item: GalleryItem): string {
  return item.public_url;
}
