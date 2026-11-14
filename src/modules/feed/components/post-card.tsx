"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  Download,
  FileText,
  Heart,
  Link2,
  MessageCircle,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { formatBytes, formatFullDate, formatRelativeTime, cn } from "@/lib/utils";
import type { ActionResult, PostWithRelations, Profile } from "@/lib/types";
import { RichText } from "./rich-text";
import { LinkPreviewCard } from "./link-preview-card";

export function PostCard({
  post,
  me,
  liked,
  saved,
  onLike,
  onSave,
  onComment,
  onDelete,
}: {
  post: PostWithRelations;
  me: Profile;
  liked: boolean;
  saved: boolean;
  onLike: (post: PostWithRelations) => void;
  onSave: (post: PostWithRelations) => void;
  onComment: (postId: string, content: string) => Promise<ActionResult>;
  onDelete: (post: PostWithRelations) => void;
}) {
  const toast = useToast();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const comments = useMemo(() => post.post_comments ?? [], [post.post_comments]);
  const likeCount = post.post_likes?.length ?? 0;
  const isOwner = post.author_id === me.id;
  const authorName = post.author?.full_name || post.author?.username || "Kreator";
  const visibleComments = commentsOpen ? comments : comments.slice(-2);

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!comment.trim() || sending) return;
    setSending(true);
    const result = await onComment(post.id, comment);
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setComment("");
    setCommentsOpen(true);
  }

  function share() {
    const url = `${window.location.origin}/#post-${post.id}`;
    if (navigator.share) {
      void navigator
        .share({
          title: `Postingan ${authorName} di CreatorChat`,
          text: post.content.slice(0, 120),
          url,
        })
        .catch(() => {
          void copyLink(url);
        });
      return;
    }
    void copyLink(url);
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Tautan postingan disalin.");
    } catch {
      toast.error("Tidak dapat menyalin tautan.");
    }
  }

  return (
    <article
      id={`post-${post.id}`}
      className="overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-card animate-fade-up scroll-mt-20"
    >
      <header className="flex items-start gap-3 p-3.5 pb-0 sm:p-4 sm:pb-0">
        <Avatar
          src={post.author?.avatar_url}
          name={authorName}
          size="md"
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-content-primary">
                {authorName}
              </p>
              <p className="flex items-center gap-1.5 truncate text-[11px] text-content-muted">
                <span>@{post.author?.username ?? "kreator"}</span>
                <span aria-hidden>·</span>
                <time dateTime={post.created_at} title={formatFullDate(post.created_at)}>
                  {formatRelativeTime(post.created_at)}
                </time>
              </p>
            </div>
            {isOwner ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Hapus postingan ini secara permanen?")) {
                    onDelete(post);
                  }
                }}
                className="tap-target grid size-9 shrink-0 place-items-center rounded-lg text-content-muted transition hover:bg-red-500/10 hover:text-red-400"
                aria-label="Hapus postingan"
                title="Hapus postingan"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="px-3.5 pt-2.5 sm:px-4">
        {post.content ? <RichText content={post.content} /> : null}

        {post.media_url ? (
          <a
            href={post.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block overflow-hidden rounded-xl border border-ink-600/70 bg-ink-900"
            aria-label="Buka gambar ukuran penuh"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media_url}
              alt={post.content ? `Gambar dari ${authorName}` : "Gambar postingan"}
              className="max-h-[520px] w-full object-contain sm:object-cover"
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : null}

        {post.file_url ? (
          <a
            href={post.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download={post.file_name ?? undefined}
            className="mt-3 flex items-center gap-3 rounded-xl border border-ink-600 bg-ink-900 p-3 transition hover:border-accent/40 hover:bg-ink-700/60"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-muted text-accent">
              <FileText className="size-4.5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-content-primary">
                {post.file_name ?? "Lampiran"}
              </span>
              <span className="block text-[10px] text-content-muted">
                {post.file_size ? formatBytes(post.file_size) : "Unduh lampiran"}
              </span>
            </span>
            <Download className="size-4 shrink-0 text-content-muted" aria-hidden />
          </a>
        ) : null}

        {post.link_url ? <LinkPreviewCard url={post.link_url} /> : null}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-600/70 px-1.5 py-1 sm:px-2">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onLike(post)}
            className={cn(
              "tap-target inline-flex items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition",
              liked
                ? "text-accent"
                : "text-content-secondary hover:bg-white/[0.05] hover:text-content-primary",
            )}
            aria-pressed={liked}
            aria-label={liked ? "Batalkan suka" : "Sukai postingan"}
          >
            <Heart className={cn("size-[18px]", liked && "fill-accent")} aria-hidden />
            <span className="tabular-nums">{likeCount || ""}</span>
            <span className="hidden sm:inline">{liked ? "Disukai" : "Suka"}</span>
          </button>

          <button
            type="button"
            onClick={() => setCommentsOpen((value) => !value)}
            className="tap-target inline-flex items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-content-secondary transition hover:bg-white/[0.05] hover:text-content-primary"
            aria-expanded={commentsOpen}
            aria-label="Lihat komentar"
          >
            <MessageCircle className="size-[18px]" aria-hidden />
            <span className="tabular-nums">{comments.length || ""}</span>
            <span className="hidden sm:inline">Komentar</span>
          </button>

          <button
            type="button"
            onClick={share}
            className="tap-target inline-flex items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-content-secondary transition hover:bg-white/[0.05] hover:text-content-primary"
            aria-label="Bagikan postingan"
          >
            <Share2 className="size-[17px]" aria-hidden />
            <span className="hidden sm:inline">Bagikan</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSave(post)}
          className={cn(
            "tap-target inline-flex items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition",
            saved
              ? "text-accent"
              : "text-content-secondary hover:bg-white/[0.05] hover:text-content-primary",
          )}
          aria-pressed={saved}
          aria-label={saved ? "Tersimpan di artikel" : "Simpan ke artikel"}
          title={saved ? "Tersimpan di Pustaka Artikel" : "Simpan ke Pustaka Artikel"}
        >
          <Bookmark className={cn("size-[17px]", saved && "fill-accent")} aria-hidden />
          <span className="hidden sm:inline">{saved ? "Tersimpan" : "Simpan"}</span>
        </button>
      </div>

      {commentsOpen || comments.length > 0 ? (
        <div className="border-t border-ink-600/70 bg-ink-850/40 px-3.5 py-3 sm:px-4">
          {!commentsOpen && comments.length > 2 ? (
            <button
              type="button"
              onClick={() => setCommentsOpen(true)}
              className="mb-2 text-[11px] font-medium text-accent hover:underline"
            >
              Lihat semua {comments.length} komentar
            </button>
          ) : null}

          <ul className="space-y-2.5">
            {visibleComments.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5">
                <Avatar
                  src={item.author?.avatar_url}
                  name={item.author?.full_name || item.author?.username}
                  size="xs"
                />
                <div className="min-w-0 flex-1 rounded-xl bg-ink-800 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[11px] font-semibold text-content-primary">
                      {item.author?.full_name || item.author?.username || "Kreator"}
                    </p>
                    <time className="shrink-0 text-[9px] text-content-muted" dateTime={item.created_at}>
                      {formatRelativeTime(item.created_at)}
                    </time>
                  </div>
                  <div className="mt-0.5">
                    <RichText
                      content={item.content}
                      className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-content-secondary"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {comments.length === 0 ? (
            <p className="py-1 text-[11px] text-content-muted">
              Belum ada komentar. Mulai percakapan yang hangat.
            </p>
          ) : null}

          <form onSubmit={submitComment} className="mt-3 flex items-end gap-2">
            <Avatar src={me.avatar_url} name={me.full_name || me.username} size="xs" />
            <div className="relative flex-1">
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                onFocus={() => setCommentsOpen(true)}
                placeholder="Tulis komentar…"
                maxLength={1500}
                className="h-10 w-full rounded-xl border border-ink-600 bg-ink-900 pl-3 pr-10 text-xs text-content-primary placeholder:text-content-muted focus:border-accent/60 focus:outline-none"
                aria-label="Tulis komentar"
              />
              <button
                type="submit"
                disabled={!comment.trim() || sending}
                className="absolute right-1 top-1 grid size-8 place-items-center rounded-lg text-accent transition hover:bg-accent-muted disabled:text-content-muted"
                aria-label="Kirim komentar"
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="border-t border-ink-600/70 px-3.5 py-1.5 sm:px-4">
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="flex min-h-9 w-full items-center gap-2 rounded-lg px-1 text-left text-[11px] text-content-muted transition hover:text-content-secondary"
          >
            <Link2 className="size-3" aria-hidden />
            Tulis komentar pertama
          </button>
        </div>
      )}
    </article>
  );
}
