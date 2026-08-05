import type { ApiRuntimeConfiguration } from "./configuration.js";
import type { ApiStore } from "./api-store.js";
import type { RateLimitStatus } from "./types.js";

type WindowBucket = {
  windowStartMs: number;
  count: number;
};

export class RateLimiter {
  private buckets = new Map<string, WindowBucket>();

  resetForTesting() {
    this.buckets.clear();
  }

  /**
   * Per-api quota windows; enforce and set rateLimitStatus on the provider.
   */
  check(
    store: ApiStore,
    apiId: string,
    config: ApiRuntimeConfiguration,
    nowMs = Date.now(),
  ): { allowed: boolean; rateLimitStatus: RateLimitStatus; remaining: number } {
    const windowMs = config.rateLimitWindowMs;
    const max = config.maxRequestsPerWindow;
    let bucket = this.buckets.get(apiId);

    if (!bucket || nowMs - bucket.windowStartMs >= windowMs) {
      bucket = { windowStartMs: nowMs, count: 0 };
      this.buckets.set(apiId, bucket);
    }

    const nextCount = bucket.count + 1;
    let rateLimitStatus: RateLimitStatus = "ok";
    if (nextCount > max) {
      rateLimitStatus = "exceeded";
      store.updateProvider(apiId, { rateLimitStatus });
      return { allowed: false, rateLimitStatus, remaining: 0 };
    }
    if (nextCount >= Math.max(1, Math.floor(max * 0.8))) {
      rateLimitStatus = "approaching";
    }

    bucket.count = nextCount;
    this.buckets.set(apiId, bucket);
    store.updateProvider(apiId, { rateLimitStatus });
    return { allowed: true, rateLimitStatus, remaining: max - nextCount };
  }
}
