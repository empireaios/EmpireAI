import { z } from "zod";

export const RuntimeEnvironmentSchema = z.enum(["REAL", "SIMULATED"]);
export type RuntimeEnvironment = z.infer<typeof RuntimeEnvironmentSchema>;

export const ExecutionTraceStepSchema = z.object({
  stepId: z.string(),
  kernel: z.string(),
  action: z.string(),
  status: z.enum(["PLANNED", "BLOCKED", "SKIPPED"]),
  detail: z.string().optional(),
  recordedAt: z.string(),
});

export type ExecutionTraceStep = z.infer<typeof ExecutionTraceStepSchema>;

export const SoulTraceEntrySchema = z.object({
  memoryKey: z.string(),
  captured: z.boolean(),
  detail: z.string().optional(),
});

export type SoulTraceEntry = z.infer<typeof SoulTraceEntrySchema>;

export const RuntimeContextSchema = z.object({
  contextId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  businessId: z.string().optional(),
  brandId: z.string().optional(),
  marketplaceId: z.string().optional(),
  environment: RuntimeEnvironmentSchema,
  correlationId: z.string(),
  executionTrace: z.array(ExecutionTraceStepSchema),
  soulTrace: z.array(SoulTraceEntrySchema),
  createdAt: z.string(),
});

export type RuntimeContext = z.infer<typeof RuntimeContextSchema>;

export type CreateRuntimeContextInput = {
  workspaceId: string;
  companyId: string;
  businessId?: string;
  brandId?: string;
  marketplaceId?: string;
  environment?: RuntimeEnvironment;
  correlationId?: string;
};
