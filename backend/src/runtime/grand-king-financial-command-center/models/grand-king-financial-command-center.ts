import { z } from "zod";

import { empireEconomicsDashboardSchema } from "../../empire-economics/models/empire-economics.js";

const breakdownRowSchema = z.object({
  label: z.string(),
  revenueUsd: z.number(),
  profitUsd: z.number(),
  sharePercent: z.number(),
});

export const grandKingFinancialCommandCenterSchema = z.object({
  moduleId: z.literal("grand-king-financial-command-center"),
  missionId: z.literal("REAL-020"),
  workspaceId: z.string(),
  companyId: z.string(),
  economics: empireEconomicsDashboardSchema,
  revenueUsd: z.number(),
  profitUsd: z.number(),
  costsUsd: z.number(),
  monthlyBurnUsd: z.number(),
  netMarginPercent: z.number(),
  profitTrend: z.array(z.object({ period: z.string(), profitUsd: z.number() })),
  forecastUsd: z.number(),
  revenueByCountry: z.array(breakdownRowSchema),
  revenueByMarketplace: z.array(breakdownRowSchema),
  revenueBySupplier: z.array(breakdownRowSchema),
  revenueByCategory: z.array(breakdownRowSchema),
  executiveRecommendations: z.array(z.object({
    recommendationId: z.string(),
    title: z.string(),
    evidence: z.string(),
    expectedProfitImpactUsd: z.number(),
  })),
  architectureComplete: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type GrandKingFinancialCommandCenter = z.infer<typeof grandKingFinancialCommandCenterSchema>;
