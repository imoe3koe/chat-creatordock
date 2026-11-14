"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ImagePlus,
  Link2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FEED_MAX_LENGTH } from "@/lib/constants";
import { validateUpload } from "@/lib/security/upload";
import { sanitizeHttpUrl } from "@/lib/security/sanitize";
import { checkClientRateLimit } from "@/lib/security/rate-limit";
import { formatBytes, cn } from "@/lib/utils";
import type { PostWithRelations, Profile } from "@/lib/types";
import { createPost } from "../api";
import { LinkPreviewCard } from "./link-preview-card";

export function PostComposer({
  profile,
  onPosted,
}: {
  profile: Profile;
  onPosted: (post: PostWithRelations) => void;
}) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  }, [content]);

  function pickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const check = validateUpload(file, "image");
    if (!check.valid) {
      toast.error(check.error);
      return;
    }
    setImageFile(file);
    setFocused(true);
  }

  function pickDocument(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const check = validateUpload(file, "document");
    if (!check.valid) {
      toast.error(check.error);
      return;
    }
    setDocumentFile(file);
    setFocused(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    const cleanLink = linkUrl.trim() ? sanitizeHttpUrl(linkUrl) : null;
    if (linkUrl.trim() && !cleanLink) {
      toast.error("Tautan tidak valid. Contoh: https://contoh.com");
      return;
    }
    if (!content.trim() && !imageFile && !documentFile && !cleanLink) {
      toast.error("Tulis sesuatu atau lampirkan media.");
      return;
    }
    if (content.length > FEED_MAX_LENGTH) {
      toast.error(`Teks maksimal ${FEED_MAX_LENGTH} karakter.`);
      return;
    }

    const limit = checkClientRateLimit("feed:create", {
      limit: 5,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      toast.error("Kamu mengirim terlalu cepat. Tunggu sebentar.");
      return;
    }

    setLoading(true);
    const result = await createPost({
      userId: profile.id,
      content,
      linkUrl: cleanLink ?? undefined,
      imageFile,
      documentFile,
    });
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (result.data) onPosted(result.data);
    setContent("");
    setLinkUrl("");
    setShowLink(false);
    setImageFile(null);
    setDocumentFile(null);
    setFocused(false);
    toast.success(result.message ?? "Postingan terkirim.");
  }

  const expanded = focused || content.length > 0 || Boolean(imageFile || documentFile || linkUrl);

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-2xl border bg-ink-800 p-3 transition sm:p-4",
        expanded ? "border-accent/25 shadow-glow" : "border-ink-600",
      )}
    >
      <div className="flex gap-2.5 sm:gap-3">
        <Avatar src={profile.avatar_url} name={profile.full_name || profile.username} size="md" />
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={`Apa yang sedang kamu kerjakan, ${profile.full_name?.split(" ")[0] || "kreator"}?`}
            rows={expanded ? 3 : 2}
            maxLength={FEED_MAX_LENGTH}
            className="w-full resize-none bg-transparent py-1 text-[14px] leading-relaxed text-content-primary placeholder:text-content-muted focus:outline-none sm:text-[15px]"
            aria-label="Tulis postingan"
          />

          {showLink ? (
            <div className="mb-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-content-muted" aria-hidden />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://tautan-menarik.com"
                  className="h-9 w-full rounded-lg border border-ink-600 bg-ink-900 pl-8 pr-3 text-xs text-content-primary placeholder:text-content-muted focus:border-accent/60 focus:outline-none"
                  maxLength={2048}
                  aria-label="URL tautan"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLink(false);
                  setLinkUrl("");
                }}
                className="grid size-9 place-items-center rounded-lg text-content-muted hover:bg-white/[0.06] hover:text-content-primary"
                aria-label="Hapus tautan"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          {linkUrl && /^https?:\/\//i.test(linkUrl) ? (
            <LinkPreviewCard url={linkUrl} dismissible onDismiss={() => setLinkUrl("")} />
          ) : null}

          {imagePreview ? (
            <div className="relative mt-2 overflow-hidden rounded-xl border border-ink-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Pratinjau gambar" className="max-h-64 w-full object-cover" />
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/70 text-white backdrop-blur"
                aria-label="Hapus gambar"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          {documentFile ? (
            <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-900 px-3 py-2">
              <FileText className="size-4 shrink-0 text-accent" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-content-primary">{documentFile.name}</p>
                <p className="text-[10px] text-content-muted">{formatBytes(documentFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setDocumentFile(null)}
                className="grid size-8 place-items-center rounded-lg text-content-muted hover:bg-white/[0.06] hover:text-content-primary"
                aria-label="Hapus lampiran"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink-600/70 pt-2.5">
            <div className="flex items-center gap-0.5">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={pickImage}
                aria-label="Unggah gambar"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.zip,application/pdf,application/zip"
                className="sr-only"
                onChange={pickDocument}
                aria-label="Unggah dokumen"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="tap-target inline-flex items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-content-secondary transition hover:bg-white/[0.06] hover:text-accent"
                title="Gambar (maks. 2MB)"
              >
                <ImagePlus className="size-4" aria-hidden />
                <span className="hidden xs:inline sm:inline">Foto</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="tap-target inline-flex items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-content-secondary transition hover:bg-white/[0.06] hover:text-accent"
                title="Dokumen (maks. 5MB)"
              >
                <FileText className="size-4" aria-hidden />
                <span className="hidden sm:inline">File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLink(true);
                  setTimeout(() => textareaRef.current?.focus(), 20);
                }}
                className={cn(
                  "tap-target inline-flex items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition hover:bg-white/[0.06]",
                  showLink ? "text-accent" : "text-content-secondary hover:text-accent",
                )}
                title="Tambahkan tautan"
              >
                <Link2 className="size-4" aria-hidden />
                <span className="hidden sm:inline">Tautan</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              {content.length > 500 ? (
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    content.length > FEED_MAX_LENGTH * 0.9
                      ? "text-amber-400"
                      : "text-content-muted",
                  )}
                >
                  {content.length}/{FEED_MAX_LENGTH}
                </span>
              ) : null}
              <Button
                type="submit"
                size="sm"
                loading={loading}
                disabled={!expanded}
                className="px-3.5"
              >
                {!loading ? <Send className="size-3.5" aria-hidden /> : null}
                Kirim
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!expanded ? (
        <p className="mt-2 flex items-center gap-1.5 pl-[54px] text-[10px] text-content-muted">
          <Sparkles className="size-3 text-accent/70" aria-hidden />
          Bagikan ide, tautan, foto, atau dokumen dengan komunitas.
        </p>
      ) : null}
    </form>
  );
}
