import Link from "next/link";
import { ArrowLeft, BookOpen, Compass, SearchX } from "lucide-react";

export const metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-ink-600 bg-ink-900/70 p-8 text-center shadow-card">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-muted text-accent">
          <SearchX className="size-6" aria-hidden />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-content-muted">
          404 — Tidak ditemukan
        </p>
        <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          Halaman yang kamu cari tidak tersedia
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-content-secondary">
          Tautan mungkin sudah berubah, halaman telah dihapus, atau alamatnya
          salah ketik. Coba jelajahi halaman publik atau kembali ke aplikasi.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-ink-950 transition hover:bg-accent-hover"
          >
            <BookOpen className="size-4" aria-hidden />
            Buka blog
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-ink-600 px-4 text-sm font-medium text-content-primary transition hover:border-accent/60 hover:bg-accent-muted"
          >
            <Compass className="size-4" aria-hidden />
            Ke beranda
          </Link>
        </div>

        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-content-muted transition hover:text-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Kembali ke halaman masuk
        </Link>
      </div>
    </div>
  );
}
