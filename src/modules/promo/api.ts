"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { buildStoragePath, validateUpload } from "@/lib/security/upload";
import {
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizePhone,
  sanitizePlainText,
  sanitizeSingleLine,
} from "@/lib/security/sanitize";
import type { ActionResult, Promo } from "@/lib/types";

export type PromoInput = {
  title: string;
  description: string;
  linkUrl: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  phone: string;
  email: string;
  isActive: boolean;
};

export async function savePromo(
  userId: string,
  input: PromoInput,
  imageFile: File | null,
  existingImageUrl: string | null,
): Promise<ActionResult<Promo>> {
  const title = sanitizeSingleLine(input.title, 120);
  const description = sanitizePlainText(input.description, 1200, {
    preserveNewlines: true,
  });

  if (title.length < 2) {
    return { ok: false, error: "Judul promo minimal 2 karakter." };
  }

  const linkUrl = input.linkUrl ? sanitizeHttpUrl(input.linkUrl) : null;
  if (input.linkUrl && !linkUrl) {
    return { ok: false, error: "Tautan promo tidak valid." };
  }

  const email = input.email ? sanitizeEmail(input.email) : "";
  if (input.email && !email) {
    return { ok: false, error: "Email kontak tidak valid." };
  }

  const instagram = sanitizeSingleLine(input.instagram, 120)
    .replace(/^@/, "")
    .replace(/[^a-zA-Z0-9._]/g, "");
  const tiktok = sanitizeSingleLine(input.tiktok, 120)
    .replace(/^@/, "")
    .replace(/[^a-zA-Z0-9._]/g, "");
  const whatsapp = sanitizePhone(input.whatsapp).replace(/[^\d]/g, "").slice(0, 16);
  const phone = sanitizePhone(input.phone);

  if (imageFile) {
    const check = validateUpload(imageFile, "image");
    if (!check.valid) return { ok: false, error: check.error };
  }

  const supabase = createSupabaseBrowserClient();
  let imageUrl = existingImageUrl;
  let uploadedPath: string | null = null;

  if (imageFile) {
    uploadedPath = buildStoragePath(userId, "promo", imageFile.name);
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.promo)
      .upload(uploadedPath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      return { ok: false, error: "Gambar promo gagal diunggah." };
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.promo)
      .getPublicUrl(uploadedPath);
    imageUrl = data.publicUrl;
  }

  const { data, error } = await supabase
    .from("promos")
    .upsert(
      {
        user_id: userId,
        title,
        description,
        image_url: imageUrl,
        link_url: linkUrl,
        instagram: instagram || null,
        tiktok: tiktok || null,
        whatsapp: whatsapp || null,
        phone: phone || null,
        email: email || null,
        is_active: input.isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select(
      "*, author:profiles!promos_user_id_fkey(id,username,full_name,avatar_url)",
    )
    .single();

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(STORAGE_BUCKETS.promo).remove([uploadedPath]);
    }
    return { ok: false, error: "Promo gagal disimpan. Coba lagi." };
  }

  // Remove the previous image after a successful replacement.
  if (uploadedPath && existingImageUrl) {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKETS.promo}/`;
    const index = existingImageUrl.indexOf(marker);
    if (index !== -1) {
      try {
        await supabase.storage
          .from(STORAGE_BUCKETS.promo)
          .remove([decodeURIComponent(existingImageUrl.slice(index + marker.length))]);
      } catch {
        // Best-effort cleanup.
      }
    }
  }

  return {
    ok: true,
    data: data as unknown as Promo,
    message: "Promo berhasil disimpan.",
  };
}

export async function togglePromoActive(
  promoId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("promos")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", promoId);
  if (error) return { ok: false, error: "Status promo gagal diubah." };
  return {
    ok: true,
    message: isActive ? "Promo diaktifkan." : "Promo dinonaktifkan.",
  };
}

export function normalizeSocialUrl(value?: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return sanitizeHttpUrl(value);
  return null;
}
