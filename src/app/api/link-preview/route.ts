import { NextResponse } from "next/server";
import { assertSafeExternalUrl } from "@/lib/security/url";
import { sanitizeSingleLine } from "@/lib/security/sanitize";
import { checkServerRateLimit, getClientIp } from "@/lib/security/rate-limit";
import type { LinkPreview } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 220_000;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&#x0*27;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Math.min(Number(code) || 32, 0x10ffff)),
    );
}

async function readLimitedText(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let output = "";

  try {
    while (received < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      output += decoder.decode(value, { stream: true });
      if (received >= MAX_BYTES) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return output.slice(0, MAX_BYTES);
}

function parseMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const keyMatch = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i);
    const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i);
    if (!keyMatch || !contentMatch) continue;
    const key = keyMatch[1].toLowerCase();
    if (!meta[key]) meta[key] = decodeEntities(contentMatch[1]);
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) meta["document:title"] = decodeEntities(title);
  return meta;
}

function clean(value?: string, max = 300): string | null {
  if (!value) return null;
  const cleaned = sanitizeSingleLine(value, max);
  return cleaned || null;
}

function resolveImage(image: string | null, base: URL): string | null {
  if (!image) return null;
  try {
    const resolved = new URL(image, base);
    if (resolved.protocol !== "https:" && resolved.protocol !== "http:") return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = checkServerRateLimit(`link-preview:${ip}`, {
    limit: 20,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan pratinjau tautan." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      },
    );
  }

  const rawUrl = new URL(request.url).searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Parameter url wajib diisi." }, { status: 400 });
  }

  const safe = await assertSafeExternalUrl(rawUrl);
  if (!safe.ok) {
    return NextResponse.json({ error: safe.error }, { status: 400 });
  }

  try {
    const response = await fetch(safe.url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CreatorChatBot/1.0; +https://creatordock.online)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(6500),
      cache: "no-store",
    });

    if (!response.ok || response.status >= 300) {
      return NextResponse.json({ preview: null });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ preview: null });
    }

    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_BYTES * 2) {
      return NextResponse.json({ preview: null });
    }

    const html = await readLimitedText(response);
    const meta = parseMeta(html);

    const preview: LinkPreview = {
      url: safe.url.toString(),
      domain: safe.url.hostname.replace(/^www\./, ""),
      title: clean(
        meta["og:title"] || meta["twitter:title"] || meta["document:title"],
        180,
      ),
      description: clean(
        meta["og:description"] || meta["twitter:description"] || meta["description"],
        280,
      ),
      image: resolveImage(
        meta["og:image"] || meta["twitter:image"] || meta["og:image:url"] || null,
        safe.url,
      ),
      siteName: clean(meta["og:site_name"], 80),
    };

    return NextResponse.json(
      { preview },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json({ preview: null });
  }
}
