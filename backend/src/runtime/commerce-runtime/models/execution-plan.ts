import { z } from "zod";

import { RuntimeOperationSchema } from "./execution-request.js";

export const ExecutionPlanStepSchema = z.object({
  stepOrder: z.number(),
  kernel: z.string(),
  adapterId: z.string().optional(),
  action: z.string(),
  status: z.enum(["PLANNED", "BLOCKED"]),
  detail: z.string(),
});

export type ExecutionPlanStep = z.infer<typeof ExecutionPlanStepSchema>;

export const ExecutionPlanSchema = z.object({
  planId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  businessId: z.string().optional(),
  productId: z.string().optional(),
  marketplaceId: z.string().optional(),
  supplierId: z.string().optional(),
  operation: RuntimeOperationSchema,
  status: z.enum(["PLANNED", "QUEUED", "BLOCKED"]),
  executionBlocked: z.literal(true),
  steps: z.array(ExecutionPlanStepSchema),
  deterministicHash: z.string(),
  createdAt: z.string(),
});

export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

export type CreateExecutionPlanInput = {
  workspaceId: string;
  companyId: string;
  businessId?: string;
  productId?: string;
  marketplaceId?: string;
  supplierId?: string;
  operation: z.infer<typeof RuntimeOperationSchema>;
};
