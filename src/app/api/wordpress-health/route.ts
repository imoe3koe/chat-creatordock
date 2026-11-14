import { lookup } from "node:dns/promises";
import { NextResponse } from "next/server";
import { buildWordPressUrl, getWordPressApiUrl } from "@/lib/wordpress/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type ProbeResult = {
  name: string;
  url: string;
  status: number | null;
  latencyMs: number;
  contentType: string | null;
  server: string | null;
  title?: string | null;
  error?: string;
  preview?: string;
};

const PREVIEW_LIMIT = 160;
const POST_PARAMS = {
  per_page: "1",
  status: "publish",
  _fields: "id,slug",
};

function queryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

function buildProbes(): Array<{ name: string; url: string }> {
  const apiUrl = getWordPressApiUrl();
  const origin = new URL(apiUrl).origin;
  const params = queryString(POST_PARAMS);

  return [
    {
      name: "pretty_posts",
      url: `${apiUrl}/posts?${params}`,
    },
    {
      name: "rest_literal",
      url: `${origin}/?rest_route=/wp/v2/posts&${params}`,
    },
    {
      name: "rest_encoded",
      url: buildWordPressUrl("/posts", POST_PARAMS).toString(),
    },
    {
      name: "index_php_literal",
      url: `${origin}/index.php?rest_route=/wp/v2/posts&${params}`,
    },
    {
      name: "wp_json_root",
      url: `${origin}/wp-json/`,
    },
    {
      name: "homepage",
      url: `${origin}/`,
    },
  ];
}

async function runProbe(probe: { name: string; url: string }): Promise<ProbeResult> {
  const started = Date.now();

  try {
    const response = await fetch(probe.url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CreatorChat/1.0 (+https://creatordock.online)",
      },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    const contentType = response.headers.get("content-type");
    const server = response.headers.get("server");
    let title: string | null = null;
    let preview: string | undefined;

    const body = await response.text();
    const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) title = titleMatch[1].replace(/\s+/g, " ").trim().slice(0, 120);
    if (!response.ok) {
      preview = body.replace(/\s+/g, " ").trim().slice(0, PREVIEW_LIMIT);
    }

    return {
      name: probe.name,
      url: probe.url,
      status: response.status,
      latencyMs: Date.now() - started,
      contentType,
      server,
      title,
      preview,
    };
  } catch (error) {
    return {
      name: probe.name,
      url: probe.url,
      status: null,
      latencyMs: Date.now() - started,
      contentType: null,
      server: null,
      error:
        error instanceof Error ? `${error.name}: ${error.message}` : "unknown",
    };
  }
}

/**
 * Reachability + routing diagnostics for the headless WordPress REST API.
 *
 * Reports status codes, response metadata, and a short preview of error
 * bodies only. No credentials or private content are exposed.
 */
export async function GET() {
  const probes = buildProbes();
  const host = new URL(getWordPressApiUrl()).hostname;

  const [results, dns] = await Promise.all([
    Promise.all(probes.map(runProbe)),
    lookup(host, { all: true }).catch((error: unknown) => [
      {
        address: `error: ${error instanceof Error ? error.message : "unknown"}`,
        family: 0,
      },
    ]),
  ]);

  const ok =
    results.find((result) => result.name === "rest_encoded")?.status === 200 ||
    results.find((result) => result.name === "rest_literal")?.status === 200;

  return NextResponse.json(
    {
      ok,
      host,
      apiBase: getWordPressApiUrl(),
      dns,
      results,
    },
    {
      status: ok ? 200 : 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
