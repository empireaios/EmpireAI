import { z } from "zod";

export const aiChiefOfGrowthDashboardSchema = z.object({
  moduleId: z.literal("ai-chief-of-growth"),
  missionId: z.literal("REAL-032"),
  workspaceId: z.string(),
  companyId: z.string(),
  growthRecommendations: z.array(z.object({ title: z.string(), evidence: z.string(), priority: z.string() })),
  expansionTargets: z.array(z.string()),
  scalingPlan: z.array(z.string()),
  countryRollout: z.array(z.object({ country: z.string(), readiness: z.string() })),
  marketplaceRollout: z.array(z.object({ marketplace: z.string(), status: z.string() })),
  productRollout: z.array(z.object({ productId: z.string(), title: z.string(), action: z.string() })),
  recommendOnly: z.literal(true),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type AiChiefOfGrowthDashboard = z.infer<typeof aiChiefOfGrowthDashboardSchema>;
