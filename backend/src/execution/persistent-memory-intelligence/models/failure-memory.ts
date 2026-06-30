import { z } from "zod";

export const FAILURE_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM"] as const;

export type FailureSeverity = (typeof FAILURE_SEVERITIES)[number];

/** Recorded failure for long-term learning. */
export type FailureMemory = {
  memoryId: string;
  failureTitle: string;
  severity: FailureSeverity;
  category: string;
  description: string;
  rootCause: string;
  preventionAction: string;
  occurredAt: string;
  score: number;
};

export const failureMemorySchema = z.object({
  memoryId: z.string().min(1),
  failureTitle: z.string().min(1),
  severity: z.enum(FAILURE_SEVERITIES),
  category: z.string().min(1),
  description: z.string().min(1),
  rootCause: z.string().min(1),
  preventionAction: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  score: z.number().min(0).max(100),
});

/** Validates a FailureMemory record shape. */
export function validateFailureMemory(value: unknown): FailureMemory {
  return failureMemorySchema.parse(value);
}
