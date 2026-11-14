import Link from "next/link";
import { ArrowUpRight, MessageSquareText } from "lucide-react";
import { NAV_ITEMS } from "@/modules/layout/nav-config";
import type { PageLink } from "@/lib/wordpress/client";
import { getWordPressSiteUrl } from "@/lib/wordpress/client";

export function PublicFooter({ pages }: { pages: PageLink[] }) {
  const siteUrl = getWordPressSiteUrl();

  return (
    <footer className="border-t border-ink-600 bg-ink-900/50">
      <div className="page-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-ink-950">
              <MessageSquareText className="size-5" strokeWidth={2.4} aria-hidden />
            </span>
            <span className="text-[17px] font-bold tracking-tight">
              Creator<span className="text-accent">Chat</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-content-secondary">
            Ruang sosial dan obrolan realtime untuk kreator. Berbagi karya,
            berdiskusi, menyimpan bacaan, dan mempromosikan karyamu dalam satu
            tempat yang tenang.
          </p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            Kunjungi Creatordock
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>

        <nav aria-label="Halaman Creatordock">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">
            Halaman
          </h2>
          <ul className="mt-3 space-y-1">
            {pages.slice(0, 8).map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/p/${page.slug}`}
                  className="inline-flex min-h-9 items-center text-sm text-content-secondary transition hover:text-accent"
                >
                  {page.title}
                </Link>
              </li>
            ))}
            {pages.length === 0 ? (
              <li className="text-sm text-content-muted">Belum ada halaman.</li>
            ) : null}
          </ul>
        </nav>

        <nav aria-label="Jelajahi CreatorChat">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">
            Jelajahi
          </h2>
          <ul className="mt-3 space-y-1">
            <li>
              <Link
                href="/blog"
                className="inline-flex min-h-9 items-center text-sm text-content-secondary transition hover:text-accent"
              >
                Blog Creatordock
              </Link>
            </li>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-9 items-center text-sm text-content-secondary transition hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-ink-600/70">
        <div className="page-container flex flex-col gap-2 py-5 text-[11px] text-content-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CreatorChat. Seluruh hak cipta dilindungi.</p>
          <p className="flex items-center gap-2">
            <span>Dibangun dengan Next.js, Supabase &amp; WordPress</span>
            <span aria-hidden>·</span>
            <Link href="/login" className="text-content-secondary hover:text-accent">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
