"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Download,
  Images,
  Maximize2,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { checkClientRateLimit } from "@/lib/security/rate-limit";
import type { GalleryItem, Profile } from "@/lib/types";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import {
  deleteGalleryItem,
  downloadImage,
  getGalleryShareUrl,
  repostToFeed,
  uploadGalleryImage,
} from "../api";

export function GalleryGrid({
  initialItems,
  me,
}: {
  initialItems: GalleryItem[];
  me: Profile;
}) {
  const toast = useToast();
  const [items, setItems] = useState(initialItems);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setFile(selected);
  }

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      toast.error("Pilih foto terlebih dahulu.");
      return;
    }
    const limit = checkClientRateLimit("gallery:upload", {
      limit: 10,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      toast.error("Terlalu banyak unggahan. Tunggu sebentar.");
      return;
    }

    setUploading(true);
    const result = await uploadGalleryImage(me.id, file, caption);
    setUploading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.data) setItems((current) => [result.data as GalleryItem, ...current]);
    setUploadOpen(false);
    setFile(null);
    setCaption("");
    toast.success(result.message ?? "Foto diunggah.");
  }

  async function remove(item: GalleryItem) {
    if (!window.confirm("Hapus foto ini dari galeri?")) return;
    setBusyId(item.id);
    const result = await deleteGalleryItem(item);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setActiveItem(null);
    toast.success(result.message ?? "Foto dihapus.");
  }

  async function share(item: GalleryItem) {
    const url = getGalleryShareUrl(item);
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.caption || "Foto CreatorChat",
          text: item.caption || "Lihat foto dari CreatorChat.",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Tautan foto disalin.");
    } catch {
      toast.error("Tidak dapat membagikan foto.");
    }
  }

  async function download(item: GalleryItem) {
    setBusyId(item.id);
    const result = await downloadImage(item);
    setBusyId(null);
    if (result.ok) toast.success(result.message ?? "Unduhan dimulai.");
  }

  async function repost(item: GalleryItem) {
    setBusyId(item.id);
    const result = await repostToFeed(me.id, item);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Foto diposting ulang.");
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            Koleksi pribadi
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <Images className="size-5 text-accent" aria-hidden />
            Galeri Foto
          </h1>
          <p className="mt-1 text-xs text-content-secondary">
            {items.length > 0
              ? `${items.length} foto privat · hanya kamu yang dapat melihat daftar ini`
              : "Simpan dan kelola karya visualmu di satu tempat."}
          </p>
        </div>
        <Button size="md" onClick={() => setUploadOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Unggah foto
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Galeri masih kosong"
          description="Unggah foto JPG, PNG, atau WEBP maksimal 2MB. Foto tetap privat di galeri, lalu bisa kamu bagikan atau posting ulang."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Unggah foto pertama
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-ink-600 bg-ink-800"
            >
              <button
                type="button"
                onClick={() => setActiveItem(item)}
                className="block w-full text-left"
                aria-label={item.caption || "Buka foto"}
              >
                <div className="aspect-square w-full overflow-hidden bg-ink-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.public_url}
                    alt={item.caption || "Foto galeri"}
                    className="size-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 p-2.5 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="line-clamp-2 text-[11px] leading-snug text-white">
                    {item.caption || formatRelativeTime(item.created_at)}
                  </p>
                </div>
              </button>

              <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => void share(item)}
                  className="grid size-8 place-items-center rounded-lg bg-black/65 text-white backdrop-blur transition hover:bg-black/90"
                  aria-label="Bagikan foto"
                  title="Bagikan"
                >
                  <Share2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void download(item)}
                  disabled={busyId === item.id}
                  className="grid size-8 place-items-center rounded-lg bg-black/65 text-white backdrop-blur transition hover:bg-black/90"
                  aria-label="Unduh foto"
                  title="Unduh"
                >
                  <Download className="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(item)}
                className="absolute left-1.5 top-1.5 grid size-8 place-items-center rounded-lg bg-black/65 text-white opacity-100 backdrop-blur transition hover:bg-black/90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                aria-label="Perbesar foto"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={uploadOpen}
        onClose={() => (uploading ? null : setUploadOpen(false))}
        title="Unggah foto"
        description="JPG, PNG, atau WEBP · maksimal 2MB."
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Batal
            </Button>
            <Button
              type="submit"
              form="gallery-upload-form"
              loading={uploading}
              disabled={!file}
            >
              <Plus className="size-4" aria-hidden />
              Unggah
            </Button>
          </>
        }
      >
        <form onSubmit={upload} className="space-y-4" id="gallery-upload-form">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={pickFile}
            aria-label="Pilih foto"
          />
          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-ink-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Pratinjau" className="max-h-72 w-full object-contain bg-ink-900" />
              <button
                type="button"
                onClick={() => setFile(null)}
                className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur"
              >
                Ganti
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-ink-600 bg-ink-900/60 p-6 text-center transition hover:border-accent/50"
            >
              <Camera className="size-6 text-accent" aria-hidden />
              <span className="mt-2 text-sm font-medium text-content-primary">Pilih foto</span>
              <span className="mt-0.5 text-[11px] text-content-muted">
                Ketuk untuk membuka galeri perangkat
              </span>
            </button>
          )}

          {file ? (
            <p className="text-[11px] text-content-muted">
              {file.name} · {formatBytes(file.size)}
            </p>
          ) : null}

          <Field label="Caption" htmlFor="caption" hint={`${caption.length}/500`}>
            <Textarea
              id="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Ceritakan sedikit tentang foto ini (opsional)"
              maxLength={500}
              className="min-h-20"
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        title={activeItem?.caption ? "Detail foto" : "Foto galeri"}
        size="lg"
        footer={
          activeItem ? (
            <Button
              variant="ghost"
              className="mr-auto text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => void remove(activeItem)}
              loading={busyId === activeItem.id}
            >
              <Trash2 className="size-4" aria-hidden />
              Hapus
            </Button>
          ) : null
        }
      >
        {activeItem ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-ink-600 bg-ink-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeItem.public_url}
                alt={activeItem.caption || "Foto galeri"}
                className="max-h-[55dvh] w-full object-contain"
              />
            </div>

            <div className="flex items-center gap-2">
              <Avatar src={me.avatar_url} name={me.full_name || me.username} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-content-primary">{me.full_name || me.username}</p>
                <p className="text-[10px] text-content-muted">
                  {formatRelativeTime(activeItem.created_at)}
                  {activeItem.file_size ? ` · ${formatBytes(activeItem.file_size)}` : ""}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => void share(activeItem)}>
                <Share2 className="size-3.5" aria-hidden /> Share
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void download(activeItem)}>
                <Download className="size-3.5" aria-hidden /> Unduh
              </Button>
            </div>

            {activeItem.caption ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-content-secondary">
                {activeItem.caption}
              </p>
            ) : null}

            <Button
              className="w-full"
              onClick={() => void repost(activeItem)}
              loading={busyId === activeItem.id}
            >
              <RefreshCw className="size-4" aria-hidden />
              Posting ulang ke Beranda
            </Button>
            <p className="text-center text-[10px] text-content-muted">
              Posting ulang memakai tautan file yang sama tanpa menduplikasi foto.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
