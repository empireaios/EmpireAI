import { z } from "zod";

import {
  INVESTIGATION_TASK_TYPES,
  type InvestigationTaskType,
} from "../../autonomous-investigation-planner/models/investigation-task.js";
import { EXECUTION_STATUSES, type ExecutionStatus } from "./investigation-execution.js";

/** Runtime state for a single investigation plan task. */
export type InvestigationExecutionTask = {
  executionTaskId: string;
  executionId: string;
  taskId: string;
  taskType: InvestigationTaskType;
  title: string;
  status: ExecutionStatus;
  assignedConnectorId: string | null;
  stepsCompleted: number;
  stepsTotal: number;
  progressPercent: number;
  pollingJobId: string | null;
  lastResultId: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type InvestigationExecutionTaskCreateInput = Omit<
  InvestigationExecutionTask,
  "executionTaskId" | "startedAt" | "completedAt" | "lastResultId" | "errorMessage" | "pollingJobId"
> & {
  pollingJobId?: string | null;
};

export const investigationExecutionTaskSchema = z.object({
  executionTaskId: z.string().min(1),
  executionId: z.string().min(1),
  taskId: z.string().min(1),
  taskType: z.enum(INVESTIGATION_TASK_TYPES),
  title: z.string().min(1),
  status: z.enum(EXECUTION_STATUSES),
  assignedConnectorId: z.string().nullable(),
  stepsCompleted: z.number().int().min(0),
  stepsTotal: z.number().int().min(1),
  progressPercent: z.number().min(0).max(100),
  pollingJobId: z.string().nullable(),
  lastResultId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: z.string().datetime({ offset: true }).nullable(),
  completedAt: z.string().datetime({ offset: true }).nullable(),
});

/** Validates an InvestigationExecutionTask record shape. */
export function validateInvestigationExecutionTask(value: unknown): InvestigationExecutionTask {
  return investigationExecutionTaskSchema.parse(value);
}
