import { z } from "zod";

/** REAL-014 — Executive product optimization recommendations (debate only, no auto-execute). */
export const OPTIMIZATION_ACTIONS = [
  "IMPROVE_TITLE",
  "CHANGE_PRICE",
  "IMPROVE_MEDIA",
  "EXPAND_COUNTRY",
  "EXPAND_MARKETPLACE",
  "INCREASE_ADVERTISING",
  "ARCHIVE_PRODUCT",
  "CHANGE_SUPPLIER",
  "EXPAND_CATEGORY",
] as const;

export const optimizationRecommendationSchema = z.object({
  recommendationId: z.string(),
  productId: z.string(),
  action: z.enum(OPTIMIZATION_ACTIONS),
  recommendation: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  businessImpact: z.string(),
  expectedProfitIncreaseUsd: z.number(),
  risk: z.string(),
  expectedTimeDays: z.number().int(),
  autoExecuteBlocked: z.literal(true),
});

export type OptimizationRecommendation = z.infer<typeof optimizationRecommendationSchema>;

export const executiveProductOptimizationSchema = z.object({
  moduleId: z.literal("executive-product-optimization"),
  missionId: z.literal("REAL-014"),
  workspaceId: z.string(),
  companyId: z.string(),
  recommendations: z.array(optimizationRecommendationSchema),
  debateTopic: z.string(),
  computedAt: z.string().datetime({ offset: true }),
});

export type ExecutiveProductOptimization = z.infer<typeof executiveProductOptimizationSchema>;
