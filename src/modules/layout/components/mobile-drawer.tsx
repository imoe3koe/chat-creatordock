"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Images,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import type { Discussion, Profile } from "@/lib/types";
import type { PageLink } from "@/lib/wordpress/client";
import { NAV_ITEMS } from "../nav-config";
import { OnlineUsers } from "./online-users";

export function MobileDrawer({
  open,
  onClose,
  profile,
  discussions,
  pages,
  recentUsers,
  pendingApprovals,
  savedCount,
  galleryCount,
}: {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  discussions: Discussion[];
  pages: PageLink[];
  recentUsers: Profile[];
  pendingApprovals: number;
  savedCount: number;
  galleryCount: number;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    onClose();
    // Only close when the route changes, not whenever onClose identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);

    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Tutup menu"
      />
      <div
        ref={panelRef}
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col border-r border-ink-600 bg-ink-900 shadow-2xl animate-slide-in"
      >
        <div className="safe-top flex items-center justify-between border-b border-ink-600 px-3 py-2.5">
          <span className="text-sm font-bold tracking-tight">
            Creator<span className="text-accent">Chat</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="tap-target grid size-11 place-items-center rounded-xl text-content-secondary transition active:bg-white/10"
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="border-b border-ink-600 p-3">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl p-2 transition active:bg-white/[0.06]"
            >
              <Avatar src={profile.avatar_url} name={profile.full_name || profile.username} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{profile.full_name || profile.username}</p>
                <p className="truncate text-xs text-content-muted">@{profile.username}</p>
              </div>
              <Settings className="size-4 text-content-muted" aria-hidden />
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                href="/articles"
                className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-2"
              >
                <BookOpen className="size-3.5 text-accent" />
                <span className="text-[11px] text-content-secondary">
                  {savedCount} artikel
                </span>
              </Link>
              <Link
                href="/gallery"
                className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-2"
              >
                <Images className="size-3.5 text-accent" />
                <span className="text-[11px] text-content-secondary">
                  {galleryCount} foto
                </span>
              </Link>
            </div>
          </div>

          <nav className="border-b border-ink-600 p-2" aria-label="Menu utama">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-content-secondary transition active:bg-white/[0.06]"
              >
                <item.icon className="size-[18px] text-content-muted" aria-hidden />
                {item.label}
                {item.href === "/discussions" && pendingApprovals > 0 ? (
                  <Badge tone="accent" className="ml-auto">
                    {pendingApprovals}
                  </Badge>
                ) : (
                  <ChevronRight className="ml-auto size-3.5 text-content-muted/60" aria-hidden />
                )}
              </Link>
            ))}
            <Link
              href="/settings"
              className="flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-content-secondary transition active:bg-white/[0.06]"
            >
              <Settings className="size-[18px] text-content-muted" aria-hidden />
              Pengaturan
              <ChevronRight className="ml-auto size-3.5 text-content-muted/60" aria-hidden />
            </Link>
          </nav>

          <div className="border-b border-ink-600 p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                <MessagesSquare className="size-3" aria-hidden />
                Diskusi diikuti
              </h3>
              <Link href="/discussions" className="text-[10px] font-medium text-accent">
                Semua
              </Link>
            </div>
            {discussions.length === 0 ? (
              <p className="rounded-lg bg-ink-800 p-2.5 text-[11px] leading-relaxed text-content-muted">
                Belum ada diskusi. Buat ruang privat untuk komunitasmu.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {discussions.slice(0, 6).map((discussion) => (
                  <li key={discussion.id}>
                    <Link
                      href={`/discussions/${discussion.id}`}
                      className="flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 transition active:bg-white/[0.06]"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink-700 text-content-muted">
                        <MessagesSquare className="size-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-content-primary">
                        {discussion.title}
                      </span>
                      <ChevronRight className="size-3 text-content-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-b border-ink-600 p-3">
            <OnlineUsers recentUsers={recentUsers} meId={profile.id} compact />
          </div>

          {pages.length > 0 ? (
            <div className="border-b border-ink-600 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                <Sparkles className="size-3" aria-hidden />
                Halaman Creatordock
              </h3>
              <ul className="space-y-0.5">
                {pages.slice(0, 8).map((page) => (
                  <li key={page.slug}>
                    <Link
                      href={`/p/${page.slug}`}
                      className="flex min-h-9 items-center justify-between rounded-lg px-2 py-1.5 text-[11px] text-content-muted transition active:bg-white/[0.06]"
                    >
                      {page.title}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="safe-bottom border-t border-ink-600 bg-ink-900 p-3">
          <SignOutButton compact />
          <div className="mt-2 flex items-center justify-between gap-2 px-1">
            <span className="flex items-center gap-1 text-[10px] text-content-muted">
              <ShieldCheck className="size-3" aria-hidden /> Ruang aman & privat
            </span>
            <span className="text-[10px] text-content-muted">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
