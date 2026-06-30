import { z } from "zod";

export const driftItemSchema = z.object({
  itemId: z.string(),
  category: z.string(),
  description: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const productionHardeningSchema = z.object({
  moduleId: z.literal("production-hardening"),
  missionId: z.literal("REAL-047"),
  workspaceId: z.string(),
  companyId: z.string(),
  moduleCount: z.number(),
  validationSuiteCount: z.number(),
  validationSuites: z.array(z.string()),
  runtimeModules: z.array(z.string()),
  potentialDriftItems: z.array(driftItemSchema),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type ProductionHardening = z.infer<typeof productionHardeningSchema>;
