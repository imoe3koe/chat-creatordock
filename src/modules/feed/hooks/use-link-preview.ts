"use client";

import { useEffect, useRef, useState } from "react";
import type { LinkPreview } from "@/lib/types";

const cache = new Map<string, LinkPreview | null>();

export function useLinkPreview(url?: string | null) {
  const [preview, setPreview] = useState<LinkPreview | null>(() =>
    url ? (cache.get(url) ?? null) : null,
  );
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cleanUrl = url?.trim();
    if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) {
      setPreview(null);
      setLoading(false);
      return;
    }

    if (cache.has(cleanUrl)) {
      setPreview(cache.get(cleanUrl) ?? null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/link-preview?url=${encodeURIComponent(cleanUrl)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("preview failed");
        const data = (await response.json()) as { preview: LinkPreview | null };
        cache.set(cleanUrl, data.preview);
        setPreview(data.preview);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          cache.set(cleanUrl, null);
          setPreview(null);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [url]);

  return { preview, loading };
}
