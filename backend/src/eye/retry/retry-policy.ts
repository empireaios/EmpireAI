export type RetryPolicyConfig = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterRatio?: number;
};

export type RetryContext = {
  attempt: number;
  lastError: Error;
};

export const DEFAULT_RETRY_POLICY: RetryPolicyConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5_000,
  backoffMultiplier: 2,
  jitterRatio: 0.1,
};

/** Configurable retry with exponential backoff for failed polls/operations. */
export class RetryPolicy {
  readonly config: RetryPolicyConfig;

  constructor(config: Partial<RetryPolicyConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_POLICY, ...config };
  }

  computeDelayMs(attempt: number): number {
    const { initialDelayMs, maxDelayMs, backoffMultiplier, jitterRatio = 0 } = this.config;
    const exponential = initialDelayMs * backoffMultiplier ** Math.max(0, attempt - 1);
    const capped = Math.min(exponential, maxDelayMs);
    const jitter = capped * jitterRatio * (Math.random() * 2 - 1);
    return Math.max(0, Math.round(capped + jitter));
  }

  shouldRetry(attempt: number): boolean {
    return attempt < this.config.maxAttempts;
  }

  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (context: RetryContext) => void | Promise<void>,
  ): Promise<T> {
    let lastError: Error = new Error("Retry exhausted without attempt");
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!this.shouldRetry(attempt)) break;
        await onRetry?.({ attempt, lastError });
        await sleep(this.computeDelayMs(attempt));
      }
    }
    throw lastError;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
