import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CloudOff, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Kamu sedang offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-ink-600 bg-ink-900/70 p-8 text-center shadow-card">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-300">
          <CloudOff className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          Koneksi terputus
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-content-secondary">
          CreatorChat membutuhkan koneksi internet. Periksa jaringanmu lalu coba
          muat ulang halaman.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-ink-950 transition hover:bg-accent-hover"
          >
            <RefreshCw className="size-4" aria-hidden />
            Coba muat beranda
          </Link>
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-ink-600 px-4 text-sm font-medium text-content-primary transition hover:border-accent/60 hover:bg-accent-muted"
          >
            <BookOpen className="size-4" aria-hidden />
            Buka blog
          </Link>
        </div>

        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-content-muted transition hover:text-accent"
        >
          Ke halaman masuk
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
