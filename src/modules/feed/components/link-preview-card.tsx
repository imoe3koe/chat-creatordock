"use client";

import { ArrowUpRight, Link2 } from "lucide-react";
import { useLinkPreview } from "../hooks/use-link-preview";
import { Skeleton } from "@/components/ui/skeleton";
import { getDomain } from "@/lib/utils";

export function LinkPreviewCard({
  url,
  dismissible = false,
  onDismiss,
}: {
  url: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}) {
  const { preview, loading } = useLinkPreview(url);
  const domain = preview?.domain || getDomain(url);

  if (loading) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-ink-600 bg-ink-900">
        <Skeleton className="h-24 w-full rounded-none" />
        <div className="space-y-2 p-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-3 flex items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5 text-xs text-content-secondary transition hover:border-accent/40 hover:text-content-primary"
      >
        <Link2 className="size-4 shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{domain || url}</span>
        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
      </a>
    );
  }

  return (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-ink-600 bg-ink-900 transition hover:border-ink-600/80">
      {dismissible ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-1.5 top-1.5 z-10 grid size-7 place-items-center rounded-full bg-black/70 text-xs text-white backdrop-blur transition hover:bg-black"
          aria-label="Hapus pratinjau tautan"
        >
          ×
        </button>
      ) : null}
      <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="block">
        {preview.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.image}
            alt=""
            className="max-h-56 w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-accent-soft">
            {preview.siteName || domain}
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-content-primary">
            {preview.title || domain}
          </p>
          {preview.description ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-content-secondary">
              {preview.description}
            </p>
          ) : null}
          <p className="mt-2 truncate text-[10px] text-content-muted">{url}</p>
        </div>
      </a>
    </div>
  );
}
