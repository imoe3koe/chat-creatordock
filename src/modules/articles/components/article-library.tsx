"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Library,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { SavedArticle } from "@/lib/types";
import { formatFullDate, formatRelativeTime, getDomain } from "@/lib/utils";
import { deleteSavedArticle } from "../api";

const SPINE_COLORS = [
  "from-orange-500 to-amber-700",
  "from-sky-500 to-blue-700",
  "from-emerald-500 to-teal-700",
  "from-fuchsia-500 to-purple-700",
  "from-rose-500 to-red-700",
  "from-cyan-500 to-sky-700",
];

export function ArticleLibrary({ initialArticles }: { initialArticles: SavedArticle[] }) {
  const toast = useToast();
  const [articles, setArticles] = useState(initialArticles);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<SavedArticle | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return articles;
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term) ||
        (article.author_name ?? "").toLowerCase().includes(term),
    );
  }, [articles, query]);

  async function remove(article: SavedArticle) {
    if (!window.confirm("Hapus artikel ini dari pustaka pribadi?")) return;
    setBusy(true);
    const result = await deleteSavedArticle(article.id);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setArticles((current) => current.filter((item) => item.id !== article.id));
    setActive(null);
    toast.success(result.message ?? "Artikel dihapus.");
  }

  return (
    <div className="space-y-4">
      <header className="px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
          Pustaka pribadi
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <Library className="size-5 text-accent" aria-hidden />
            Rak Buku Artikel
          </h1>
          <Badge tone="neutral">
            {articles.length} {articles.length === 1 ? "bacaan" : "bacaan"}
          </Badge>
        </div>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-content-secondary">
          Postingan yang kamu simpan dari beranda tersusun rapi di sini. Baca
          ulang kapan saja, tanpa kehilangan konteksnya.
        </p>
      </header>

      {articles.length > 0 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, isi, atau kreator…"
            className="pl-10"
            aria-label="Cari artikel"
          />
        </div>
      ) : null}

      {articles.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Rak buku masih kosong"
          description="Saat menemukan postingan menarik di beranda, tekan tombol Simpan. Bacaan itu akan tersimpan permanen di sini."
          action={
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content-muted">
              <BookOpen className="size-3.5 text-accent" aria-hidden />
              Ikon bookmark ada di setiap postingan
            </span>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Tidak ada hasil"
          description={`Tidak ada artikel yang cocok dengan “${query}”. Coba kata kunci lain.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((article, index) => {
            const cover = article.media_url;
            return (
              <button
                key={article.id}
                type="button"
                onClick={() => setActive(article)}
                className="group relative flex min-h-[190px] overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 text-left transition hover:border-accent/40 hover:bg-ink-700/50"
              >
                <span
                  className={`w-2 shrink-0 bg-gradient-to-b ${SPINE_COLORS[index % SPINE_COLORS.length]}`}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 flex-col p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-accent-soft">
                      <BookMarked className="size-3" aria-hidden />
                      Catatan {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] text-content-muted">
                      {formatRelativeTime(article.created_at)}
                    </span>
                  </span>

                  <span className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-content-primary group-hover:text-white">
                    {article.title}
                  </span>

                  <span className="mt-1.5 line-clamp-3 flex-1 text-[11px] leading-relaxed text-content-secondary">
                    {article.content}
                  </span>

                  <span className="mt-3 flex items-center justify-between gap-2 border-t border-ink-600/70 pt-2.5">
                    <span className="truncate text-[10px] text-content-muted">
                      {article.author_name || "Kreator"}
                      {article.source_url ? ` · ${getDomain(article.source_url)}` : ""}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-accent">
                      Baca <ArrowUpRight className="size-3" aria-hidden />
                    </span>
                  </span>
                </span>

                {cover ? (
                  <span className="absolute right-3 top-10 hidden size-14 overflow-hidden rounded-lg border border-ink-600 opacity-60 sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt="" className="size-full object-cover" loading="lazy" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title="Baca artikel"
        description="Tersimpan di pustaka pribadimu."
        size="lg"
        footer={
          active ? (
            <Button
              variant="ghost"
              onClick={() => void remove(active)}
              loading={busy}
              className="mr-auto text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="size-4" aria-hidden />
              Hapus dari pustaka
            </Button>
          ) : null
        }
      >
        {active ? (
          <article className="space-y-4">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">Artikel Tersimpan</Badge>
                <span className="text-[10px] text-content-muted">
                  {formatFullDate(active.created_at)}
                </span>
              </div>
              <h2 className="mt-2.5 text-balance text-xl font-semibold leading-snug text-content-primary">
                {active.title}
              </h2>
              <p className="mt-1 text-xs text-content-muted">
                Disimpan dari {active.author_name || "kreator"}
              </p>
            </header>

            {active.media_url ? (
              <div className="overflow-hidden rounded-xl border border-ink-600 bg-ink-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.media_url}
                  alt=""
                  className="max-h-72 w-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : null}

            <div className="rounded-xl border border-ink-600 bg-ink-900/60 p-4">
              <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.8] text-content-secondary">
                {active.content}
              </p>
            </div>

            {active.source_url ? (
              <a
                href={active.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5 text-xs text-content-secondary transition hover:border-accent/40 hover:text-content-primary"
              >
                <ArrowUpRight className="size-4 shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{active.source_url}</span>
              </a>
            ) : null}
          </article>
        ) : null}
      </Modal>
    </div>
  );
}
