import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

function isPrivateIp(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0 ||
      a >= 224
    );
  }

  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }

  return true;
}

/**
 * Validate a URL supplied by an end user before fetching it server-side.
 * Blocks non-HTTP protocols, credentials, localhost and private IP ranges to
 * reduce SSRF risk for the link-preview endpoint.
 */
export async function assertSafeExternalUrl(
  input: string,
): Promise<{ ok: true; url: URL } | { ok: false; error: string }> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: "URL tidak valid." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Hanya URL HTTP/HTTPS yang dapat dipratinjau." };
  }

  if (url.username || url.password) {
    return { ok: false, error: "URL dengan kredensial tidak diizinkan." };
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isPrivateIp(hostname)
  ) {
    return { ok: false, error: "Alamat internal tidak dapat diakses." };
  }

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (addresses.some((entry) => isPrivateIp(entry.address))) {
      return { ok: false, error: "Alamat internal tidak dapat diakses." };
    }
  } catch {
    return { ok: false, error: "Domain tidak dapat ditemukan." };
  }

  return { ok: true, url };
}
