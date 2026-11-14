import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Images,
  MessagesSquare,
  PenLine,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import type { Discussion, GalleryItem, Profile } from "@/lib/types";
import type { PageLink } from "@/lib/wordpress/client";
import { truncate } from "@/lib/utils";

export function ProfileCard({
  profile,
  postCount,
  savedCount,
  galleryCount,
}: {
  profile: Profile;
  postCount: number;
  savedCount: number;
  galleryCount: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-card">
      <div className="h-16 bg-gradient-to-r from-accent/80 via-orange-700/60 to-ink-700" />
      <div className="px-4 pb-4">
        <div className="-mt-7 flex items-end justify-between">
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name || profile.username}
            size="lg"
            className="rounded-full border-4 border-ink-800"
          />
          <Link
            href="/settings"
            className="tap-target grid size-9 place-items-center rounded-lg border border-ink-600 text-content-secondary transition hover:border-accent/50 hover:text-accent"
            aria-label="Buka pengaturan profil"
          >
            <Settings className="size-4" />
          </Link>
        </div>

        <div className="mt-2.5">
          <p className="truncate text-sm font-semibold text-content-primary">
            {profile.full_name || profile.username}
          </p>
          <p className="truncate text-xs text-content-muted">@{profile.username}</p>
          {profile.bio ? (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-content-secondary">
              {truncate(profile.bio, 120)}
            </p>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-content-muted">
              Lengkapi bio-mu di pengaturan agar kreator lain mengenalmu.
            </p>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 divide-x divide-ink-600 rounded-xl border border-ink-600 bg-ink-900/60 py-2 text-center">
          <div>
            <p className="text-sm font-semibold text-content-primary">{postCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-content-muted">Post</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-content-primary">{savedCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-content-muted">Artikel</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-content-primary">{galleryCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-content-muted">Foto</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DiscussionShortcuts({
  discussions,
  pendingApprovals,
}: {
  discussions: Discussion[];
  pendingApprovals: number;
}) {
  return (
    <section className="rounded-2xl border border-ink-600 bg-ink-800 p-3">
      <header className="flex items-center justify-between px-1 pb-2">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
          <MessagesSquare className="size-3.5" aria-hidden />
          Ruang Diskusi
        </h2>
        <Link
          href="/discussions"
          className="rounded-md px-1.5 py-1 text-[11px] font-medium text-accent hover:bg-accent-muted"
        >
          Semua
        </Link>
      </header>

      {discussions.length === 0 ? (
        <div className="rounded-xl bg-ink-900/60 p-3">
          <p className="text-xs leading-relaxed text-content-secondary">
            Belum ada ruang diskusi. Buat ruang privat pertamamu.
          </p>
          <Link
            href="/discussions?create=1"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            <PenLine className="size-3" aria-hidden /> Buat diskusi
          </Link>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {discussions.slice(0, 5).map((discussion) => (
            <li key={discussion.id}>
              <Link
                href={`/discussions/${discussion.id}`}
                className="group flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-ink-700/70"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink-700 text-content-muted group-hover:text-accent">
                  <MessagesSquare className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-content-primary">
                    {discussion.title}
                  </span>
                  <span className="block truncate text-[10px] text-content-muted">
                    {discussion.owner?.username ? `oleh @${discussion.owner.username}` : "Ruang privat"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {pendingApprovals > 0 ? (
            <li className="px-2 pt-2">
              <Link
                href="/discussions?tab=approvals"
                className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-2 text-[11px] font-medium text-amber-200"
              >
                <span>{pendingApprovals} permintaan bergabung</span>
                <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}

export function GalleryShortcut({ items }: { items: GalleryItem[] }) {
  return (
    <section className="rounded-2xl border border-ink-600 bg-ink-800 p-3">
      <header className="flex items-center justify-between px-1 pb-2">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
          <Images className="size-3.5" aria-hidden />
          Galeri Foto
        </h2>
        <Link
          href="/gallery"
          className="rounded-md px-1.5 py-1 text-[11px] font-medium text-accent hover:bg-accent-muted"
        >
          Buka
        </Link>
      </header>

      {items.length === 0 ? (
        <Link
          href="/gallery"
          className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-ink-600 px-3 text-center text-[11px] leading-relaxed text-content-muted transition hover:border-accent/40 hover:text-content-secondary"
        >
          Unggah foto pertamamu dan tampilkan di sini.
        </Link>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {items.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              href="/gallery"
              className="group relative aspect-square overflow-hidden rounded-md bg-ink-700"
              aria-label={item.caption || "Buka galeri"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.public_url}
                alt={item.caption || "Foto galeri"}
                className="size-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      )}
      <Link
        href="/gallery"
        className="mt-2 flex min-h-9 items-center justify-between rounded-lg px-1 text-[11px] text-content-muted hover:text-content-primary"
      >
        <span>{items.length > 0 ? "Kelola galeri pribadi" : "Galeri kosong"}</span>
        <ArrowUpRight className="size-3" aria-hidden />
      </Link>
    </section>
  );
}

export function ArticleShortcut({ count }: { count: number }) {
  return (
    <Link
      href="/articles"
      className="group flex items-center gap-3 rounded-2xl border border-ink-600 bg-ink-800 p-3 transition hover:border-accent/40 hover:bg-ink-700/70"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent">
        <BookOpen className="size-4.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-content-primary">Catatan Artikel</span>
        <span className="block truncate text-[11px] text-content-muted">
          {count > 0 ? `${count} bacaan tersimpan` : "Simpan bacaan pertamamu"}
        </span>
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 text-content-muted transition group-hover:text-accent" aria-hidden />
    </Link>
  );
}

export function SidebarPages({ pages }: { pages: PageLink[] }) {
  if (pages.length === 0) return null;

  return (
    <nav aria-label="Halaman mandiri" className="px-2">
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
        <Sparkles className="size-3" aria-hidden />
        Halaman Creatordock
      </h2>
      <ul className="space-y-0.5">
        {pages.slice(0, 8).map((page) => (
          <li key={page.slug}>
            <Link
              href={`/p/${page.slug}`}
              className="flex min-h-8 items-center rounded-md px-1.5 py-1 text-[11px] text-content-muted transition hover:bg-ink-800 hover:text-content-secondary"
            >
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-start gap-1.5 px-1 text-[10px] leading-relaxed text-content-muted/70">
        <ShieldCheck className="mt-0.5 size-3 shrink-0" aria-hidden />
        Halaman publik dari WordPress Creatordock.
      </p>
    </nav>
  );
}

export function LeftSidebar({
  profile,
  discussions,
  gallery,
  savedCount,
  galleryCount,
  postCount,
  pendingApprovals,
  pages,
}: {
  profile: Profile;
  discussions: Discussion[];
  gallery: GalleryItem[];
  savedCount: number;
  galleryCount: number;
  postCount: number;
  pendingApprovals: number;
  pages: PageLink[];
}) {
  return (
    <div className="space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:pb-4 scrollbar-none">
      <div className="px-1 pb-1">
        <Logo />
      </div>
      <ProfileCard
        profile={profile}
        postCount={postCount}
        savedCount={savedCount}
        galleryCount={galleryCount}
      />
      <DiscussionShortcuts discussions={discussions} pendingApprovals={pendingApprovals} />
      <ArticleShortcut count={savedCount} />
      <GalleryShortcut items={gallery} />
      <SidebarPages pages={pages} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 pb-2 text-[10px] text-content-muted/70">
        <span>© {new Date().getFullYear()} CreatorChat</span>
        <Badge tone="neutral" className="border-transparent bg-transparent px-0 text-[9px]">
          v1.0
        </Badge>
      </div>
    </div>
  );
}
