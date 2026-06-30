/** Simple in-memory token bucket rate limiter for CJ API calls. */
export class CjRateLimiter {
  private tokens: number;
  private lastRefillAt: number;

  constructor(private readonly maxRequestsPerMinute: number) {
    this.tokens = maxRequestsPerMinute;
    this.lastRefillAt = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefillAt;
    if (elapsedMs <= 0) {
      return;
    }

    const tokensToAdd = (elapsedMs / 60_000) * this.maxRequestsPerMinute;
    this.tokens = Math.min(this.maxRequestsPerMinute, this.tokens + tokensToAdd);
    this.lastRefillAt = now;
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitMs = Math.ceil(((1 - this.tokens) / this.maxRequestsPerMinute) * 60_000);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }
}
