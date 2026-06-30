import { z } from "zod";

/** REAL-011 — Global distribution plan output. */
export const DISTRIBUTION_CLASSIFICATIONS = [
  "HIGH_CONFIDENCE",
  "EXPERIMENT",
  "WATCHLIST",
  "REJECT",
] as const;

export type DistributionClassification = (typeof DISTRIBUTION_CLASSIFICATIONS)[number];

export const distributionMarketplaceEntrySchema = z.object({
  countryCode: z.string(),
  countryName: z.string(),
  marketplaceId: z.string(),
  marketplaceName: z.string(),
  supplierWarehouseId: z.string().optional(),
  shippingAcceptable: z.boolean(),
  shippingScore: z.number().min(0).max(100),
  marketplaceFeePercent: z.number().min(0).max(100),
  expectedProfitUsd: z.number(),
  expectedRevenueUsd: z.number(),
  listingLocalizationRequired: z.boolean(),
  requiredApprovals: z.array(z.string()),
  risk: z.string(),
  priority: z.number().int().min(1),
  classification: z.enum(DISTRIBUTION_CLASSIFICATIONS),
  executiveRecommendation: z.string(),
});

export const globalDistributionPlanSchema = z.object({
  planId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  productId: z.string(),
  supplierProductId: z.string(),
  productTitle: z.string(),
  launchGloballyRecommended: z.boolean(),
  countriesFirst: z.array(z.string()),
  marketplacesFirst: z.array(z.string()),
  totalExpectedProfitUsd: z.number(),
  totalExpectedRevenueUsd: z.number(),
  supplierRisk: z.string(),
  customerRisk: z.string(),
  marketplaceRisk: z.string(),
  classification: z.enum(DISTRIBUTION_CLASSIFICATIONS),
  entries: z.array(distributionMarketplaceEntrySchema),
  livePublishAllowed: z.boolean(),
  blockers: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export type GlobalDistributionPlan = z.infer<typeof globalDistributionPlanSchema>;

export const globalDistributionDebateSchema = z.object({
  debateId: z.string(),
  planId: z.string(),
  topic: z.string(),
  chiefCards: z.array(z.object({
    executiveId: z.string(),
    title: z.string(),
    recommendation: z.string(),
    confidence: z.number(),
    evidence: z.array(z.string()),
    businessImpact: z.string(),
    risk: z.string(),
    expectedProfitUsd: z.number(),
    expectedTimeDays: z.number(),
    stance: z.enum(["PROCEED", "PROCEED_WITH_CAUTION", "DEFER", "REJECT"]),
    launchClassification: z.enum(DISTRIBUTION_CLASSIFICATIONS).optional(),
  })),
  soulRecommendation: z.object({
    summary: z.string(),
    unifiedRecommendation: z.string(),
    confidence: z.number(),
    expectedProfitUsd: z.number(),
    expectedTimeDays: z.number(),
    dissent: z.array(z.string()),
    launchClassification: z.enum(DISTRIBUTION_CLASSIFICATIONS),
    countriesFirst: z.array(z.string()),
    marketplacesFirst: z.array(z.string()),
  }),
  grandKingDecision: z.object({
    decision: z.enum(["PENDING", "APPROVE", "REJECT", "REQUEST_FURTHER_INVESTIGATION"]).nullable(),
    decidedAt: z.string().nullable(),
    rationale: z.string().optional(),
  }),
  missionId: z.literal("REAL-012"),
  computedAt: z.string().datetime({ offset: true }),
});

export type GlobalDistributionDebate = z.infer<typeof globalDistributionDebateSchema>;
