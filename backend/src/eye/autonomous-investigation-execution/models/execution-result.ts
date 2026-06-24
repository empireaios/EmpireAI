import { z } from "zod";

export const EXECUTION_RESULT_STATUSES = ["SUCCESS", "FAILED"] as const;
export type ExecutionResultStatus = (typeof EXECUTION_RESULT_STATUSES)[number];

/** Outcome of an investigation task execution attempt. */
export type ExecutionResult = {
  resultId: string;
  executionId: string;
  executionTaskId: string;
  taskId: string;
  status: ExecutionResultStatus;
  reason: string;
  signalId: string | null;
  pollingResultId: string | null;
  stepsCompleted: number;
  durationMs: number;
  executedAt: string;
};

export type ExecutionResultCreateInput = Omit<ExecutionResult, "resultId" | "executedAt"> & {
  executedAt?: string;
};

export const executionResultSchema = z.object({
  resultId: z.string().min(1),
  executionId: z.string().min(1),
  executionTaskId: z.string().min(1),
  taskId: z.string().min(1),
  status: z.enum(EXECUTION_RESULT_STATUSES),
  reason: z.string().min(1),
  signalId: z.string().nullable(),
  pollingResultId: z.string().nullable(),
  stepsCompleted: z.number().int().min(0),
  durationMs: z.number().min(0),
  executedAt: z.string().datetime({ offset: true }),
});

/** Validates an ExecutionResult record shape. */
export function validateExecutionResult(value: unknown): ExecutionResult {
  return executionResultSchema.parse(value);
}
