import type { ApiProviderRegistration, ApirtInput } from "./types.js";

export type RetryDecision = {
  shouldRetry: boolean;
  attempt: number;
  maxAttempts: number;
  errorClass: string | null;
  backoffMs: number;
};

export class RetryPolicyEngine {
  /**
   * Retry on transient failures (input.simulateTransientFailure or errorClass transient).
   * Tracks attempts; returns whether another attempt should proceed.
   */
  decide(
    provider: ApiProviderRegistration,
    attempt: number,
    input: ApirtInput,
    errorClass: string | null,
  ): RetryDecision {
    const maxAttempts = provider.retryPolicy.maxRetries + 1;
    const isTransient =
      input.simulateTransientFailure === true || errorClass === "transient";

    const shouldRetry = isTransient && attempt < maxAttempts;

    return {
      shouldRetry,
      attempt,
      maxAttempts,
      errorClass: isTransient ? "transient" : errorClass,
      backoffMs: provider.retryPolicy.backoffMs,
    };
  }

  isTransientStatus(statusCode: number, provider: ApiProviderRegistration): boolean {
    return provider.retryPolicy.retryOnStatuses.includes(statusCode);
  }
}
