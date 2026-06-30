import { z } from "zod";

export const HumanActionPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const HumanActionAutomationStatusSchema = z.enum([
  "FULLY_AUTOMATABLE",
  "SEMI_AUTOMATABLE",
  "HUMAN_REQUIRED",
  "BLOCKED",
  "COMPLETED",
]);

export const HumanActionTaskSchema = z.object({
  taskId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  title: z.string(),
  category: z.string(),
  priority: HumanActionPrioritySchema,
  reason: z.string(),
  deadline: z.string().optional(),
  estimatedCompletionMinutes: z.number().int().min(0),
  blockingImpact: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "LAUNCH_BLOCKING"]),
  automationStatus: HumanActionAutomationStatusSchema,
  countryCode: z.string().optional(),
  providerId: z.string().optional(),
  journeyStageId: z.string().optional(),
  source: z.string(),
  createdAt: z.string(),
});

export type HumanActionTask = z.infer<typeof HumanActionTaskSchema>;

export const HumanActionQueueSchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  tasks: z.array(HumanActionTaskSchema),
  totalCount: z.number().int(),
  criticalCount: z.number().int(),
  computedAt: z.string(),
});

export type HumanActionQueue = z.infer<typeof HumanActionQueueSchema>;
