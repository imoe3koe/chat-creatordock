import { NextResponse } from "next/server";
import { getWordPressApiUrl } from "@/lib/wordpress/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight reachability probe for the headless WordPress REST API.
 *
 * Blog pages and the WP page fallbacks depend on outbound access from the
 * hosting runtime, which can fail because of firewalls, rate limits, or a
 * misconfigured URL. This endpoint reports only status/latency so it is safe
 * to expose for uptime monitoring.
 */
export async function GET() {
  const started = Date.now();
  const url = `${getWordPressApiUrl()}/posts?per_page=1&status=publish&_fields=id,slug`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CreatorChat/1.0 (+https://creatordock.online)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        host: new URL(url).hostname,
        latencyMs: Date.now() - started,
      },
      {
        status: response.ok ? 200 : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? `${error.name}: ${error.message}` : "unknown",
        host: new URL(url).hostname,
        latencyMs: Date.now() - started,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
