import { describe, expect, it } from "vitest";

import { SlidingWindowRateLimiter } from "../src/security/public-rate-limit.js";

describe("SlidingWindowRateLimiter", () => {
  it("limits a caller and permits it again after the configured window", () => {
    let now = 1_000;
    const limiter = new SlidingWindowRateLimiter(2, 60_000, () => now);

    expect(limiter.check("192.0.2.1").allowed).toBe(true);
    expect(limiter.check("192.0.2.1").allowed).toBe(true);
    expect(limiter.check("192.0.2.1")).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });

    now += 60_001;
    expect(limiter.check("192.0.2.1").allowed).toBe(true);
  });

  it("keeps request counts separate for different callers", () => {
    const limiter = new SlidingWindowRateLimiter(1, 60_000);

    expect(limiter.check("192.0.2.1").allowed).toBe(true);
    expect(limiter.check("192.0.2.2").allowed).toBe(true);
  });
});
