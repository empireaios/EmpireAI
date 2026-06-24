export type RateLimiterConfig = {
  /** Maximum tokens (requests) per window. */
  capacity: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Tokens refilled per window (defaults to capacity). */
  refillRate?: number;
};

/** Token-bucket rate limiter — generic per-connector throttling. */
export class TokenBucketRateLimiter {
  private readonly capacity: number;
  private readonly windowMs: number;
  private readonly refillRate: number;
  private tokens: number;
  private lastRefillAt: number;

  constructor(config: RateLimiterConfig) {
    this.capacity = config.capacity;
    this.windowMs = config.windowMs;
    this.refillRate = config.refillRate ?? config.capacity;
    this.tokens = this.capacity;
    this.lastRefillAt = Date.now();
  }

  private refill(now: number): void {
    const elapsed = now - this.lastRefillAt;
    if (elapsed <= 0) return;
    const windowsElapsed = elapsed / this.windowMs;
    const tokensToAdd = windowsElapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillAt = now;
  }

  tryAcquire(tokens = 1): boolean {
    const now = Date.now();
    this.refill(now);
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  async acquire(tokens = 1): Promise<void> {
    while (!this.tryAcquire(tokens)) {
      await sleep(Math.max(10, Math.ceil(this.windowMs / this.refillRate)));
    }
  }

  availableTokens(): number {
    this.refill(Date.now());
    return this.tokens;
  }

  reset(): void {
    this.tokens = this.capacity;
    this.lastRefillAt = Date.now();
  }
}

/** Sliding-window counter — alternative rate limit strategy. */
export class SlidingWindowRateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly timestamps: number[] = [];

  constructor(config: { limit: number; windowMs: number }) {
    this.limit = config.limit;
    this.windowMs = config.windowMs;
  }

  private prune(now: number): void {
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && (this.timestamps[0] ?? 0) <= cutoff) {
      this.timestamps.shift();
    }
  }

  tryAcquire(): boolean {
    const now = Date.now();
    this.prune(now);
    if (this.timestamps.length < this.limit) {
      this.timestamps.push(now);
      return true;
    }
    return false;
  }

  async acquire(): Promise<void> {
    while (!this.tryAcquire()) {
      const oldest = this.timestamps[0] ?? Date.now();
      const waitMs = Math.max(10, oldest + this.windowMs - Date.now());
      await sleep(waitMs);
    }
  }

  count(): number {
    this.prune(Date.now());
    return this.timestamps.length;
  }

  reset(): void {
    this.timestamps.length = 0;
  }
}

/** Per-connector rate limiter registry. */
export class ConnectorRateLimiterRegistry {
  private readonly limiters = new Map<string, TokenBucketRateLimiter>();

  getOrCreate(connectorId: string, config: RateLimiterConfig): TokenBucketRateLimiter {
    let limiter = this.limiters.get(connectorId);
    if (!limiter) {
      limiter = new TokenBucketRateLimiter(config);
      this.limiters.set(connectorId, limiter);
    }
    return limiter;
  }

  get(connectorId: string): TokenBucketRateLimiter | undefined {
    return this.limiters.get(connectorId);
  }

  remove(connectorId: string): void {
    this.limiters.delete(connectorId);
  }

  clear(): void {
    this.limiters.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
