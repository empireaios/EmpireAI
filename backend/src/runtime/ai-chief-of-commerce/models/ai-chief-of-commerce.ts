import { z } from "zod";

export const aiChiefOfCommerceDashboardSchema = z.object({
  moduleId: z.literal("ai-chief-of-commerce"),
  missionId: z.literal("REAL-031"),
  workspaceId: z.string(),
  companyId: z.string(),
  responsibilities: z.array(z.string()),
  revenueSummaryUsd: z.number(),
  profitSummaryUsd: z.number(),
  pricingInsights: z.array(z.string()),
  expansionInsights: z.array(z.string()),
  competitionInsights: z.array(z.string()),
  categoryGrowthInsights: z.array(z.string()),
  marketShareEstimatePercent: z.number(),
  supplierDecisions: z.array(z.object({ decision: z.string(), evidence: z.string() })),
  executiveRecommendations: z.array(z.object({ title: z.string(), evidence: z.string(), expectedProfitImpactUsd: z.number() })),
  recommendOnly: z.literal(true),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type AiChiefOfCommerceDashboard = z.infer<typeof aiChiefOfCommerceDashboardSchema>;
