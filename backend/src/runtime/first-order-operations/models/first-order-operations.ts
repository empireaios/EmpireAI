import { z } from "zod";

export const FIRST_ORDER_MILESTONES = [
  "first_customer",
  "first_payment",
  "first_fulfillment",
  "first_tracking",
  "first_refund",
  "first_review",
  "first_repeat_customer",
] as const;

export const MILESTONE_STATUSES = ["PENDING", "COMPLETE"] as const;

export const firstOrderMilestoneSchema = z.object({
  milestoneId: z.enum(FIRST_ORDER_MILESTONES),
  label: z.string(),
  status: z.enum(MILESTONE_STATUSES),
  completedAt: z.string().nullable(),
  evidence: z.string().nullable(),
});

export const firstOrderOperationsSchema = z.object({
  moduleId: z.literal("first-order-operations"),
  missionId: z.literal("REAL-039"),
  workspaceId: z.string(),
  companyId: z.string(),
  milestones: z.array(firstOrderMilestoneSchema),
  completedCount: z.number(),
  totalCount: z.number(),
  allComplete: z.boolean(),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type FirstOrderMilestoneId = (typeof FIRST_ORDER_MILESTONES)[number];
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];
export type FirstOrderOperations = z.infer<typeof firstOrderOperationsSchema>;
