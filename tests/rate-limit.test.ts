import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit } from "../lib/rate-limit-core";

describe("checkRateLimit", () => {
  beforeEach(() => { global.__watermarkCleanerRateLimits = new Map(); });

  it("allows twelve requests in a minute and blocks the thirteenth", () => {
    const request = new Request("https://example.test/api/clean", { headers: { "x-forwarded-for": "203.0.113.1" } });
    for (let index = 0; index < 12; index += 1) expect(checkRateLimit(request, 1_000).allowed).toBe(true);
    expect(checkRateLimit(request, 1_000)).toEqual({ allowed: false, retryAfter: 60 });
  });

  it("starts a fresh window after expiry", () => {
    const request = new Request("https://example.test/api/clean");
    expect(checkRateLimit(request, 1_000).allowed).toBe(true);
    expect(checkRateLimit(request, 61_001).allowed).toBe(true);
  });
});
