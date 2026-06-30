import { z } from "zod";

export const EXPANSION_CATEGORIES = [
  "electronics", "gaming", "pets", "fitness", "beauty",
  "kitchen", "automotive", "baby", "home", "travel", "fashion",
] as const;

export const categoryExpansionSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  executiveAnalysis: z.string(),
  supplierAvailability: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]),
  marketplaceSuitability: z.number().min(0).max(100),
  countrySuitability: z.array(z.object({ country: z.string(), score: z.number() })),
  profitPotentialUsd: z.number(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  evidence: z.string(),
});

export const globalCategoryExpansionEngineDashboardSchema = z.object({
  moduleId: z.literal("global-category-expansion-engine"),
  missionId: z.literal("REAL-029"),
  workspaceId: z.string(),
  companyId: z.string(),
  categories: z.array(categoryExpansionSchema),
  topOpportunities: z.array(z.string()),
  executiveRecommendation: z.string(),
  recommendationEvidence: z.string(),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type CategoryExpansion = z.infer<typeof categoryExpansionSchema>;
export type GlobalCategoryExpansionEngineDashboard = z.infer<typeof globalCategoryExpansionEngineDashboardSchema>;
