import { z } from "zod";

export const expansionTargetSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(["country", "marketplace", "supplier", "category"]),
  name: z.string(),
  revenueImpactUsd: z.number(),
  profitImpactUsd: z.number(),
  readinessScore: z.number(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  evidence: z.string(),
});

export const globalExpansionCommandSchema = z.object({
  moduleId: z.literal("global-expansion-command"),
  missionId: z.literal("REAL-065"),
  workspaceId: z.string(),
  companyId: z.string(),
  expansionTargets: z.array(expansionTargetSchema),
  executiveRecommendation: z.string(),
  topCategories: z.array(z.string()),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type GlobalExpansionCommand = z.infer<typeof globalExpansionCommandSchema>;
