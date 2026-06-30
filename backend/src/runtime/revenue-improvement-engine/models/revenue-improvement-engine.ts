import { z } from "zod";

/** REAL-017 — Revenue improvement proposal types. */
export const REVENUE_IMPROVEMENT_TYPES = [
  "INCREASE_PRICE",
  "REDUCE_PRICE",
  "BUNDLE_PRODUCTS",
  "CROSS_SELL",
  "UPSELL",
  "EXPAND_COUNTRIES",
  "EXPAND_MARKETPLACES",
  "REPLACE_SUPPLIER",
  "IMPROVE_MEDIA",
  "IMPROVE_LISTING",
  "ARCHIVE_PRODUCT",
  "NEW_OPPORTUNITY",
] as const;

export const revenueImprovementProposalSchema = z.object({
  proposalId: z.string(),
  improvementType: z.enum(REVENUE_IMPROVEMENT_TYPES),
  title: z.string(),
  productId: z.string().optional(),
  expectedRevenueGainUsd: z.number(),
  expectedProfitGainUsd: z.number(),
  confidence: z.number().min(0).max(100),
  businessJustification: z.string(),
  sourceModule: z.string(),
  autoExecuteBlocked: z.literal(true),
});

export type RevenueImprovementProposal = z.infer<typeof revenueImprovementProposalSchema>;

export const revenueImprovementEngineSchema = z.object({
  moduleId: z.literal("revenue-improvement-engine"),
  missionId: z.literal("REAL-017"),
  workspaceId: z.string(),
  companyId: z.string(),
  proposals: z.array(revenueImprovementProposalSchema),
  totalExpectedProfitGainUsd: z.number(),
  computedAt: z.string().datetime({ offset: true }),
});

export type RevenueImprovementEngine = z.infer<typeof revenueImprovementEngineSchema>;
