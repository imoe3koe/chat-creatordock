"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container flex min-h-[60dvh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-3xl border border-ink-600 bg-ink-900/70 p-8 text-center shadow-card">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-300">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-balance text-2xl font-bold tracking-tight">
          Halaman ini sedang tidak dapat dimuat
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-content-secondary">
          Sumber konten mungkin sedang tidak tersedia. Coba muat ulang halaman
          atau kembali ke blog.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-ink-950 transition hover:bg-accent-hover"
          >
            <RotateCcw className="size-4" aria-hidden />
            Coba lagi
          </button>
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink-600 px-4 text-sm font-medium text-content-primary transition hover:border-accent/60 hover:bg-accent-muted"
          >
            Kembali ke blog
          </Link>
        </div>
      </div>
    </div>
  );
}
