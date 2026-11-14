type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

const memoryStore = new Map<string, number[]>();

function evaluate(
  timestamps: number[],
  now: number,
  { limit, windowMs }: RateLimitOptions,
): { result: RateLimitResult; next: number[] } {
  const recent = timestamps.filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    return {
      result: {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, windowMs - (now - oldest)),
      },
      next: recent,
    };
  }
  recent.push(now);
  return {
    result: {
      allowed: true,
      remaining: Math.max(0, limit - recent.length),
      retryAfterMs: 0,
    },
    next: recent,
  };
}

/**
 * Browser-side sliding-window limiter (localStorage). Used to stop duplicate
 * post/comment/upload spam before hitting Supabase. This is a UX guard, not a
 * replacement for server/database rate limiting.
 */
export function checkClientRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  if (typeof window === "undefined") {
    return { allowed: true, remaining: options.limit, retryAfterMs: 0 };
  }

  const storageKey = `cc:rl:${key}`;
  let timestamps: number[] = [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        timestamps = parsed.filter((value): value is number => typeof value === "number");
      }
    }
  } catch {
    timestamps = [];
  }

  const { result, next } = evaluate(timestamps, now, options);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    // Storage can be disabled; the in-memory path below still applies.
  }
  return result;
}

/** In-memory limiter for route handlers. For multi-instance deployments use Upstash/Redis. */
export function checkServerRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const timestamps = memoryStore.get(key) ?? [];
  const { result, next } = evaluate(timestamps, now, options);
  memoryStore.set(key, next);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (memoryStore.size > 5000) {
    for (const [storedKey, values] of memoryStore) {
      if (values.every((stamp) => now - stamp > options.windowMs)) {
        memoryStore.delete(storedKey);
      }
    }
  }

  return result;
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
