import { z } from "zod";

export const RETRY_POLICIES = ["IMMEDIATE", "EXPONENTIAL_BACKOFF", "FIXED_DELAY", "NONE"] as const;

export type RetryPolicy = (typeof RETRY_POLICIES)[number];

/** Engine retry configuration for failed executions. */
export type EngineRetry = {
  retryId: string;
  engineId: string;
  engineName: string;
  policy: RetryPolicy;
  maxAttempts: number;
  currentAttempt: number;
  nextRetryAt: string | null;
  backoffSeconds: number;
  score: number;
};

export const engineRetrySchema = z.object({
  retryId: z.string().min(1),
  engineId: z.string().min(1),
  engineName: z.string().min(1),
  policy: z.enum(RETRY_POLICIES),
  maxAttempts: z.number().int().min(0),
  currentAttempt: z.number().int().min(0),
  nextRetryAt: z.string().datetime({ offset: true }).nullable(),
  backoffSeconds: z.number().min(0),
  score: z.number().min(0).max(100),
});

/** Validates an EngineRetry record shape. */
export function validateEngineRetry(value: unknown): EngineRetry {
  return engineRetrySchema.parse(value);
}
