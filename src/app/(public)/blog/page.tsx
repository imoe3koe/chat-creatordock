import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ExternalLink,
  PenLine,
} from "lucide-react";
import { SITE_URL } from "@/lib/constants";
import {
  getFeaturedImage,
  getPageExcerpt,
  getPageTitle,
  getPostAuthor,
  getWordPressPosts,
  getWordPressSiteUrl,
} from "@/lib/wordpress/client";
import { formatDate } from "@/lib/utils";
import { JsonLd } from "@/modules/wordpress/components/json-ld";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog Creatordock",
  description:
    "Ide, catatan, dan cerita untuk kreator dari Creatordock. Temukan tips berkarya, wawasan komunitas, dan kabar terbaru CreatorChat.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Blog Creatordock",
    description:
      "Ide, catatan, dan cerita untuk kreator dari Creatordock.",
    url: `${SITE_URL}/blog`,
    siteName: "CreatorChat",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Creatordock",
    description:
      "Ide, catatan, dan cerita untuk kreator dari Creatordock.",
  },
};

export default async function BlogIndexPage() {
  const posts = await getWordPressPosts(12);
  const siteUrl = getWordPressSiteUrl();

  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <header className="max-w-2xl">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
          <BookOpen className="size-3" aria-hidden />
          Creatordock Journal
        </p>
        <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Ide, catatan, dan cerita untuk kreator
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-content-secondary sm:text-base">
          Kumpulan tulisan dari tim Creatordock: tips berkarya, wawasan
          komunitas, dan kabar terbaru seputar ruang kreator.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-muted text-accent">
            <PenLine className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Belum ada artikel</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-content-secondary">
            Artikel dari Creatordock akan tampil di sini setelah dipublikasikan.
            Sementara itu, kamu bisa mulai berbagi karya di CreatorChat.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-ink-950 transition hover:bg-accent-hover"
            >
              Gabung gratis
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-ink-600 px-4 text-sm font-medium text-content-primary transition hover:border-accent/60 hover:bg-accent-muted"
            >
              Kunjungi Creatordock
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:gap-5">
          {posts.map((post) => {
            const title = getPageTitle(post);
            const image = getFeaturedImage(post);
            const excerpt = getPageExcerpt(post, 150);

            return (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-card transition hover:border-accent/40"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="block overflow-hidden bg-ink-900"
                  aria-label={title}
                >
                  {image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={image}
                      alt={title}
                      className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-ink-800 via-ink-850 to-ink-900">
                      <BookOpen className="size-8 text-content-muted/60" aria-hidden />
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-content-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3" aria-hidden />
                      {formatDate(post.date)}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{getPostAuthor(post)}</span>
                  </div>

                  <h2 className="mt-2 text-balance text-base font-semibold leading-snug text-content-primary sm:text-lg">
                    <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                      {title}
                    </Link>
                  </h2>

                  {excerpt ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-content-secondary">
                      {excerpt}
                    </p>
                  ) : null}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                  >
                    Baca artikel
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Blog Creatordock",
          url: `${SITE_URL}/blog`,
          inLanguage: "id-ID",
          blogPost: posts.slice(0, 12).map((post) => ({
            "@type": "BlogPosting",
            headline: getPageTitle(post),
            url: `${SITE_URL}/blog/${post.slug}`,
            datePublished: post.date,
            dateModified: post.modified,
          })),
        }}
      />
    </div>
  );
}
