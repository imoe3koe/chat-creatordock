import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { SITE_URL } from "@/lib/constants";
import {
  getFeaturedImage,
  getPageExcerpt,
  getPageTitle,
  getWordPressPage,
  getWordPressPageLinks,
} from "@/lib/wordpress/client";
import { buildWordPressMetadata } from "@/lib/wordpress/metadata";
import { formatDate } from "@/lib/utils";
import { getFallbackPage } from "@/modules/wordpress/content";
import { JsonLd } from "@/modules/wordpress/components/json-ld";
import { WordPressContent } from "@/modules/wordpress/components/wordpress-content";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 300;
export const maxDuration = 30;

function normalizeSlug(value: string): string {
  try {
    return decodeURIComponent(value).trim().toLowerCase();
  } catch {
    // Malformed percent-encoding should 404, not crash the route.
    return "";
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalized = normalizeSlug(slug);

  if (!normalized) {
    return {
      title: "Halaman tidak ditemukan",
      description: "Halaman yang kamu cari tidak tersedia.",
      robots: { index: false, follow: false },
    };
  }

  const page = await getWordPressPage(normalized);
  if (page) return buildWordPressMetadata(page, "page");

  const fallback = getFallbackPage(normalized);
  if (!fallback) {
    return {
      title: "Halaman tidak ditemukan",
      description: "Halaman yang kamu cari tidak tersedia.",
      robots: { index: false, follow: false },
    };
  }

  const url = `${SITE_URL}/p/${fallback.slug}`;
  return {
    title: fallback.title,
    description: fallback.description,
    alternates: { canonical: url },
    openGraph: {
      title: fallback.title,
      description: fallback.description,
      url,
      siteName: "CreatorChat",
      locale: "id_ID",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: fallback.title,
      description: fallback.description,
    },
  };
}

export default async function WordPressPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const normalized = normalizeSlug(slug);

  if (!normalized) notFound();

  const [page, pageLinks] = await Promise.all([
    getWordPressPage(normalized),
    getWordPressPageLinks(),
  ]);
  const fallback = page ? null : getFallbackPage(normalized);

  if (!page && !fallback) notFound();

  const title = page ? getPageTitle(page) : fallback!.title;
  const description = page ? getPageExcerpt(page, 220) : fallback!.description;
  const content = page ? page.content?.rendered ?? "" : fallback!.content;
  const updated = page ? page.modified || page.date : fallback!.updatedAt;
  const image = page ? getFeaturedImage(page) : null;
  const externalUrl = page?.link;
  const relatedPages = pageLinks.filter((item) => item.slug !== normalized);

  const canonical = `${SITE_URL}/p/${normalized}`;

  return (
    <div className="page-container py-6 sm:py-10 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-content-muted"
        >
          <Link href="/blog" className="inline-flex items-center gap-1 hover:text-accent">
            <ArrowLeft className="size-3.5" aria-hidden />
            Blog
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-content-secondary">{title}</span>
        </nav>

        <article className="mt-5">
          <header>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              <FileText className="size-3" aria-hidden />
              Halaman Creatordock
            </p>
            <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm leading-relaxed text-content-secondary sm:text-base">
                {description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-ink-600 py-3 text-xs text-content-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden />
                Diperbarui {formatDate(updated)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" aria-hidden />
                Konten tersanitasi
              </span>
              {externalUrl ? (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  Lihat di Creatordock
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : null}
            </div>
          </header>

          {image ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-ink-600 bg-ink-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={title}
                className="h-auto w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>
          ) : null}

          <WordPressContent html={content} className="mt-7" />

          <aside className="mt-10 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card">
            <h2 className="text-base font-semibold">Bergabung dengan komunitas</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
              Bagikan karya, buka ruang diskusi privat, dan simpan bacaan
              favoritmu di CreatorChat.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-ink-950 transition hover:bg-accent-hover"
              >
                Gabung gratis
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-xl border border-ink-600 px-4 text-sm font-medium text-content-primary transition hover:border-accent/60 hover:bg-accent-muted"
              >
                Sudah punya akun
              </Link>
            </div>
          </aside>
        </article>

        {relatedPages.length > 0 ? (
          <nav aria-label="Halaman lainnya" className="mt-10">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">
              Halaman lainnya
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {relatedPages.slice(0, 6).map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/p/${item.slug}`}
                    className="inline-flex min-h-10 items-center rounded-lg border border-ink-600 bg-ink-800 px-3 text-xs font-medium text-content-secondary transition hover:border-accent/50 hover:text-accent"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          description,
          url: canonical,
          dateModified: updated,
          inLanguage: "id-ID",
          isPartOf: {
            "@type": "WebSite",
            name: "CreatorChat",
            url: SITE_URL,
          },
          publisher: {
            "@type": "Organization",
            name: "CreatorChat",
            url: SITE_URL,
          },
        }}
      />
    </div>
  );
}
