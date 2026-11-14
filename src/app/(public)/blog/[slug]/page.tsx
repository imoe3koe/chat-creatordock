import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  UserRound,
} from "lucide-react";
import { SITE_URL } from "@/lib/constants";
import {
  getFeaturedImage,
  getPageExcerpt,
  getPageTitle,
  getPostAuthor,
  getWordPressPost,
  getWordPressPosts,
} from "@/lib/wordpress/client";
import { buildWordPressMetadata } from "@/lib/wordpress/metadata";
import { formatDate } from "@/lib/utils";
import { JsonLd } from "@/modules/wordpress/components/json-ld";
import { WordPressContent } from "@/modules/wordpress/components/wordpress-content";

type PostPageProps = { params: Promise<{ slug: string }> };

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
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalized = normalizeSlug(slug);
  const post = normalized ? await getWordPressPost(normalized) : null;

  if (!post) {
    return {
      title: "Artikel tidak ditemukan",
      description: "Artikel yang kamu cari tidak tersedia.",
      robots: { index: false, follow: false },
    };
  }

  return buildWordPressMetadata(post, "article");
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const normalized = normalizeSlug(slug);

  if (!normalized) notFound();

  const [post, relatedPosts] = await Promise.all([
    getWordPressPost(normalized),
    getWordPressPosts(6),
  ]);

  if (!post) notFound();

  const title = getPageTitle(post);
  const description = getPageExcerpt(post, 220);
  const image = getFeaturedImage(post);
  const author = getPostAuthor(post);
  const canonical = `${SITE_URL}/blog/${post.slug}`;

  const related = relatedPosts.filter((item) => item.slug !== post.slug);

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
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm leading-relaxed text-content-secondary sm:text-base">
                {description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-ink-600 py-3 text-xs text-content-muted">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5" aria-hidden />
                {author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden />
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </span>
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 font-medium text-accent hover:underline"
              >
                Sumber asli
                <ExternalLink className="size-3" aria-hidden />
              </a>
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

          <WordPressContent html={post.content?.rendered ?? ""} className="mt-7" />

          <aside className="mt-10 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card">
            <h2 className="text-base font-semibold">Ikut bergabung di CreatorChat</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
              Diskusikan ide dari artikel ini, bagikan karyamu, dan temukan
              kreator lain dengan minat yang sama.
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
                Masuk
              </Link>
            </div>
          </aside>
        </article>

        {related.length > 0 ? (
          <section className="mt-10" aria-labelledby="artikel-lainnya">
            <h2
              id="artikel-lainnya"
              className="text-[11px] font-semibold uppercase tracking-wider text-content-muted"
            >
              Artikel lainnya
            </h2>
            <ul className="mt-3 divide-y divide-ink-600 overflow-hidden rounded-2xl border border-ink-600 bg-ink-800">
              {related.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/blog/${item.slug}`}
                    className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition hover:bg-ink-700/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-content-primary">
                        {getPageTitle(item)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-content-muted">
                        {formatDate(item.date)} · {getPostAuthor(item)}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-content-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description,
          url: canonical,
          mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          datePublished: post.date,
          dateModified: post.modified || post.date,
          inLanguage: "id-ID",
          author: { "@type": "Person", name: author },
          publisher: {
            "@type": "Organization",
            name: "CreatorChat",
            url: SITE_URL,
          },
          ...(image ? { image: [image] } : {}),
        }}
      />
    </div>
  );
}
