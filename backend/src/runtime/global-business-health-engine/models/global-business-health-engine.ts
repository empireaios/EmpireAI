import { z } from "zod";

export const HEALTH_DIMENSIONS = [
  "empire",
  "countries",
  "marketplaces",
  "suppliers",
  "products",
  "revenue",
  "profit",
  "operations",
] as const;

export const healthScoreSchema = z.object({
  dimension: z.enum(HEALTH_DIMENSIONS),
  score: z.number().min(0).max(100),
  evidence: z.array(z.string()),
  recommendation: z.string(),
});

export const globalBusinessHealthEngineSchema = z.object({
  moduleId: z.literal("global-business-health-engine"),
  missionId: z.literal("REAL-061"),
  workspaceId: z.string(),
  companyId: z.string(),
  healthScores: z.array(healthScoreSchema),
  overallHealthScore: z.number().min(0).max(100),
  executiveSummary: z.string(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type HealthDimension = (typeof HEALTH_DIMENSIONS)[number];
export type GlobalBusinessHealthEngine = z.infer<typeof globalBusinessHealthEngineSchema>;
