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
  sanitizeUsername,
} from "@/lib/security/sanitize";
import type { ActionResult, Profile } from "@/lib/types";

export type ProfileInput = {
  fullName: string;
  username: string;
  bio: string;
  website: string;
  phone: string;
};

export async function updateProfile(
  userId: string,
  input: ProfileInput,
  avatarFile: File | null,
  existingAvatarUrl: string | null,
): Promise<ActionResult<Profile>> {
  const fullName = sanitizeSingleLine(input.fullName, 100);
  const username = sanitizeUsername(input.username);
  const bio = sanitizePlainText(input.bio, 300, { preserveNewlines: true });
  const website = input.website ? sanitizeHttpUrl(input.website) : null;
  const phone = sanitizePhone(input.phone);

  if (fullName.length < 2) {
    return { ok: false, error: "Nama lengkap minimal 2 karakter." };
  }
  if (username.length < 3) {
    return { ok: false, error: "Username minimal 3 karakter (huruf, angka, underscore)." };
  }
  if (input.website && !website) {
    return { ok: false, error: "URL website tidak valid." };
  }
  if (avatarFile) {
    const check = validateUpload(avatarFile, "image");
    if (!check.valid) return { ok: false, error: check.error };
  }

  const supabase = createSupabaseBrowserClient();

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", userId)
    .maybeSingle();

  if (taken) {
    return { ok: false, error: "Username sudah digunakan kreator lain." };
  }

  let avatarUrl = existingAvatarUrl;
  let uploadedPath: string | null = null;

  if (avatarFile) {
    uploadedPath = buildStoragePath(userId, "avatar", avatarFile.name);
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.avatars)
      .upload(uploadedPath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError) {
      return { ok: false, error: "Foto profil gagal diunggah." };
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.avatars)
      .getPublicUrl(uploadedPath);
    avatarUrl = data.publicUrl;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      username,
      bio: bio || null,
      website,
      phone: phone || null,
      avatar_url: avatarUrl,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(STORAGE_BUCKETS.avatars).remove([uploadedPath]);
    }
    if (error.code === "23505") {
      return { ok: false, error: "Username sudah digunakan kreator lain." };
    }
    return { ok: false, error: "Profil gagal disimpan. Coba lagi." };
  }

  if (uploadedPath && existingAvatarUrl) {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKETS.avatars}/`;
    const index = existingAvatarUrl.indexOf(marker);
    if (index !== -1) {
      try {
        await supabase.storage
          .from(STORAGE_BUCKETS.avatars)
          .remove([decodeURIComponent(existingAvatarUrl.slice(index + marker.length))]);
      } catch {
        // Best effort.
      }
    }
  }

  return {
    ok: true,
    data: data as Profile,
    message: "Profil diperbarui.",
  };
}

export async function requestEmailChange(newEmail: string): Promise<ActionResult> {
  const email = sanitizeEmail(newEmail);
  if (!email) return { ok: false, error: "Masukkan email yang valid." };

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser(
    { email },
    {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    },
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message.toLowerCase().includes("already")
          ? "Email tersebut sudah digunakan akun lain."
          : "Permintaan perubahan email gagal. Coba lagi.",
    };
  }

  return {
    ok: true,
    message: "Tautan konfirmasi dikirim. Cek email lama dan email baru.",
  };
}

export async function updatePassword(
  password: string,
  confirm: string,
): Promise<ActionResult> {
  if (password.length < 8) {
    return { ok: false, error: "Password minimal 8 karakter." };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, error: "Gunakan kombinasi huruf dan angka." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Konfirmasi password tidak cocok." };
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, error: "Password gagal diperbarui. Coba lagi." };
  }

  return { ok: true, message: "Password berhasil diperbarui." };
}
