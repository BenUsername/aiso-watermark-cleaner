type WindowEntry = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __watermarkCleanerRateLimits: Map<string, WindowEntry> | undefined;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;

export function checkRateLimit(request: Request, now = Date.now()) {
  const store = global.__watermarkCleanerRateLimits ?? new Map<string, WindowEntry>();
  global.__watermarkCleanerRateLimits = store;
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    cleanup(store, now);
    return { allowed: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)) };
  }
  return { allowed: true, retryAfter: 0 };
}

function cleanup(store: Map<string, WindowEntry>, now: number) {
  if (store.size < 500) return;
  for (const [key, entry] of store) if (entry.resetAt <= now) store.delete(key);
}
