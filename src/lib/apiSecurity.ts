const globalForRateLimit = globalThis as typeof globalThis & {
  __baindRateLimit?: Map<string, { count: number; resetAt: number }>;
};

const rateLimitStore = globalForRateLimit.__baindRateLimit ?? new Map<string, { count: number; resetAt: number }>();
globalForRateLimit.__baindRateLimit = rateLimitStore;

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function validateSameOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Allow non-browser requests (e.g. server-side fetch/curl) but keep rate limits in place.
    return null;
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    return "Cross-origin requests zijn niet toegestaan.";
  }

  return null;
}

export function enforceRateLimit(
  request: Request,
  routeKey: string,
  limit = 40,
  windowMs = 60_000,
): { allowed: boolean; retryAfterSeconds: number } {
  const ip = getClientIp(request);
  const now = Date.now();
  const key = `${routeKey}:${ip}`;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function isSupportedColleagueId(value: string): value is "dennis" | "niels" {
  return value === "dennis" || value === "niels";
}

