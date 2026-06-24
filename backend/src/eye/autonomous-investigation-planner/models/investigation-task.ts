import { z } from "zod";

import { investigationStepSchema, type InvestigationStep } from "./investigation-step.js";

export const INVESTIGATION_TASK_TYPES = [
  "CHECK_TREND",
  "CHECK_SUPPLIER",
  "CHECK_COMPETITOR",
  "CHECK_MARKETPLACE",
  "CHECK_SOCIAL",
  "CHECK_SEARCH",
  "CHECK_PRICING",
  "CHECK_DEMAND",
] as const;

export type InvestigationTaskType = (typeof INVESTIGATION_TASK_TYPES)[number];

/** Investigation work unit for a specific intelligence check. */
export type InvestigationTask = {
  taskId: string;
  taskType: InvestigationTaskType;
  title: string;
  description: string;
  connectorId: string | null;
  effortScore: number;
  valueScore: number;
  steps: InvestigationStep[];
};

export type InvestigationTaskInput = Omit<InvestigationTask, "taskId"> & {
  taskId?: string;
};

export const investigationTaskSchema = z.object({
  taskId: z.string().min(1),
  taskType: z.enum(INVESTIGATION_TASK_TYPES),
  title: z.string().min(1),
  description: z.string().min(1),
  connectorId: z.string().nullable(),
  effortScore: z.number().min(0).max(100),
  valueScore: z.number().min(0).max(100),
  steps: z.array(investigationStepSchema).min(1),
});

/** Validates an InvestigationTask record shape. */
export function validateInvestigationTask(value: unknown): InvestigationTask {
  return investigationTaskSchema.parse(value);
}
