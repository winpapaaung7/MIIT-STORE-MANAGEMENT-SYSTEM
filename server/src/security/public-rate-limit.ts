export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Small in-memory limiter for anonymous read-only endpoints. A shared store
 * (for example Redis) should replace this when the API is run on multiple
 * server instances.
 */
export class SlidingWindowRateLimiter {
  private readonly requests = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateLimitResult {
    const currentTime = this.now();
    const requests = (this.requests.get(key) ?? []).filter(
      (time) => time > currentTime - this.windowMs,
    );

    if (requests.length >= this.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((requests[0] + this.windowMs - currentTime) / 1000),
        ),
      };
    }

    requests.push(currentTime);
    this.requests.set(key, requests);
    return { allowed: true };
  }
}
