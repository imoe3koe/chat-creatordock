import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonStyles } from "@/components/ui/button";
import type { PageLink } from "@/lib/wordpress/client";
import { cn } from "@/lib/utils";

const NAV_LINK =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-content-secondary transition hover:bg-white/[0.05] hover:text-content-primary";

export function PublicHeader({ pages }: { pages: PageLink[] }) {
  const menuPages = pages.slice(0, 4);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-600 bg-ink-950/85 backdrop-blur-xl">
      <div className="page-container flex h-16 items-center justify-between gap-3">
        <Logo />

        <nav
          aria-label="Navigasi halaman publik"
          className="hidden items-center gap-0.5 md:flex"
        >
          <Link href="/blog" className={NAV_LINK}>
            <BookOpen className="mr-1.5 size-4 text-content-muted" aria-hidden />
            Blog
          </Link>
          {menuPages.map((page) => (
            <Link key={page.slug} href={`/p/${page.slug}`} className={NAV_LINK}>
              {page.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonStyles("ghost", "sm"), "hidden sm:inline-flex")}
          >
            Masuk
          </Link>
          <Link href="/register" className={buttonStyles("primary", "sm")}>
            Gabung gratis
          </Link>
        </div>
      </div>

      <div className="border-t border-ink-600/60 md:hidden">
        <nav
          aria-label="Navigasi halaman publik seluler"
          className="page-container flex items-center gap-1 overflow-x-auto py-1 scrollbar-none"
        >
          <Link href="/blog" className={cn(NAV_LINK, "shrink-0 text-xs")}>
            Blog
          </Link>
          {pages.slice(0, 8).map((page) => (
            <Link
              key={page.slug}
              href={`/p/${page.slug}`}
              className={cn(NAV_LINK, "shrink-0 whitespace-nowrap text-xs")}
            >
              {page.title}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
