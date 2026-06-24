import { z } from "zod";

import { PRIORITY_LEVELS, type PriorityLevel } from "../../investigation-priority-intelligence/models/investigation-priority.js";
import { investigationTaskSchema, type InvestigationTask } from "./investigation-task.js";

export type InvestigationPlanId = string;

/** Autonomous investigation plan for a prioritized target. */
export type InvestigationPlan = {
  investigationPlanId: InvestigationPlanId;
  workspaceId: string;
  targetId: string;
  productId: string;
  priority: PriorityLevel;
  tasks: InvestigationTask[];
  estimatedValue: number;
  estimatedEffort: number;
  recommendedOrder: string[];
  createdAt: string;
  updatedAt: string;
};

export type InvestigationPlanCreateInput = Omit<
  InvestigationPlan,
  "investigationPlanId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const investigationPlanSchema = z.object({
  investigationPlanId: z.string().min(1),
  workspaceId: z.string().min(1),
  targetId: z.string().min(1),
  productId: z.string().min(1),
  priority: z.enum(PRIORITY_LEVELS),
  tasks: z.array(investigationTaskSchema).min(1),
  estimatedValue: z.number().min(0).max(100),
  estimatedEffort: z.number().min(0).max(100),
  recommendedOrder: z.array(z.string().min(1)).min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an InvestigationPlan record shape. */
export function validateInvestigationPlan(value: unknown): InvestigationPlan {
  return investigationPlanSchema.parse(value);
}
