"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PenLine, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ActionResult, PostWithRelations, Profile } from "@/lib/types";
import {
  addComment,
  deletePost,
  fetchFeedClient,
  savePostToArticle,
  toggleLike,
} from "../api";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";

export function Feed({
  initialPosts,
  initialSavedIds,
  me,
}: {
  initialPosts: PostWithRelations[];
  initialSavedIds: string[];
  me: Profile;
}) {
  const toast = useToast();
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts);
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<number | null>(null);

  const refresh = useCallback(async (notify = false) => {
    setRefreshing(true);
    try {
      const data = await fetchFeedClient();
      setPosts(data);
      if (notify) toast.success("Feed diperbarui.");
    } catch {
      if (notify) toast.error("Feed gagal diperbarui. Periksa koneksi.");
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => {
      void refresh();
    }, 500);
  }, [refresh]);

  useEffect(() => {
    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel("creatorchat:feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        scheduleRefresh,
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      void supabase.removeChannel(channel);
    };
  }, [refresh, scheduleRefresh]);

  function handlePosted(post: PostWithRelations) {
    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLike(post: PostWithRelations) {
    const liked = post.post_likes.some((like) => like.user_id === me.id);

    setPosts((current) =>
      current.map((item) => {
        if (item.id !== post.id) return item;
        return {
          ...item,
          post_likes: liked
            ? item.post_likes.filter((like) => like.user_id !== me.id)
            : [...item.post_likes, { user_id: me.id }],
        };
      }),
    );

    void toggleLike(post.id, me.id, liked).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        void refresh();
      }
    });
  }

  async function handleSave(post: PostWithRelations) {
    if (savedIds.includes(post.id)) {
      toast.toast("Postingan ini sudah tersimpan di Pustaka Artikel.");
      return;
    }
    const result = await savePostToArticle(me.id, post);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSavedIds((current) => [...current, post.id]);
    toast.success(result.message ?? "Disimpan ke artikel.");
  }

  async function handleComment(postId: string, content: string): Promise<ActionResult> {
    const result = await addComment(postId, me.id, content);
    if (result.ok) {
      window.setTimeout(() => {
        void refresh();
      }, 120);
    }
    return result;
  }

  async function handleDelete(post: PostWithRelations) {
    const result = await deletePost(post.id, post.media_url, post.file_url);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPosts((current) => current.filter((item) => item.id !== post.id));
    toast.success(result.message ?? "Postingan dihapus.");
  }

  return (
    <div className="space-y-3">
      <PostComposer profile={me} onPosted={handlePosted} />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">
            Obrolan komunitas
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
            <span className="size-1 rounded-full bg-emerald-400" aria-hidden />
            Live
          </span>
        </div>
        <button
          type="button"
          onClick={() => void refresh(true)}
          className="tap-target inline-flex items-center gap-1.5 rounded-lg px-2 text-[10px] font-medium text-content-muted transition hover:text-content-primary"
          aria-label="Muat ulang feed"
        >
          <RefreshCw className={`size-3 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          Segarkan
        </button>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Feed masih sunyi"
          description="Jadilah yang pertama memulai percakapan. Bagikan karya, tautan, atau pertanyaanmu."
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-800 px-3 py-1.5 text-[11px] text-content-secondary">
              <PenLine className="size-3.5 text-accent" aria-hidden />
              Tulis di kolom atas
            </span>
          }
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              me={me}
              liked={post.post_likes.some((like) => like.user_id === me.id)}
              saved={savedIds.includes(post.id)}
              onLike={handleLike}
              onSave={handleSave}
              onComment={handleComment}
              onDelete={handleDelete}
            />
          ))}
          <p className="py-3 text-center text-[10px] text-content-muted">
            Kamu sudah di ujung obrolan. Kembali esok untuk cerita baru.
          </p>
        </div>
      )}
    </div>
  );
}
