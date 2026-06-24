import { z } from "zod";

export const EXECUTION_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "RETRYING",
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

/** Runtime execution of an autonomous investigation plan. */
export type InvestigationExecution = {
  executionId: string;
  workspaceId: string;
  investigationPlanId: string;
  targetId: string;
  productId: string;
  status: ExecutionStatus;
  progressPercent: number;
  completedTaskCount: number;
  totalTaskCount: number;
  retryCount: number;
  maxRetries: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvestigationExecutionCreateInput = Omit<
  InvestigationExecution,
  "executionId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const investigationExecutionSchema = z.object({
  executionId: z.string().min(1),
  workspaceId: z.string().min(1),
  investigationPlanId: z.string().min(1),
  targetId: z.string().min(1),
  productId: z.string().min(1),
  status: z.enum(EXECUTION_STATUSES),
  progressPercent: z.number().min(0).max(100),
  completedTaskCount: z.number().int().min(0),
  totalTaskCount: z.number().int().min(1),
  retryCount: z.number().int().min(0),
  maxRetries: z.number().int().min(0),
  startedAt: isoTimestamp.nullable(),
  completedAt: isoTimestamp.nullable(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an InvestigationExecution record shape. */
export function validateInvestigationExecution(value: unknown): InvestigationExecution {
  return investigationExecutionSchema.parse(value);
}

/** Computes execution progress from completed task count. */
export function computeExecutionProgress(
  completedTaskCount: number,
  totalTaskCount: number,
): number {
  if (totalTaskCount === 0) return 0;
  return Math.min(100, Math.round((completedTaskCount / totalTaskCount) * 100));
}
