import type { ToolRuntimeConfiguration } from "./configuration.js";
import type { ToolrtInput } from "./types.js";

export type RetryDecision = {
  shouldRetry: boolean;
  attempt: number;
  maxAttempts: number;
  errorClass: string | null;
  backoffMs: number;
};

export class RetryEngine {
  /**
   * Retry transient failures (input.simulateTransientFailure or errorClass transient).
   */
  decide(
    attempt: number,
    input: ToolrtInput,
    config: ToolRuntimeConfiguration,
    errorClass: string | null,
  ): RetryDecision {
    const maxAttempts = input.maxAttempts ?? config.defaultMaxAttempts;
    const isTransient =
      input.simulateTransientFailure === true || errorClass === "transient";

    const shouldRetry = isTransient && attempt < maxAttempts;

    return {
      shouldRetry,
      attempt,
      maxAttempts,
      errorClass: isTransient ? "transient" : errorClass,
      backoffMs: config.defaultBackoffMs,
    };
  }
}
