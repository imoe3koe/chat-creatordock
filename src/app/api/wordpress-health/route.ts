import { NextResponse } from "next/server";
import { getWordPressApiUrl } from "@/lib/wordpress/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Probe = {
  name: string;
  url: string;
};

type ProbeResult = {
  name: string;
  status: number | null;
  latencyMs: number;
  contentType: string | null;
  error?: string;
  preview?: string;
};

const PREVIEW_LIMIT = 160;

function buildProbes(): Probe[] {
  const apiUrl = getWordPressApiUrl();
  const siteUrl = new URL(apiUrl).origin;

  return [
    {
      name: "posts",
      url: `${apiUrl}/posts?per_page=1&status=publish&_fields=id,slug`,
    },
    {
      name: "pages",
      url: `${apiUrl}/pages?per_page=1&status=publish&_fields=id,slug`,
    },
    {
      name: "rest_route",
      url: `${siteUrl}/?rest_route=/wp/v2/posts&per_page=1&status=publish&_fields=id,slug`,
    },
    {
      name: "wp_json_root",
      url: `${siteUrl}/wp-json/`,
    },
  ];
}

async function runProbe(probe: Probe): Promise<ProbeResult> {
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

    let preview: string | undefined;
    if (!response.ok) {
      const text = await response.text();
      preview = text.replace(/\s+/g, " ").trim().slice(0, PREVIEW_LIMIT);
    } else {
      await response.body?.cancel();
    }

    return {
      name: probe.name,
      status: response.status,
      latencyMs: Date.now() - started,
      contentType: response.headers.get("content-type"),
      preview,
    };
  } catch (error) {
    return {
      name: probe.name,
      status: null,
      latencyMs: Date.now() - started,
      contentType: null,
      error:
        error instanceof Error ? `${error.name}: ${error.message}` : "unknown",
    };
  }
}

/**
 * Lightweight reachability probe for the headless WordPress REST API.
 *
 * Blog pages and the WP page fallbacks depend on outbound access from the
 * hosting runtime, which can fail because of firewalls, rate limits, or a
 * misconfigured URL. This endpoint reports only status/latency plus a short
 * preview of error responses so it is safe to expose for uptime monitoring.
 */
export async function GET() {
  const probes = buildProbes();
  const results = await Promise.all(probes.map(runProbe));
  const ok = results.find((result) => result.name === "posts")?.status === 200;

  return NextResponse.json(
    {
      ok,
      host: new URL(probes[0].url).hostname,
      results,
    },
    {
      status: ok ? 200 : 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
