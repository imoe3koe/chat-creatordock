"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS, FEED_MAX_LENGTH, ARTICLE_MAX_TITLE } from "@/lib/constants";
import { buildStoragePath, validateUpload } from "@/lib/security/upload";
import {
  sanitizeFileName,
  sanitizeHttpUrl,
  sanitizePlainText,
  sanitizeSingleLine,
} from "@/lib/security/sanitize";
import { formatBytes, getDomain, truncate } from "@/lib/utils";
import { isMediaUrlReferenced } from "@/lib/security/media-usage";
import { normalizePosts, POST_SELECT } from "./normalize";
import type { ActionResult, PostWithRelations } from "@/lib/types";

export async function fetchFeedClient(limit = 30): Promise<PostWithRelations[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return normalizePosts(data);
}

async function uploadFeedFile(
  userId: string,
  folder: string,
  file: File,
  kind: "image" | "document",
): Promise<{ url: string; path: string }> {
  const validation = validateUpload(file, kind);
  if (!validation.valid) throw new Error(validation.error);

  const supabase = createSupabaseBrowserClient();
  const path = buildStoragePath(userId, folder, file.name);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.feed)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw new Error("Upload gagal. Periksa koneksi lalu coba lagi.");

  const { data } = supabase.storage.from(STORAGE_BUCKETS.feed).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

function storagePathFromUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

export type CreatePostInput = {
  userId: string;
  content: string;
  linkUrl?: string;
  imageFile?: File | null;
  documentFile?: File | null;
};

export async function createPost(
  input: CreatePostInput,
): Promise<ActionResult<PostWithRelations>> {
  const content = sanitizePlainText(input.content, FEED_MAX_LENGTH, {
    preserveNewlines: true,
  });
  const linkUrl = input.linkUrl ? sanitizeHttpUrl(input.linkUrl) : null;

  if (input.linkUrl && !linkUrl) {
    return { ok: false, error: "Tautan tidak valid. Gunakan alamat http(s) biasa." };
  }
  if (!content && !input.imageFile && !input.documentFile && !linkUrl) {
    return { ok: false, error: "Tulis sesuatu atau lampirkan media terlebih dahulu." };
  }

  if (input.imageFile) {
    const check = validateUpload(input.imageFile, "image");
    if (!check.valid) return { ok: false, error: check.error };
  }
  if (input.documentFile) {
    const check = validateUpload(input.documentFile, "document");
    if (!check.valid) return { ok: false, error: check.error };
  }

  let media: { url: string; path: string } | null = null;
  let document: { url: string; path: string } | null = null;

  try {
    if (input.imageFile) {
      media = await uploadFeedFile(input.userId, "posts", input.imageFile, "image");
    }
    if (input.documentFile) {
      document = await uploadFeedFile(
        input.userId,
        "documents",
        input.documentFile,
        "document",
      );
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: input.userId,
        content,
        link_url: linkUrl,
        media_url: media?.url ?? null,
        media_type: media ? "image" : null,
        file_url: document?.url ?? null,
        file_name: input.documentFile
          ? sanitizeFileName(input.documentFile.name).slice(0, 160)
          : null,
        file_size: input.documentFile?.size ?? null,
      })
      .select(POST_SELECT)
      .single();

    if (error) throw new Error(error.message);

    return {
      ok: true,
      data: normalizePosts([data])[0],
      message: "Postingan terkirim.",
    };
  } catch (error) {
    // Best-effort cleanup so failed posts do not leave orphaned files.
    try {
      const supabase = createSupabaseBrowserClient();
      if (media) {
        const path = storagePathFromUrl(media.url, STORAGE_BUCKETS.feed);
        if (path) await supabase.storage.from(STORAGE_BUCKETS.feed).remove([path]);
      }
      if (document) {
        const path = storagePathFromUrl(document.url, STORAGE_BUCKETS.feed);
        if (path) await supabase.storage.from(STORAGE_BUCKETS.feed).remove([path]);
      }
    } catch {
      // Ignore cleanup errors.
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Postingan gagal dikirim. Coba lagi.",
    };
  }
}

export async function toggleLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();

  if (currentlyLiked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: "Gagal membatalkan suka." };
    return { ok: true };
  }

  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: userId });

  if (error && error.code !== "23505") {
    return { ok: false, error: "Gagal menyukai postingan." };
  }
  return { ok: true };
}

export async function addComment(
  postId: string,
  userId: string,
  rawContent: string,
): Promise<ActionResult> {
  const content = sanitizePlainText(rawContent, 1500, { preserveNewlines: true });
  if (!content) return { ok: false, error: "Komentar tidak boleh kosong." };

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    author_id: userId,
    content,
  });

  if (error) return { ok: false, error: "Komentar gagal dikirim." };
  return { ok: true };
}

export async function deletePost(
  postId: string,
  mediaUrl?: string | null,
  fileUrl?: string | null,
): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { ok: false, error: "Postingan gagal dihapus." };

  try {
    const urls = Array.from(
      new Set(
        [mediaUrl, fileUrl].filter((value): value is string => Boolean(value)),
      ),
    );

    const paths: string[] = [];
    for (const url of urls) {
      // Gallery reposts, saved articles and promos may share the same file.
      if (await isMediaUrlReferenced(supabase, url)) continue;
      const path = storagePathFromUrl(url, STORAGE_BUCKETS.feed);
      if (path) paths.push(path);
    }

    if (paths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKETS.feed).remove(paths);
    }
  } catch {
    // The database row is already gone; storage cleanup is best effort.
  }

  return { ok: true, message: "Postingan dihapus." };
}

export async function savePostToArticle(
  userId: string,
  post: PostWithRelations,
): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();

  const { data: existing } = await supabase
    .from("saved_articles")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", post.id)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "Postingan ini sudah ada di Pustaka Artikel." };
  }

  const authorName = post.author?.full_name || post.author?.username || "Kreator";
  const fallbackTitle = post.content
    ? truncate(sanitizeSingleLine(post.content, 120), 95)
    : post.file_name
      ? `Lampiran: ${post.file_name}`
      : post.link_url
        ? `Tautan dari ${getDomain(post.link_url)}`
        : "Catatan kreator";

  const title = sanitizeSingleLine(fallbackTitle, ARTICLE_MAX_TITLE) || "Catatan kreator";
  const body =
    sanitizePlainText(post.content, 10000, { preserveNewlines: true }) ||
    `Disimpan dari postingan ${authorName}.`;

  const { error } = await supabase.from("saved_articles").insert({
    user_id: userId,
    post_id: post.id,
    title,
    content: body,
    source_url: post.link_url,
    media_url: post.media_url,
    author_name: authorName,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Postingan ini sudah ada di Pustaka Artikel." };
    }
    return { ok: false, error: "Gagal menyimpan ke artikel." };
  }

  return { ok: true, message: "Disimpan ke Pustaka Artikel." };
}

export function describeAttachment(name: string, size?: number | null): string {
  return `${name}${size ? ` · ${formatBytes(size)}` : ""}`;
}
